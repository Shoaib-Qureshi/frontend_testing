const axios = require('axios');
const cheerio = require('cheerio');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract visible body text from a page's HTML, stripping nav/header/footer/scripts.
 * Returns the first `maxWords` words as a string.
 */
function extractVisibleText(html, maxWords = 400) {
  const $ = cheerio.load(html);

  $('script, style, nav, header, footer, aside, noscript, [aria-hidden="true"]').remove();

  const container =
    $('main').first().text() ||
    $('article').first().text() ||
    $('.entry-content, .post-content, #content, .content').first().text() ||
    $('body').text();

  return container
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, maxWords)
    .join(' ');
}

function extractJsonObject(raw) {
  const normalized = raw.trim();
  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : normalized;

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('LLM response was not valid JSON.');
    return JSON.parse(match[0]);
  }
}

async function callLlm(text, url, config) {
  const response = await axios.post(
    config.openRouter.apiUrl,
    {
      model: config.openRouter.model,
      temperature: 0.1,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional content editor and proofreader. Your job is to find spelling mistakes, grammatical errors, and unclear or poorly written sentences in website copy. Return ONLY valid JSON — no prose, no markdown fences.',
        },
        {
          role: 'user',
          content: [
            `Review the following webpage content from: ${url}`,
            '',
            'Find and list ALL of the following:',
            '1. Spelling mistakes (exact misspelled word + correction)',
            '2. Grammatical errors (the incorrect phrase + corrected version)',
            '3. Sentences or phrases that are confusing, too vague, or need rewording',
            '',
            'Return this exact JSON structure:',
            '{',
            '  "issues": [',
            '    { "type": "spelling", "text": "misspeled", "suggestion": "misspelled", "context": "sentence containing the word" },',
            '    { "type": "grammar", "text": "we was there", "suggestion": "we were there", "context": "full phrase for context" },',
            '    { "type": "clarity", "text": "the thing does stuff", "suggestion": "Rewrite as: describe the feature clearly", "context": "sentence for context" }',
            '  ],',
            '  "overallQuality": "good" | "fair" | "poor"',
            '}',
            '',
            'If no issues are found, return { "issues": [], "overallQuality": "good" }.',
            '',
            'Content to review:',
            text,
          ].join('\n'),
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

  const raw =
    response.data?.choices?.[0]?.message?.content;

  if (!raw) throw new Error('Empty response from LLM.');

  const parsed = extractJsonObject(typeof raw === 'string' ? raw : JSON.stringify(raw));

  return {
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    overallQuality: parsed.overallQuality || 'unknown',
  };
}

async function analyzeContent(crawlResult, config) {
  const contentReviewLimit = Number.isFinite(Number(config.contentReviewLimit))
    ? Math.max(0, Number(config.contentReviewLimit))
    : 5;

  if (contentReviewLimit <= 0) {
    return {
      status: 'skipped',
      reason: 'Content review was disabled for this audit.',
      pages: [],
      summary: { pagesAnalyzed: 0, pagesWithIssues: 0, totalIssues: 0 },
    };
  }

  if (!config.openRouter.apiKey) {
    return {
      status: 'skipped',
      reason: 'No OPENROUTER_API_KEY configured.',
      pages: [],
      summary: { pagesAnalyzed: 0, pagesWithIssues: 0, totalIssues: 0 },
    };
  }

  // Analyze the homepage first, then the remaining pages up to the selected limit.
  const htmlPages = crawlResult.pages.filter((p) => p.isHtml && p.html);
  const homepage = htmlPages.find(
    (p) => p.url === crawlResult.startUrl || p.finalUrl === crawlResult.startUrl
  );
  const others = htmlPages.filter((p) => p !== homepage);
  const pagesToAnalyze = [homepage, ...others].filter(Boolean).slice(0, contentReviewLimit);

  const results = [];

  for (let i = 0; i < pagesToAnalyze.length; i++) {
    const page = pagesToAnalyze[i];
    const url = page.finalUrl || page.url;
    const text = extractVisibleText(page.html);

    // Skip pages with very little text — not worth analysing
    if (text.split(' ').length < 25) {
      continue;
    }

    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const analysis = await callLlm(text, url, config);
        results.push({ url, issues: analysis.issues, overallQuality: analysis.overallQuality });
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < 3) await sleep(1000 * attempt);
      }
    }

    if (lastError) {
      results.push({
        url,
        issues: [],
        overallQuality: 'unknown',
        error: lastError.message,
      });
    }

    // Avoid hammering the API between pages
    if (i < pagesToAnalyze.length - 1) {
      await sleep(600);
    }
  }

  return {
    status: 'success',
    pages: results,
    summary: {
      pagesAnalyzed: results.length,
      pagesWithIssues: results.filter((p) => p.issues.length > 0).length,
      totalIssues: results.reduce((sum, p) => sum + p.issues.length, 0),
      spellingIssues: results.reduce(
        (sum, p) => sum + p.issues.filter((i) => i.type === 'spelling').length,
        0
      ),
      grammarIssues: results.reduce(
        (sum, p) => sum + p.issues.filter((i) => i.type === 'grammar').length,
        0
      ),
      clarityIssues: results.reduce(
        (sum, p) => sum + p.issues.filter((i) => i.type === 'clarity').length,
        0
      ),
    },
  };
}

module.exports = { analyzeContent };
