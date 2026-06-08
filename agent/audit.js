const { crawlSite } = require('./crawler');
const { analyzeSeo } = require('./seo');
const { runPerformanceAudit } = require('./performance');
const { analyzeUx } = require('./ux');
const { analyzeSecurity } = require('./security');
const { analyzeContent } = require('./content');
const { generateReports } = require('./report');
const logger = require('./logger');

function normalizeTargetUrl(rawUrl) {
  const parsed = new URL(rawUrl);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported.');
  }

  parsed.hash = '';
  return parsed.toString();
}

function createStepError(error) {
  return {
    status: 'error',
    message: error.message || 'Unknown error',
  };
}

async function runSafeStep(label, callback, onProgress) {
  try {
    return await callback();
  } catch (error) {
    onProgress(`${label} failed: ${error.message}`);
    return createStepError(error);
  }
}

function buildSummary(crawler, seo, performance, ux, security) {
  return {
    pagesCrawled: crawler.summary.pagesCrawled,
    linksChecked: crawler.summary.linksChecked,
    brokenLinks: crawler.summary.brokenCount,
    redirects: crawler.summary.redirectCount,
    seoIssues: {
      missingTitles: seo.summary ? seo.summary.missingTitles : 0,
      missingDescriptions: seo.summary ? seo.summary.missingDescriptions : 0,
      pagesWithoutH1: seo.summary ? seo.summary.noH1 : 0,
      imagesWithoutAlt: seo.summary ? seo.summary.imagesWithoutAlt : 0,
    },
    performance:
      performance.status === 'success' ? performance.scores : 'Performance audit failed',
    uxStatus: ux.status,
    securityFindings: security.summary ? security.summary.totalFindings : 0,
  };
}

async function runAudit(rawTargetUrl, config, options = {}) {
  const onProgress =
    typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const targetUrl = normalizeTargetUrl(rawTargetUrl);

  onProgress(`[1/6] Crawling ${targetUrl}`);
  logger.info(`Starting crawl: ${targetUrl}`);
  const crawlResult = await crawlSite(targetUrl, config);

  if (!crawlResult.pages.length) {
    throw new Error('Crawl failed: no pages could be audited.');
  }

  logger.info(`Crawl complete: ${crawlResult.summary.pagesCrawled} page(s)`);
  onProgress(
    `[2/6] Running SEO analysis and Lighthouse audit in parallel (${crawlResult.summary.pagesCrawled} page(s))`
  );

  const [seoResult, performanceResult] = await Promise.all([
    runSafeStep('SEO analysis', () => analyzeSeo(crawlResult), onProgress),
    runSafeStep('Performance audit', () => runPerformanceAudit(targetUrl, config), onProgress),
  ]);

  logger.info('SEO and performance steps complete');
  onProgress('[4/6] Running UX analysis and security checks in parallel');

  const [uxResult, securityResult, contentResult] = await Promise.all([
    runSafeStep(
      'UX analysis',
      () =>
        analyzeUx({
          url: targetUrl,
          crawlResult,
          seoResult: seoResult.status === 'success' ? seoResult : { pages: [], summary: {} },
          performanceResult,
          config,
        }),
      onProgress
    ),
    runSafeStep('Security analysis', () => analyzeSecurity(crawlResult), onProgress),
    runSafeStep('Content analysis', () => analyzeContent(crawlResult, config), onProgress),
  ]);

  logger.info('UX and security steps complete');

  const finalReport = {
    target: targetUrl,
    generatedAt: new Date().toISOString(),
    summary: buildSummary(
      crawlResult,
      seoResult.status === 'success' ? seoResult : { summary: null },
      performanceResult,
      uxResult,
      securityResult.status === 'success' ? securityResult : { summary: null }
    ),
    crawler: crawlResult,
    seo: seoResult,
    performance: performanceResult,
    ux: uxResult,
    security: securityResult,
    content: contentResult,
  };

  onProgress('[6/6] Writing reports');
  const outputs = await generateReports(finalReport, config);
  onProgress(`JSON report: ${outputs.jsonPath}`);
  onProgress(`HTML report: ${outputs.htmlPath}`);

  return {
    targetUrl,
    report: finalReport,
    outputs,
  };
}

module.exports = {
  normalizeTargetUrl,
  runAudit,
};
