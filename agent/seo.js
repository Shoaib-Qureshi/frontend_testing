const axios = require('axios');
const cheerio = require('cheerio');

function getTextList($, selector) {
  return $(selector)
    .map((index, element) => $(element).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean);
}

function analyzePageSeo(page) {
  const $ = cheerio.load(page.html);

  const title = $('title').first().text().replace(/\s+/g, ' ').trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const normalizedDescription = metaDescription.replace(/\s+/g, ' ').trim();
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const h1 = getTextList($, 'h1');
  const h2 = getTextList($, 'h2');
  const imagesWithoutAlt = $('img')
    .map((index, image) => {
      const alt = $(image).attr('alt');

      if (typeof alt === 'string' && alt.trim()) {
        return null;
      }

      return {
        src: $(image).attr('src') || '',
      };
    })
    .get()
    .filter(Boolean);

  const issues = [];

  if (!title) {
    issues.push('Missing title tag');
  }

  if (!normalizedDescription) {
    issues.push('Missing meta description');
  }

  if (!canonical.trim()) {
    issues.push('Missing canonical link');
  }

  if (h1.length === 0) {
    issues.push('Missing H1');
  }

  if (h1.length > 1) {
    issues.push('Multiple H1 tags');
  }

  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
  }

  return {
    url: page.finalUrl || page.url,
    title,
    titleLength: title.length,
    metaDescription: normalizedDescription,
    descriptionLength: normalizedDescription.length,
    canonical: canonical.trim(),
    h1,
    h2,
    imagesWithoutAlt,
    issues,
  };
}

function detectDuplicateContent(pages) {
  const duplicates = [];

  for (const field of ['title', 'metaDescription']) {
    const grouped = new Map();

    for (const page of pages) {
      const value = page[field] ? page[field].trim() : '';

      if (!value) {
        continue;
      }

      if (!grouped.has(value)) {
        grouped.set(value, []);
      }

      grouped.get(value).push(page.url);
    }

    for (const [value, urls] of grouped.entries()) {
      if (urls.length >= 2) {
        duplicates.push({ field, value, urls });
      }
    }
  }

  return duplicates;
}

async function fetchUrl(url, timeoutMs = 8000) {
  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      validateStatus: () => true,
      maxRedirects: 3,
    });
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: null, error: error.message };
  }
}

async function checkSitemapAndRobots(startUrl) {
  const origin = new URL(startUrl).origin;
  const issues = [];
  const sitemap = { found: false, url: null };
  const robots = { found: false, blocksCrawlers: false };

  for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
    const resp = await fetchUrl(`${origin}${path}`);
    if (resp.status === 200) {
      sitemap.found = true;
      sitemap.url = `${origin}${path}`;
      break;
    }
  }
  if (!sitemap.found) {
    issues.push('No sitemap found at /sitemap.xml or /sitemap_index.xml');
  }

  const robotsResp = await fetchUrl(`${origin}/robots.txt`);
  if (robotsResp.status === 200) {
    robots.found = true;
    const text = typeof robotsResp.data === 'string' ? robotsResp.data : '';
    if (/Disallow:\s*\/\s*$/m.test(text)) {
      robots.blocksCrawlers = true;
      issues.push('robots.txt blocks all crawlers with "Disallow: /"');
    }
  } else {
    issues.push('No robots.txt found');
  }

  return { sitemap, robots, issues };
}

async function analyzeSeo(crawlResult) {
  const pages = crawlResult.pages
    .filter((page) => page.isHtml && page.html)
    .map((page) => analyzePageSeo(page));

  const duplicates = detectDuplicateContent(pages);
  const sitemapRobots = await checkSitemapAndRobots(crawlResult.startUrl);

  return {
    status: 'success',
    pages,
    duplicates,
    sitemapRobots,
    summary: {
      pagesAnalyzed: pages.length,
      missingTitles: pages.filter((page) => !page.title).length,
      missingDescriptions: pages.filter((page) => !page.metaDescription).length,
      multipleH1: pages.filter((page) => page.h1.length > 1).length,
      noH1: pages.filter((page) => page.h1.length === 0).length,
      missingCanonical: pages.filter((page) => !page.canonical).length,
      imagesWithoutAlt: pages.reduce(
        (total, page) => total + page.imagesWithoutAlt.length,
        0
      ),
      duplicateContent: duplicates.length,
      sitemapFound: sitemapRobots.sitemap.found,
      robotsTxtFound: sitemapRobots.robots.found,
    },
  };
}

module.exports = {
  analyzeSeo,
};
