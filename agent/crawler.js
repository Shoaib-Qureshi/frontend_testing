const { chromium } = require('playwright');

function canonicalizeUrl(rawUrl, baseUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl, baseUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    url.hash = '';

    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    return url.toString();
  } catch (error) {
    return null;
  }
}

function isSameOrigin(url, origin) {
  try {
    return new URL(url).origin === origin;
  } catch (error) {
    return false;
  }
}

function looksLikeHtml(contentType) {
  if (!contentType) {
    return true;
  }

  return (
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml+xml')
  );
}

async function getResponseHeaders(response) {
  if (!response) {
    return {};
  }

  try {
    if (typeof response.allHeaders === 'function') {
      return await response.allHeaders();
    }

    return response.headers();
  } catch (error) {
    return {};
  }
}

function buildRedirectChain(response) {
  const chain = [];

  if (!response) {
    return chain;
  }

  let request = response.request();

  while (request) {
    chain.unshift(request.url());
    request = request.redirectedFrom();
  }

  return chain;
}

function normalizeLinks(rawLinks, currentUrl, origin) {
  const deduped = new Map();

  for (const rawLink of rawLinks) {
    const normalizedUrl = canonicalizeUrl(rawLink.href, currentUrl);

    if (!normalizedUrl || !isSameOrigin(normalizedUrl, origin)) {
      continue;
    }

    if (!deduped.has(normalizedUrl)) {
      deduped.set(normalizedUrl, {
        url: normalizedUrl,
        text: rawLink.text || '',
      });
    }
  }

  return Array.from(deduped.values());
}

async function extractPageSnapshot(page, currentUrl, origin) {
  const rawLinks = await page.$$eval('a[href]', (anchors) =>
    anchors
      .map((anchor) => ({
        href: anchor.getAttribute('href'),
        text: (anchor.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      }))
      .filter((item) => item.href)
  );

  const links = normalizeLinks(rawLinks, currentUrl, origin);
  const html = await page.content();
  const title = await page.title();
  const textSnippet = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : '';
    return text.replace(/\s+/g, ' ').trim().slice(0, 4000);
  });

  return {
    html,
    links,
    textSnippet,
    title,
  };
}

async function crawlSinglePage(page, url, origin, config) {
  let response = null;
  let navigationError = null;

  try {
    response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.navigationTimeoutMs,
    });

    await page
      .waitForLoadState('networkidle', {
        timeout: Math.min(config.navigationTimeoutMs, 5000),
      })
      .catch(() => {});
  } catch (error) {
    navigationError = error;
  }

  const finalUrl = canonicalizeUrl(page.url() || url, url) || url;
  const responseHeaders = await getResponseHeaders(response);
  const contentType = String(
    responseHeaders['content-type'] || responseHeaders['Content-Type'] || ''
  ).toLowerCase();
  const status = response ? response.status() : null;
  const redirectChain = buildRedirectChain(response);
  const isHtml = !navigationError && looksLikeHtml(contentType);

  let title = '';
  let html = '';
  let textSnippet = '';
  let links = [];

  if (isHtml && isSameOrigin(finalUrl, origin)) {
    try {
      const snapshot = await extractPageSnapshot(page, url, origin);
      title = snapshot.title;
      html = snapshot.html;
      textSnippet = snapshot.textSnippet;
      links = snapshot.links;
    } catch (error) {
      navigationError = navigationError || error;
    }
  }

  return {
    url,
    finalUrl,
    status,
    title,
    links,
    responseHeaders,
    contentType,
    html,
    textSnippet,
    navigationError: navigationError ? navigationError.message : null,
    redirectChain,
    failed: Boolean(navigationError) || (typeof status === 'number' && status >= 400),
    isHtml,
  };
}

async function crawlSite(startUrl, config) {
  const origin = new URL(startUrl).origin;
  const queue = [startUrl];
  const queued = new Set(queue);
  const visited = new Set();
  const pages = [];
  const linkMap = new Map();
  const pageMap = new Map();
  const brokenLinks = [];
  const redirects = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: config.userAgent,
  });
  const page = await context.newPage();

  try {
    while (queue.length > 0 && pages.length < config.maxPages) {
      const currentUrl = queue.shift();
      queued.delete(currentUrl);

      if (visited.has(currentUrl)) {
        continue;
      }

      visited.add(currentUrl);

      const pageResult = await crawlSinglePage(page, currentUrl, origin, config);
      pages.push(pageResult);
      pageMap.set(currentUrl, pageResult);

      if (pageResult.redirectChain.length > 1) {
        redirects.push({
          url: currentUrl,
          finalUrl: pageResult.finalUrl,
          chain: pageResult.redirectChain,
          status: pageResult.status,
        });
      }

      if (pageResult.failed) {
        brokenLinks.push({
          url: currentUrl,
          finalUrl: pageResult.finalUrl,
          status: pageResult.status,
          error:
            pageResult.navigationError ||
            (typeof pageResult.status === 'number'
              ? `HTTP ${pageResult.status}`
              : 'Navigation failed'),
        });
      }

      for (const link of pageResult.links) {
        let entry = linkMap.get(link.url);

        if (!entry) {
          entry = {
            url: link.url,
            sources: [],
            sampleText: link.text || '',
          };
          linkMap.set(link.url, entry);
        }

        if (!entry.sources.includes(currentUrl)) {
          entry.sources.push(currentUrl);
        }

        if (!entry.sampleText && link.text) {
          entry.sampleText = link.text;
        }

        if (
          !visited.has(link.url) &&
          !queued.has(link.url) &&
          visited.size + queue.length < config.maxPages
        ) {
          queue.push(link.url);
          queued.add(link.url);
        }
      }
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  for (const bl of brokenLinks) {
    const entry = linkMap.get(bl.url);
    bl.foundOn = entry ? entry.sources.slice(0, 3) : [];
  }

  for (const rd of redirects) {
    const entry = linkMap.get(rd.url);
    rd.foundOn = entry ? entry.sources.slice(0, 3) : [];
  }

  const internalLinks = Array.from(linkMap.values()).map((entry) => {
    const linkedPage = pageMap.get(entry.url);

    return {
      url: entry.url,
      sources: entry.sources,
      sampleText: entry.sampleText,
      status: linkedPage ? linkedPage.status : null,
      finalUrl: linkedPage ? linkedPage.finalUrl : null,
    };
  });

  return {
    startUrl,
    pages,
    internalLinks,
    brokenLinks,
    redirects,
    summary: {
      pagesCrawled: pages.length,
      linksChecked: internalLinks.length,
      brokenCount: brokenLinks.length,
      redirectCount: redirects.length,
    },
  };
}

module.exports = {
  crawlSite,
};
