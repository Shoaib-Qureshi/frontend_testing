const axios = require('axios');

function normalizeMessageContent(content) {
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('\n');
  }

  return typeof content === 'string' ? content : '';
}

function extractJsonObject(text) {
  const normalized = text.trim();

  if (!normalized) {
    throw new Error('OpenRouter returned an empty response.');
  }

  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : normalized;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);

    if (!objectMatch) {
      throw new Error('OpenRouter response was not valid JSON.');
    }

    return JSON.parse(objectMatch[0]);
  }
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function getHomepageContext(url, crawlResult, seoResult) {
  const homepage =
    crawlResult.pages.find((page) => page.url === url || page.finalUrl === url) ||
    crawlResult.pages[0] ||
    null;

  const seoPage =
    seoResult.pages.find(
      (page) =>
        homepage && (page.url === homepage.url || page.url === homepage.finalUrl)
    ) ||
    seoResult.pages[0] ||
    null;

  return {
    homepage,
    seoPage,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callLlm(payload, url, config) {
  const response = await axios.post(
    config.openRouter.apiUrl,
    {
      model: config.openRouter.model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior UX auditor. Return only valid JSON with these keys: overallAssessment, uiIssues, ctaImprovements, layoutSuggestions, priorityFixes. The list fields must each be arrays of short strings.',
        },
        {
          role: 'user',
          content: `Audit this website summary for frontend UX quality and improvement opportunities:\n${JSON.stringify(
            payload,
            null,
            2
          )}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.openRouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': url,
        'X-Title': 'Agentic Frontend Audit',
      },
      timeout: config.requestTimeoutMs,
    }
  );

  return response;
}

async function analyzeUx({ url, crawlResult, seoResult, performanceResult, config }) {
  if (!config.openRouter.apiKey) {
    return {
      status: 'skipped',
      reason: 'Missing OPENROUTER_API_KEY',
    };
  }

  const { homepage, seoPage } = getHomepageContext(url, crawlResult, seoResult);
  const payload = {
    url,
    title: seoPage ? seoPage.title : homepage ? homepage.title : '',
    metaDescription: seoPage ? seoPage.metaDescription : '',
    headings: {
      h1: seoPage ? seoPage.h1 : [],
      h2: seoPage ? seoPage.h2 : [],
    },
    textExcerpt: homepage ? homepage.textSnippet : '',
    siteSummary: {
      pagesCrawled: crawlResult.summary.pagesCrawled,
      brokenLinks: crawlResult.summary.brokenCount,
      redirects: crawlResult.summary.redirectCount,
      missingTitles: seoResult.summary.missingTitles,
      missingDescriptions: seoResult.summary.missingDescriptions,
      imagesWithoutAlt: seoResult.summary.imagesWithoutAlt,
    },
  };

  // Enrich payload with performance metrics when available
  if (performanceResult && performanceResult.status === 'success') {
    payload.performanceScores = performanceResult.scores;
    payload.performanceMetrics = performanceResult.metrics;
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await callLlm(payload, url, config);
      const content = normalizeMessageContent(
        response.data?.choices?.[0]?.message?.content
      );
      const parsed = extractJsonObject(content);

      return {
        status: 'success',
        model: config.openRouter.model,
        overallAssessment: String(parsed.overallAssessment || '').trim(),
        uiIssues: normalizeStringList(parsed.uiIssues),
        ctaImprovements: normalizeStringList(parsed.ctaImprovements),
        layoutSuggestions: normalizeStringList(parsed.layoutSuggestions),
        priorityFixes: normalizeStringList(parsed.priorityFixes),
      };
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await sleep(1000 * attempt);
      }
    }
  }

  return {
    status: 'error',
    message:
      lastError.response?.data?.error?.message || lastError.message || 'UX analysis failed.',
    model: config.openRouter.model,
  };
}

module.exports = {
  analyzeUx,
};
