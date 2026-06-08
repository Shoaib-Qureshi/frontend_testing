const net = require('net');
const { chromium } = require('playwright');

const PERFORMANCE_METRIC_AUDIT_IDS = new Set([
  'first-contentful-paint',
  'largest-contentful-paint',
  'speed-index',
  'interactive',
  'total-blocking-time',
  'cumulative-layout-shift',
]);

const LIGHTHOUSE_PROFILES = {
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      disabled: false,
    },
    label: 'Simulated mobile profile',
  },
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    label: 'Desktop profile',
  },
};

function formatScore(score) {
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

function normalizeAuditText(value) {
  return typeof value === 'string'
    ? value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
    : null;
}

function stripMarkdownLinks(value) {
  return normalizeAuditText(value)?.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') || null;
}

function getMetric(audits, key) {
  return audits[key] ? normalizeAuditText(audits[key].displayValue) : null;
}

function getNumericSavings(audit) {
  const details = audit?.details;
  const savingsMs =
    typeof details?.overallSavingsMs === 'number' ? Math.round(details.overallSavingsMs) : 0;
  const savingsBytes =
    typeof details?.overallSavingsBytes === 'number' ? Math.round(details.overallSavingsBytes) : 0;

  return {
    savingsMs,
    savingsBytes,
  };
}

function inferSeverity(score, savingsMs) {
  if ((typeof score === 'number' && score <= 49) || savingsMs >= 1000) {
    return 'high';
  }

  return 'medium';
}

function getPerformanceIssues(lhr) {
  const auditRefs = Array.isArray(lhr?.categories?.performance?.auditRefs)
    ? lhr.categories.performance.auditRefs
    : [];

  const items = auditRefs
    .map((auditRef) => {
      const audit = lhr.audits[auditRef.id];

      if (!audit || typeof audit.score !== 'number') {
        return null;
      }

      if (
        audit.scoreDisplayMode === 'notApplicable' ||
        audit.scoreDisplayMode === 'manual' ||
        audit.scoreDisplayMode === 'informative' ||
        PERFORMANCE_METRIC_AUDIT_IDS.has(audit.id)
      ) {
        return null;
      }

      const { savingsMs, savingsBytes } = getNumericSavings(audit);

      if (audit.score >= 0.9 && savingsMs <= 0 && savingsBytes <= 0) {
        return null;
      }

      const score = formatScore(audit.score);

      return {
        id: audit.id,
        title: normalizeAuditText(audit.title) || audit.id,
        score,
        description: stripMarkdownLinks(audit.description),
        displayValue: normalizeAuditText(audit.displayValue),
        weight: typeof auditRef.weight === 'number' ? auditRef.weight : 0,
        group: auditRef.group || null,
        savingsMs,
        savingsBytes,
        severity: inferSeverity(score, savingsMs),
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.savingsMs !== left.savingsMs) {
        return right.savingsMs - left.savingsMs;
      }

      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }

      return (left.score ?? 100) - (right.score ?? 100);
    });

  const slicedItems = items.slice(0, 5);

  return {
    totalCount: items.length,
    displayCount: slicedItems.length,
    items: slicedItems,
  };
}

function getEnvironment(config, lhr) {
  const formFactor = config?.lighthouse?.formFactor || 'mobile';
  const profile = LIGHTHOUSE_PROFILES[formFactor] || LIGHTHOUSE_PROFILES.mobile;

  return {
    formFactor: profile.formFactor,
    profileLabel: profile.label,
    throttlingMethod: config?.lighthouse?.throttlingMethod || 'simulate',
    storageReset: true,
    lighthouseVersion: lhr?.lighthouseVersion || null,
  };
}

function getLighthouseFlags(port, config) {
  const formFactor = config?.lighthouse?.formFactor || 'mobile';
  const profile = LIGHTHOUSE_PROFILES[formFactor] || LIGHTHOUSE_PROFILES.mobile;

  return {
    port,
    output: 'json',
    logLevel: 'error',
    formFactor: profile.formFactor,
    screenEmulation: profile.screenEmulation,
    throttlingMethod: config?.lighthouse?.throttlingMethod || 'simulate',
    disableStorageReset: false,
    maxWaitForLoad: config?.navigationTimeoutMs || 30000,
    onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
  };
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

async function loadLighthouse() {
  const lighthouseModule = await import('lighthouse');
  return lighthouseModule.default || lighthouseModule;
}

async function runPerformanceAudit(url, config) {
  let browser;

  try {
    const lighthouse = await loadLighthouse();
    const port = await getAvailablePort();

    browser = await chromium.launch({
      headless: true,
      args: [`--remote-debugging-port=${port}`],
    });

    const runnerResult = await lighthouse(url, getLighthouseFlags(port, config));

    const { lhr } = runnerResult;
    const performanceIssues = getPerformanceIssues(lhr);

    return {
      status: 'success',
      environment: getEnvironment(config, lhr),
      scores: {
        performance: formatScore(lhr.categories.performance?.score),
        seo: formatScore(lhr.categories.seo?.score),
        accessibility: formatScore(lhr.categories.accessibility?.score),
        bestPractices: formatScore(lhr.categories['best-practices']?.score),
      },
      metrics: {
        firstContentfulPaint: getMetric(lhr.audits, 'first-contentful-paint'),
        largestContentfulPaint: getMetric(lhr.audits, 'largest-contentful-paint'),
        cumulativeLayoutShift: getMetric(lhr.audits, 'cumulative-layout-shift'),
        totalBlockingTime: getMetric(lhr.audits, 'total-blocking-time'),
      },
      failingAudits: performanceIssues.items,
      issueSummary: {
        totalCount: performanceIssues.totalCount,
        displayCount: performanceIssues.displayCount,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      environment: null,
      scores: null,
      metrics: null,
      failingAudits: [],
      issueSummary: {
        totalCount: 0,
        displayCount: 0,
      },
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = {
  runPerformanceAudit,
};
