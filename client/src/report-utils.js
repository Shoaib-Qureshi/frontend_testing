export const loadingMessages = [
  'Launching crawler agent',
  'Mapping internal pages',
  'Running SEO and Lighthouse in parallel',
  'Reviewing security headers and mixed content',
  'Running AI UX analysis',
  'Packaging the dashboard report',
];

export const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'performance', label: 'Performance', icon: 'performance' },
  { id: 'seo', label: 'SEO', icon: 'seo' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'crawl', label: 'Crawl', icon: 'crawl' },
  { id: 'stream', label: 'Audit Stream', icon: 'stream' },
];

export const tabMeta = {
  dashboard: {
    eyebrow: 'Audit Overview',
    title: 'Audit Overview',
    subtitle: 'Performance, SEO, security, and crawl signals from the latest run.',
  },
  performance: {
    eyebrow: 'Performance Audit',
    title: 'Performance Audit Result',
    subtitle: 'Speed, rendering, and bottleneck analysis generated from Lighthouse.',
  },
  seo: {
    eyebrow: 'SEO Precision Audit',
    title: 'SEO Precision Audit',
    subtitle: 'Metadata, headings, content structure, and crawl indexing quality.',
  },
  security: {
    eyebrow: 'Security Analysis',
    title: 'Security Analysis',
    subtitle: 'Transport, headers, mixed content, and browser policy review.',
  },
  crawl: {
    eyebrow: 'Crawl Analysis',
    title: 'Site Structure.',
    subtitle: 'Internal routing, link flow, redirect pressure, and broken entry points.',
  },
  stream: {
    eyebrow: 'Live Monitoring Active',
    title: 'Audit Stream',
    subtitle: 'Execution logs and operational telemetry from the latest audit pass.',
  },
  documentation: {
    eyebrow: 'Documentation',
    title: 'About Frontend Atlas',
    subtitle: 'What the platform does, what each section shows, and how you can help make it better.',
  },
};

export const documentationHighlights = [
  {
    key: 'what-it-does',
    eyebrow: 'The Platform',
    title: 'What Frontend Atlas does',
    detail:
      'Paste any public URL into the bar at the top and get a full multi-signal audit in seconds — no setup, no accounts, and no configuration required.',
    bullets: [
      'Crawls your site and maps every internal link and redirect',
      'Scores performance, accessibility, SEO, and best practices via Lighthouse',
      'Reviews security headers, HTTPS enforcement, and cookie posture',
      'Optionally runs an AI-powered UX review when a key is configured',
    ],
  },
  {
    key: 'whats-inside',
    eyebrow: 'The Dashboard',
    title: 'Six views, one report',
    detail:
      'Every audit populates six purpose-built tabs. Each one focuses on a different signal domain so results are easy to navigate and act on.',
    bullets: [
      'Dashboard — top-level scores and the primary recommendation',
      'Performance — Lighthouse vitals, bottlenecks, and timeline',
      'SEO — metadata, headings, content coverage, and crawl signals',
      'Security — headers, transport, mixed content, and cookie flags',
      'Crawl — internal routes, redirects, broken links, and duplicates',
      'Audit Stream — live agent logs and execution telemetry',
    ],
  },
  {
    key: 'contribute',
    eyebrow: 'Open Platform',
    title: 'Help make it better',
    detail:
      'Frontend Atlas is built to be extended. New checks, agents, and UI improvements are welcome — the pipeline is modular by design.',
    bullets: [
      'Add new agents to the pipeline in the /agent directory',
      'Extend existing checks by editing the relevant agent file',
      'Improve the React dashboard in /client/src',
      'Report bugs or suggest features via the project issues tracker',
    ],
  },
];

export const documentationCommandRows = [
  {
    key: 'enter-url',
    label: 'Enter a URL',
    code: 'https://your-site.com',
    meta: 'Step 1',
    detail: 'Type or paste any publicly accessible URL into the address bar at the top of the page.',
  },
  {
    key: 'run-audit',
    label: 'Run the audit',
    code: 'Click "Run Audit"',
    meta: 'Step 2',
    detail: 'Hit the Run Audit button. The platform crawls the site and runs all checks automatically — this usually takes 30–90 seconds depending on site size.',
  },
  {
    key: 'explore-tabs',
    label: 'Explore the results',
    code: 'Dashboard → Performance → SEO → Security → Crawl → Stream',
    meta: 'Step 3',
    detail: 'Once the audit finishes, use the sidebar to switch between the six tabs and review different signal areas.',
  },
  {
    key: 'export',
    label: 'Export your report',
    code: 'Export JSON  /  Export HTML',
    meta: 'Step 4',
    detail: 'Use the export buttons in the header to download the full report as JSON for programmatic use, or HTML for sharing with stakeholders.',
  },
  {
    key: 're-run',
    label: 'Re-run anytime',
    code: 'Click "Re-run Audit"',
    meta: 'Ongoing',
    detail: 'Run a fresh audit on the same URL or switch to a different site — each run replaces the active report and the previous one is overwritten.',
  },
];

export const documentationEnvironmentRows = [
  {
    key: 'crawl-check',
    label: 'Link crawl',
    code: 'Playwright',
    meta: 'Always on',
    detail: 'Discovers all internal pages, follows same-origin links, and records every redirect and broken URL found during the crawl.',
  },
  {
    key: 'seo-check',
    label: 'SEO metadata',
    code: 'Cheerio',
    meta: 'Always on',
    detail: 'Reviews page titles, meta descriptions, Open Graph tags, heading hierarchy, canonical links, and image alt text across all crawled pages.',
  },
  {
    key: 'performance-check',
    label: 'Lighthouse performance',
    code: 'Lighthouse',
    meta: 'Always on',
    detail: 'Runs a full Lighthouse pass and returns scores for Performance, Accessibility, SEO, and Best Practices alongside core web vitals.',
  },
  {
    key: 'security-check',
    label: 'Security headers',
    code: 'Built-in',
    meta: 'Always on',
    detail: 'Inspects HTTP response headers, HTTPS enforcement, mixed-content presence, cookie flags, and overall security posture.',
  },
  {
    key: 'content-check',
    label: 'Content quality',
    code: 'Built-in',
    meta: 'Always on',
    detail: 'Flags thin or duplicate content, missing structured data, and pages that may reduce crawl efficiency.',
  },
  {
    key: 'ux-check',
    label: 'AI UX review',
    code: 'OpenRouter',
    meta: 'Optional',
    detail: 'When an OpenRouter API key is configured, an LLM analyses the page for CTA clarity, layout problems, and usability improvements. Skipped gracefully if no key is present.',
  },
];

export const documentationApiRows = [
  {
    key: 'dashboard-result',
    label: 'Live dashboard',
    code: 'All six tabs',
    meta: 'Instant',
    detail: 'Results populate the six dashboard tabs immediately after the audit completes — no page reload or manual refresh needed.',
  },
  {
    key: 'json-download',
    label: 'JSON report',
    code: 'Export JSON',
    meta: 'Download',
    detail: 'A structured machine-readable file containing the normalized output from every agent in the pipeline — useful for integrations or archiving.',
  },
  {
    key: 'html-download',
    label: 'HTML report',
    code: 'Export HTML',
    meta: 'Download',
    detail: 'A clean, self-contained browser page summarising the audit result — easy to share with teammates or clients who do not have dashboard access.',
  },
  {
    key: 'saved-report',
    label: 'Persisted report',
    code: 'Auto-saved',
    meta: 'Reload',
    detail: 'The latest report is automatically saved on the server and reloaded the next time you open the dashboard, so results survive a page refresh.',
  },
];

export const documentationOutputRows = [
  {
    key: 'add-agent',
    label: 'Add a new audit agent',
    code: '/agent',
    meta: 'Extension',
    detail: 'Each check is an isolated agent file. Drop a new one into /agent and wire it into index.js to introduce an entirely new audit signal.',
  },
  {
    key: 'extend-check',
    label: 'Extend an existing check',
    code: '/agent/<name>.js',
    meta: 'Enhancement',
    detail: 'Open any agent file to see its current rules, then add new patterns, data fields, or scoring logic to the output object.',
  },
  {
    key: 'improve-ui',
    label: 'Improve the dashboard UI',
    code: '/client/src',
    meta: 'Frontend',
    detail: 'The React dashboard lives in /client/src. Components, tab views, and styles are all modular and can be changed independently.',
  },
];

export const documentationAgentRows = [
  {
    key: 'crawler',
    label: 'Crawler Agent',
    meta: 'Playwright',
    detail: 'Loads pages, extracts same-origin links, records redirects, and flags broken internal URLs.',
  },
  {
    key: 'seo',
    label: 'SEO Agent',
    meta: 'Cheerio',
    detail: 'Parses page HTML to review titles, meta descriptions, headings, canonicals, and image alt coverage.',
  },
  {
    key: 'performance',
    label: 'Performance Agent',
    meta: 'Lighthouse',
    detail: 'Audits the entry page and returns Lighthouse scores, metrics, and failing audit opportunities.',
  },
  {
    key: 'ux',
    label: 'UX Agent',
    meta: 'OpenRouter',
    detail: 'Uses the configured LLM to generate UI issues, CTA improvements, layout suggestions, and priority fixes.',
  },
  {
    key: 'security',
    label: 'Security Agent',
    meta: 'Built-in checks',
    detail: 'Reviews HTTPS usage, response headers, mixed content, and cookie/security posture warnings.',
  },
  {
    key: 'report',
    label: 'Report Generator Agent',
    meta: 'JSON + HTML',
    detail: 'Combines agent output into a unified summary and persists it to disk for the UI and downloads.',
  },
];

export const documentationTabRows = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    meta: 'Overview',
    detail: 'High-level scorecards, recommendation banner, audit stream, UX review, and key summary signals.',
  },
  {
    key: 'performance',
    label: 'Performance',
    meta: 'Lighthouse',
    detail: 'Performance score, vitals, bottlenecks, and checkpoint timeline from the latest Lighthouse pass.',
  },
  {
    key: 'seo',
    label: 'SEO',
    meta: 'Metadata',
    detail: 'SEO health, priority issues, filters, and paginated page-level findings for metadata and headings.',
  },
  {
    key: 'security',
    label: 'Security',
    meta: 'Policies',
    detail: 'Transport, headers, severity distribution, and detailed security findings for the active report.',
  },
  {
    key: 'crawl',
    label: 'Crawl',
    meta: 'Routes',
    detail: 'Internal structure, redirect profile, duplicate findings, and broken link tables from the crawl.',
  },
  {
    key: 'stream',
    label: 'Audit Stream',
    meta: 'Telemetry',
    detail: 'Execution events, agent node summaries, active-session context, and audit health indicators.',
  },
];

export const documentationTroubleshootingRows = [
  {
    key: 'report-bug',
    label: 'Found a bug?',
    meta: 'Issues',
    detail: 'Open an issue with the URL you audited, the tab where the problem appeared, and what you expected to see versus what actually happened.',
  },
  {
    key: 'suggest-feature',
    label: 'Want a new check?',
    meta: 'Feature Request',
    detail: 'Describe the signal you want covered, why it matters, and whether you can point to a reference implementation or public spec.',
  },
  {
    key: 'ux-feedback',
    label: 'Dashboard feels unclear?',
    meta: 'UX Feedback',
    detail: 'If a result is confusing, a label is misleading, or a layout breaks on your screen, share a screenshot and describe what you expected.',
  },
  {
    key: 'pull-request',
    label: 'Ready to contribute code?',
    meta: 'Pull Request',
    detail: 'Fork the repository, make your change in a focused branch, and open a PR with a short description of what was changed and why.',
  },
];

const metricLabels = {
  largestContentfulPaint: 'Largest Contentful Paint',
  firstContentfulPaint: 'First Contentful Paint',
  totalBlockingTime: 'Total Blocking Time',
  cumulativeLayoutShift: 'Cumulative Layout Shift',
};

const scoreMeta = {
  performance: 'Optimization level needs review',
  seo: 'Indexing and metadata signal',
  accessibility: 'Usability and ARIA coverage',
  bestPractices: 'Standards and platform hygiene',
};

const severityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

function pathLabel(rawUrl) {
  if (!rawUrl) {
    return '/';
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.replace(/\/$/, '') || '/';
  } catch {
    return rawUrl;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cleanSentence(text) {
  return (text || '').replace(/\[[^\]]+\]\([^)]+\)/g, '').replace(/\s+/g, ' ').trim();
}

export function formatDate(value) {
  if (!value) {
    return 'Unknown time';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatRelativeTime(value) {
  if (!value) {
    return 'No recent run';
  }

  try {
    const diffMs = new Date(value).getTime() - Date.now();
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    if (Math.abs(diffMs) < hour) {
      return rtf.format(Math.round(diffMs / minute), 'minute');
    }

    if (Math.abs(diffMs) < day) {
      return rtf.format(Math.round(diffMs / hour), 'hour');
    }

    return rtf.format(Math.round(diffMs / day), 'day');
  } catch {
    return formatDate(value);
  }
}

export function formatPathLabel(rawUrl) {
  return pathLabel(rawUrl);
}

export function rateMetric(key, rawValue) {
  if (!rawValue) {
    return 'unknown';
  }

  const num = parseFloat(rawValue);

  if (Number.isNaN(num)) {
    return 'unknown';
  }

  const thresholds = {
    largestContentfulPaint: { good: 2.5, poor: 4 },
    firstContentfulPaint: { good: 1.8, poor: 3 },
    totalBlockingTime: { good: 200, poor: 600 },
    cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
  };

  const range = thresholds[key];

  if (!range) {
    return 'unknown';
  }

  if (num <= range.good) {
    return 'good';
  }

  if (num < range.poor) {
    return 'needs-improvement';
  }

  return 'poor';
}

function metricFillByRating(rating) {
  switch (rating) {
    case 'good':
      return 100;
    case 'needs-improvement':
      return 72;
    case 'poor':
      return 38;
    default:
      return 24;
  }
}

function scoreState(value) {
  if (value >= 95) {
    return 'Perfect';
  }

  if (value >= 90) {
    return 'Excellent';
  }

  if (value >= 75) {
    return 'Good';
  }

  if (value >= 50) {
    return 'Fair';
  }

  return 'Critical';
}

function scoreAccent(key) {
  return key === 'seo' || key === 'bestPractices' ? 'emerald' : 'indigo';
}

export function buildOverviewStats(report) {
  if (!report) {
    return [];
  }

  return [
    { label: 'Pages', value: report.summary.pagesCrawled ?? 0 },
    { label: 'Broken', value: report.summary.brokenLinks ?? 0 },
    { label: 'Redirects', value: report.summary.redirects ?? 0 },
    { label: 'Security', value: report.summary.securityFindings ?? 0 },
  ];
}

export function buildScoreCards(report) {
  if (
    !report?.performance ||
    report.performance.status !== 'success' ||
    !report.performance.scores
  ) {
    return [];
  }

  return Object.entries(report.performance.scores).map(([key, rawValue]) => {
    const value = Number(rawValue) || 0;

    return {
      key,
      value,
      label:
        key === 'bestPractices'
          ? 'Best Practices'
          : key.charAt(0).toUpperCase() + key.slice(1),
      state: scoreState(value),
      accent: scoreAccent(key),
      description: scoreMeta[key] || 'Audit signal',
    };
  });
}

export function buildVitalItems(report) {
  if (
    !report?.performance ||
    report.performance.status !== 'success' ||
    !report.performance.metrics
  ) {
    return [];
  }

  return Object.entries(report.performance.metrics).map(([key, value]) => {
    const rating = rateMetric(key, value);

    return {
      key,
      label: metricLabels[key] || key,
      value: value || 'n/a',
      rating,
      fill: metricFillByRating(rating),
      state:
        rating === 'good'
          ? 'Healthy'
          : rating === 'needs-improvement'
            ? 'Monitor'
            : rating === 'poor'
              ? 'Action needed'
              : 'Unknown',
    };
  });
}

export function buildVitalsHealth(vitals) {
  if (!vitals.length) {
    return { label: 'Unavailable', tone: 'neutral' };
  }

  if (vitals.some((item) => item.rating === 'poor')) {
    return { label: 'Needs Attention', tone: 'danger' };
  }

  if (vitals.some((item) => item.rating === 'needs-improvement')) {
    return { label: 'Watch', tone: 'warning' };
  }

  return { label: 'Healthy', tone: 'success' };
}

function trimText(text, maxLength = 148) {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function joinTitles(titles) {
  if (!titles.length) {
    return '';
  }

  if (titles.length === 1) {
    return titles[0];
  }

  if (titles.length === 2) {
    return `${titles[0]} and ${titles[1]}`;
  }

  return `${titles.slice(0, -1).join(', ')}, and ${titles[titles.length - 1]}`;
}

function getPerformanceProfileLabel(report) {
  const profile = report?.performance?.environment?.formFactor;
  return profile === 'desktop' ? 'desktop' : 'mobile';
}

export function buildFailingAudits(report) {
  if (
    !report?.performance ||
    report.performance.status !== 'success' ||
    !Array.isArray(report.performance.failingAudits)
  ) {
    return [];
  }

  return report.performance.failingAudits.map((audit) => {
    return {
      ...audit,
      severity: audit.severity || (Number(audit.score) <= 49 ? 'high' : 'medium'),
      description: trimText(audit.description, 156),
    };
  });
}

export function buildFailingAuditMeta(report, audits) {
  if (!audits.length) {
    return {
      title: 'No major performance blockers',
      subtitle: 'The latest Lighthouse performance run did not surface any major blockers.',
    };
  }

  const totalCount = report?.performance?.issueSummary?.totalCount || audits.length;
  const shownCount = report?.performance?.issueSummary?.displayCount || audits.length;
  const highCount = audits.filter((audit) => audit.severity === 'high').length;
  const mediumCount = audits.filter((audit) => audit.severity === 'medium').length;
  const topTitles = joinTitles(audits.slice(0, 3).map((audit) => audit.title));
  const profileLabel = getPerformanceProfileLabel(report);
  const severityText = [
    highCount ? `${highCount} high-impact` : null,
    mediumCount ? `${mediumCount} medium-impact` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return {
    title:
      totalCount > shownCount
        ? `Showing ${shownCount} of ${totalCount} performance blockers`
        : `${shownCount} performance blocker${shownCount === 1 ? '' : 's'} need attention`,
    subtitle: `${severityText || 'Actionable issues'} on the simulated ${profileLabel} run. Biggest problems: ${topTitles}.`,
  };
}

export function buildPerformanceMethodology(report) {
  if (!report?.performance || report.performance.status !== 'success') {
    return '';
  }

  const environment = report.performance.environment;

  if (!environment) {
    return 'Synthetic Lighthouse lab run.';
  }

  const profile = environment.formFactor === 'desktop' ? 'desktop' : 'mobile';
  const throttling = environment.throttlingMethod || 'simulate';

  return `Synthetic Lighthouse lab run using the ${profile} profile with ${throttling} throttling. PageSpeed Insights can still differ between runs.`;
}

function recommendationTitleFromAudit(title) {
  const lower = (title || '').toLowerCase();

  if (lower.includes('console') || lower.includes('browser errors')) {
    return 'Resolve browser console errors';
  }

  if (lower.includes('render-blocking')) {
    return 'Remove render-blocking resources';
  }

  if (lower.includes('unused javascript')) {
    return 'Reduce unused JavaScript';
  }

  if (lower.includes('largest contentful paint')) {
    return 'Improve largest contentful paint';
  }

  if (lower.includes('redirect')) {
    return 'Remove unnecessary redirects';
  }

  if (lower.includes('deprecated')) {
    return 'Replace deprecated browser APIs';
  }

  return `Fix ${lower}`;
}

export function buildPrimaryRecommendation(report, audits = []) {
  const topAudit = audits[0];
  const topFix = report?.ux?.status === 'success' && Array.isArray(report.ux.priorityFixes)
    ? report.ux.priorityFixes[0]
    : null;

  if (topAudit) {
    const cleanedDescription = cleanSentence(topAudit.description);

    return {
      eyebrow: 'Smart Recommendation',
      title: recommendationTitleFromAudit(topAudit.title),
      body: topFix || cleanedDescription || 'This is the highest-value improvement from the latest run.',
      meta: topAudit.displayValue || 'Top Lighthouse opportunity',
    };
  }

  if (topFix) {
    return {
      eyebrow: 'Smart Recommendation',
      title: 'Push the most valuable UX fix first',
      body: topFix,
      meta: 'Derived from the current audit',
    };
  }

  return {
    eyebrow: 'Smart Recommendation',
    title: 'Run a fresh audit to surface the next best change',
    body: 'Once a site has been scanned, the dashboard will recommend the most valuable improvement.',
    meta: 'Recommendation pending',
  };
}

export function buildSecuritySegments(report) {
  const severity = report?.security?.summary?.bySeverity;

  if (!severity) {
    return [];
  }

  return [
    { label: 'high', value: severity.high || 0 },
    { label: 'medium', value: severity.medium || 0 },
    { label: 'low', value: severity.low || 0 },
  ];
}

export function buildTimelineEntries(report, logEntries) {
  if (Array.isArray(logEntries) && logEntries.length) {
    return logEntries;
  }

  if (!report) {
    return [];
  }

  const generatedAt = new Date(report.generatedAt || Date.now()).getTime();

  return [
    {
      at: new Date(generatedAt - 18_000).toISOString(),
      message: `Crawler agent scanned ${report.summary?.pagesCrawled ?? 0} pages and checked ${report.summary?.linksChecked ?? 0} internal links.`,
    },
    {
      at: new Date(generatedAt - 12_000).toISOString(),
      message: `SEO analysis reviewed ${report.seo?.summary?.pagesAnalyzed ?? report.summary?.pagesCrawled ?? 0} pages for metadata and heading structure.`,
    },
    {
      at: new Date(generatedAt - 8_000).toISOString(),
      message: `Performance audit recorded ${report.summary?.performance?.performance ?? 0} for performance and ${report.summary?.performance?.accessibility ?? 0} for accessibility.`,
    },
    {
      at: new Date(generatedAt - 4_000).toISOString(),
      message: `Security agent logged ${report.summary?.securityFindings ?? 0} findings across headers, transport, and mixed content checks.`,
    },
    {
      at: report.generatedAt,
      message: 'Report package generated and saved locally.',
    },
  ];
}

export function buildIssueItems(report) {
  if (!report) {
    return [];
  }

  return [
    { label: 'Broken links', value: report.summary.brokenLinks ?? 0, tone: 'danger' },
    { label: 'Redirects', value: report.summary.redirects ?? 0, tone: 'warning' },
    {
      label: 'Missing titles',
      value: report.summary.seoIssues?.missingTitles ?? 0,
      tone: 'warning',
    },
    {
      label: 'Missing descriptions',
      value: report.summary.seoIssues?.missingDescriptions ?? 0,
      tone: 'warning',
    },
    {
      label: 'Pages without H1',
      value: report.summary.seoIssues?.pagesWithoutH1 ?? 0,
      tone: 'danger',
    },
    {
      label: 'Images without alt',
      value: report.summary.seoIssues?.imagesWithoutAlt ?? 0,
      tone: 'danger',
    },
  ];
}

export function buildSeoRows(report, filterValue = '') {
  if (!report?.seo || report.seo.status !== 'success' || !Array.isArray(report.seo.pages)) {
    return [];
  }

  return report.seo.pages
    .filter((page) => Array.isArray(page.issues) && page.issues.length)
    .filter((page) => {
      if (!filterValue) {
        return true;
      }

      const issueStr = page.issues.join(' ').toLowerCase();

      switch (filterValue) {
        case 'title':
          return issueStr.includes('title');
        case 'description':
          return issueStr.includes('description') || issueStr.includes('meta');
        case 'h1':
          return issueStr.includes('h1');
        case 'alt':
          return issueStr.includes('alt');
        case 'canonical':
          return issueStr.includes('canonical');
        default:
          return true;
      }
    })
    .sort((left, right) => right.issues.length - left.issues.length);
}

export function paginateRows(rows, page, pageSize = 20) {
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    pageSize,
    totalItems: rows.length,
    items: rows.slice(start, start + pageSize),
  };
}

export function buildSecurityRows(report, filterValue = '') {
  if (
    !report?.security ||
    report.security.status !== 'success' ||
    !Array.isArray(report.security.findings)
  ) {
    return [];
  }

  return [...report.security.findings]
    .filter((row) => !filterValue || row.severity === filterValue)
    .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);
}

export function buildDuplicateRows(report) {
  if (!report?.seo || report.seo.status !== 'success' || !Array.isArray(report.seo.duplicates)) {
    return [];
  }

  return report.seo.duplicates;
}

export function buildBrokenLinks(report) {
  if (!report?.crawler || !Array.isArray(report.crawler.brokenLinks)) {
    return [];
  }

  return report.crawler.brokenLinks;
}

export function buildRedirects(report) {
  if (!report?.crawler || !Array.isArray(report.crawler.redirects)) {
    return [];
  }

  return report.crawler.redirects;
}

export function getScoreCard(items, key) {
  return items.find((item) => item.key === key) || null;
}

export function buildScoreBreakdown(scoreCards) {
  return scoreCards.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.value,
    progress: item.value,
    accent: item.accent,
  }));
}

export function buildLinkGraph(report) {
  const pages = Array.isArray(report?.crawler?.pages) ? report.crawler.pages.slice(0, 20) : [];

  if (pages.length < 2) {
    return null;
  }

  const width = 720;
  const height = 320;
  const count = pages.length;

  const nodes = pages.map((page, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    const x = width / 2 + width * 0.4 * Math.cos(angle);
    const y = height / 2 + height * 0.35 * Math.sin(angle);

    let label = page.url;

    try {
      const parsed = new URL(page.finalUrl || page.url);
      label = parsed.pathname.replace(/\/$/, '') || '/';
    } catch {
      label = (page.url || '').slice(0, 18);
    }

    return {
      id: page.finalUrl || page.url,
      label,
      x,
      y,
    };
  });

  const indexByUrl = new Map(nodes.map((node, index) => [node.id, index]));
  const internalLinks = Array.isArray(report?.crawler?.internalLinks) ? report.crawler.internalLinks : [];
  const edges = [];
  const drawn = new Set();

  for (const link of internalLinks) {
    const sourceUrls = Array.isArray(link.sources) ? link.sources : [];

    for (const source of sourceUrls) {
      const sourceIndex = indexByUrl.get(source);
      const targetIndex = indexByUrl.get(link.url);

      if (sourceIndex == null || targetIndex == null || sourceIndex === targetIndex) {
        continue;
      }

      const key = `${Math.min(sourceIndex, targetIndex)}-${Math.max(sourceIndex, targetIndex)}`;

      if (drawn.has(key)) {
        continue;
      }

      drawn.add(key);
      edges.push({
        from: nodes[sourceIndex],
        to: nodes[targetIndex],
      });

      if (edges.length >= 40) {
        break;
      }
    }

    if (edges.length >= 40) {
      break;
    }
  }

  return {
    width,
    height,
    nodes,
    edges,
  };
}

export function buildCrawlMap(report) {
  const pages = Array.isArray(report?.crawler?.pages) ? report.crawler.pages : [];
  const internalLinks = Array.isArray(report?.crawler?.internalLinks) ? report.crawler.internalLinks : [];

  if (!pages.length) {
    return null;
  }

  const incomingCount = new Map();
  const outgoingCount = new Map();
  const outgoingSamples = new Map();

  for (const link of internalLinks) {
    const target = link.url;
    const sources = Array.isArray(link.sources) ? link.sources : [];

    if (target) {
      incomingCount.set(target, (incomingCount.get(target) || 0) + sources.length);
    }

    for (const source of sources) {
      outgoingCount.set(source, (outgoingCount.get(source) || 0) + 1);

      const current = outgoingSamples.get(source) || [];

      if (target && current.length < 3) {
        current.push(pathLabel(target));
        outgoingSamples.set(source, current);
      }
    }
  }

  const routes = pages
    .map((page) => {
      const resolvedUrl = page.finalUrl || page.url;
      const redirect = Array.isArray(page.redirectChain) && page.redirectChain.length > 1;

      return {
        id: resolvedUrl,
        path: pathLabel(resolvedUrl),
        title: page.title || 'Untitled page',
        status: page.status || 'n/a',
        redirect,
        incoming: incomingCount.get(resolvedUrl) || 0,
        outgoing: outgoingCount.get(resolvedUrl) || 0,
        samples: outgoingSamples.get(resolvedUrl) || [],
      };
    })
    .sort((left, right) => {
      if (left.path === '/') {
        return -1;
      }

      if (right.path === '/') {
        return 1;
      }

      return right.outgoing - left.outgoing;
    })
    .slice(0, 8);

  let hostname = report.target;

  try {
    hostname = new URL(report.target).hostname;
  } catch {
    hostname = report.target;
  }

  return {
    hostname,
    totals: {
      pages: report.summary?.pagesCrawled ?? pages.length,
      links: report.summary?.linksChecked ?? internalLinks.length,
      redirects: report.summary?.redirects ?? 0,
      broken: report.summary?.brokenLinks ?? 0,
    },
    routes,
  };
}

function toneFromIssueCount(count, total, warningRatio = 0.08, dangerRatio = 0.2) {
  if (!count) {
    return 'good';
  }

  const ratio = total ? count / total : 1;

  if (ratio >= dangerRatio) {
    return 'danger';
  }

  if (ratio >= warningRatio) {
    return 'warning';
  }

  return 'warning';
}

export function buildSeoHighlights(report, seoRows) {
  const summary = report?.seo?.summary;

  if (!summary) {
    return [];
  }

  const totalPages = summary.pagesAnalyzed || report?.summary?.pagesCrawled || 0;
  const metaIssues = (summary.missingTitles || 0) + (summary.missingDescriptions || 0);
  const headingIssues = (summary.multipleH1 || 0) + (summary.noH1 || 0);
  const altIssues = summary.imagesWithoutAlt || 0;

  return [
    {
      key: 'meta',
      label: 'Meta Health',
      value: metaIssues,
      tone: toneFromIssueCount(metaIssues, totalPages),
      note: metaIssues
        ? `${metaIssues} page${metaIssues === 1 ? '' : 's'} need title or description fixes.`
        : 'Titles and descriptions are present across the audited set.',
      progress: totalPages ? clamp(Math.round((metaIssues / totalPages) * 100), 4, 100) : 0,
    },
    {
      key: 'headings',
      label: 'H1 Hierarchy',
      value: headingIssues,
      tone: toneFromIssueCount(headingIssues, totalPages),
      note: headingIssues
        ? `${headingIssues} page${headingIssues === 1 ? '' : 's'} need heading cleanup or a primary H1.`
        : 'Heading structure is consistent across the audited pages.',
      progress: totalPages ? clamp(Math.round((headingIssues / totalPages) * 100), 4, 100) : 0,
    },
    {
      key: 'alt',
      label: 'Alt Coverage',
      value: altIssues,
      tone: altIssues ? (altIssues > totalPages ? 'danger' : 'warning') : 'good',
      note: altIssues
        ? `${altIssues} image${altIssues === 1 ? '' : 's'} are still missing descriptive alt text.`
        : 'Image alt coverage is complete for the pages reviewed.',
      progress: totalPages ? clamp(Math.round((Math.min(altIssues, totalPages) / totalPages) * 100), 4, 100) : 0,
    },
  ];
}

function issueActionLabel(issue) {
  const lower = issue.toLowerCase();

  if (lower.includes('title')) {
    return 'Add title';
  }

  if (lower.includes('description')) {
    return 'Expand meta';
  }

  if (lower.includes('h1')) {
    return 'Fix heading';
  }

  if (lower.includes('alt')) {
    return 'Add alt text';
  }

  if (lower.includes('canonical')) {
    return 'Set canonical';
  }

  return 'Review issue';
}

export function buildSeoStreamItems(seoRows) {
  return seoRows.slice(0, 3).map((row) => {
    const primaryIssue = row.issues[0] || 'SEO issue detected';
    const lower = primaryIssue.toLowerCase();

    return {
      id: row.url,
      path: pathLabel(row.url),
      title: primaryIssue,
      detail: trimText(row.metaDescription || row.title || 'Page-level SEO issue detected in the latest crawl.', 160),
      action: issueActionLabel(primaryIssue),
      tone: lower.includes('missing')
        ? 'danger'
        : lower.includes('multiple') || lower.includes('alt')
          ? 'warning'
          : 'good',
    };
  });
}

function extractMissingHeader(message) {
  const match = /missing security header:\s*(.+)$/i.exec(message || '');
  return match ? match[1].trim().toLowerCase() : '';
}

export function buildSecurityScore(report) {
  const severity = report?.security?.summary?.bySeverity || {};
  const high = severity.high || 0;
  const medium = severity.medium || 0;
  const low = severity.low || 0;
  const total = high + medium + low;

  let score = 100 - high * 18 - medium * 8 - low * 2;

  if (!String(report?.target || '').startsWith('https://')) {
    score -= 20;
  }

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    label: score >= 90 ? 'Protected' : score >= 70 ? 'Monitor' : 'At Risk',
    tone: score >= 90 ? 'good' : score >= 70 ? 'warning' : 'danger',
    description: total
      ? `${total} security finding${total === 1 ? '' : 's'} were logged in the latest pass.`
      : 'No security findings were logged in the latest pass.',
  };
}

export function buildSecuritySummaryCards(report) {
  const severity = report?.security?.summary?.bySeverity || {};
  const high = severity.high || 0;
  const medium = severity.medium || 0;
  const low = severity.low || 0;

  return [
    {
      key: 'critical',
      label: 'Critical Threats',
      value: high,
      detail: `${high} high priority issue${high === 1 ? '' : 's'} found`,
      tone: high ? 'danger' : 'good',
    },
    {
      key: 'medium',
      label: 'Medium Alerts',
      value: medium,
      detail: medium
        ? `${medium} medium severity issue${medium === 1 ? '' : 's'} still need review`
        : low
          ? `${low} low severity signal${low === 1 ? '' : 's'} remain`
          : 'No medium severity issues were logged',
      tone: medium ? 'warning' : low ? 'neutral' : 'good',
    },
  ];
}

export function buildSecurityHeaderItems(securityRows) {
  const requiredHeaders = [
    ['strict-transport-security', 'HSTS'],
    ['content-security-policy', 'CSP'],
    ['x-frame-options', 'X-Frame-Options'],
    ['x-content-type-options', 'X-Content-Type-Options'],
    ['referrer-policy', 'Referrer-Policy'],
    ['permissions-policy', 'Permissions-Policy'],
  ];

  const missing = new Set(
    securityRows
      .filter((row) => row.category === 'headers')
      .map((row) => extractMissingHeader(row.message))
      .filter(Boolean),
  );

  return requiredHeaders.map(([key, label]) => ({
    key,
    label,
    value: missing.has(key) ? 'Missing header' : 'Detected',
    tone: missing.has(key) ? 'danger' : 'good',
  }));
}

export function buildTransportChecks(report, securityRows) {
  const headerItems = buildSecurityHeaderItems(securityRows);
  const mixedCount = securityRows.filter((row) => row.category === 'mixed-content').length;
  const cookieWarnings = securityRows.filter((row) => /cookie/i.test(row.message || '')).length;
  const missingHeaders = headerItems.filter((item) => item.tone === 'danger').length;
  const httpsEnabled = String(report?.target || '').startsWith('https://');

  return [
    {
      key: 'https',
      label: 'HTTPS',
      value: httpsEnabled ? 'Enabled' : 'Disabled',
      detail: httpsEnabled ? 'Encrypted transport is active.' : 'Traffic is not encrypted.',
      tone: httpsEnabled ? 'good' : 'danger',
    },
    {
      key: 'mixed',
      label: 'Mixed Content',
      value: mixedCount ? `${mixedCount} flagged` : 'None',
      detail: mixedCount ? 'Insecure assets were embedded on HTTPS pages.' : 'No mixed content was detected.',
      tone: mixedCount ? 'warning' : 'good',
    },
    {
      key: 'cookies',
      label: 'Cookie Posture',
      value: cookieWarnings ? `${cookieWarnings} warnings` : 'Clean',
      detail: cookieWarnings ? 'Cookie warnings were logged during the scan.' : 'No cookie-related warnings were reported.',
      tone: cookieWarnings ? 'warning' : 'good',
    },
    {
      key: 'headers',
      label: 'Header Gaps',
      value: `${missingHeaders}`,
      detail: missingHeaders ? 'Core response headers are still missing.' : 'Core response headers are present.',
      tone: missingHeaders ? 'danger' : 'good',
    },
  ];
}

export function buildCrawlInsights(report) {
  const summary = report?.summary || {};
  const pages = summary.pagesCrawled || 0;
  const links = summary.linksChecked || 0;
  const redirects = summary.redirects || 0;
  const broken = summary.brokenLinks || 0;
  const healthScore = clamp(Math.round(100 - broken * 18 - redirects * 4), 0, 100);

  return {
    pages,
    links,
    redirects,
    broken,
    healthScore,
    coverageLabel: `${pages}`,
    coverageCopy: `${links} internal links evaluated`,
    coverageProgress: clamp(healthScore, 8, 100),
  };
}

export function buildAgentNodes(report, seoRows, securityRows, failingAudits) {
  return [
    {
      key: 'crawler',
      label: 'Crawler Agent',
      value: `${report?.summary?.pagesCrawled ?? 0} pages`,
      tone: 'good',
    },
    {
      key: 'seo',
      label: 'SEO Agent',
      value: `${seoRows.length} flagged`,
      tone: seoRows.length ? 'warning' : 'good',
    },
    {
      key: 'security',
      label: 'Security Agent',
      value: `${securityRows.length} findings`,
      tone: securityRows.length ? 'warning' : 'good',
    },
    {
      key: 'performance',
      label: 'Performance Agent',
      value: `${failingAudits.length} blockers`,
      tone: failingAudits.length ? 'warning' : 'good',
    },
  ];
}

export function buildAuditHealth(report) {
  const performance = report?.summary?.performance || {};
  const scores = Object.values(performance).map((value) => Number(value) || 0);
  const averageScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : 0;

  const security = report?.security?.summary?.bySeverity || {};
  const issuePenalty =
    (report?.summary?.brokenLinks || 0) * 4 +
    (report?.summary?.redirects || 0) * 1.5 +
    (security.high || 0) * 4 +
    (security.medium || 0) * 1.5;

  const score = clamp(Math.round(averageScore - issuePenalty), 0, 100);

  return {
    score,
    label: score >= 90 ? 'Stable' : score >= 70 ? 'Operational' : 'Degraded',
    detail:
      score >= 90
        ? 'Current crawl session is stable and reporting cleanly.'
        : score >= 70
          ? 'The audit is running well, with a manageable number of issues to review.'
          : 'The latest run surfaced several issues that deserve immediate follow-up.',
  };
}

export function buildSitemapRobotsItems(report) {
  const sr = report?.seo?.sitemapRobots;
  if (!sr) return [];

  const items = [
    {
      key: 'sitemap',
      label: 'XML Sitemap',
      value: sr.sitemap.found ? 'Found' : 'Missing',
      detail: sr.sitemap.found
        ? `Located at ${sr.sitemap.url}`
        : 'No sitemap found at /sitemap.xml or /sitemap_index.xml.',
      tone: sr.sitemap.found ? 'good' : 'danger',
    },
    {
      key: 'robots',
      label: 'robots.txt',
      value: sr.robots.found ? (sr.robots.blocksCrawlers ? 'Blocking crawlers' : 'Found') : 'Missing',
      detail: sr.robots.found
        ? sr.robots.blocksCrawlers
          ? 'robots.txt exists but blocks all crawlers with "Disallow: /".'
          : 'robots.txt is present and allows crawling.'
        : 'No robots.txt found at the site root.',
      tone: sr.robots.found ? (sr.robots.blocksCrawlers ? 'warning' : 'good') : 'danger',
    },
  ];

  return items;
}

export function buildContentIssueItems(report) {
  const content = report?.content;

  if (!content || content.status !== 'success' || !Array.isArray(content.pages)) {
    return [];
  }

  const typeAction = { spelling: 'Spelling', grammar: 'Grammar', clarity: 'Clarity' };
  const typeTone = { spelling: 'error', grammar: 'warning', clarity: 'neutral' };

  const items = [];
  let id = 0;

  for (const page of content.pages) {
    if (!Array.isArray(page.issues)) continue;
    const path = (() => {
      try {
        return new URL(page.url).pathname || page.url;
      } catch (_) {
        return page.url;
      }
    })();

    for (const issue of page.issues) {
      items.push({
        id: `content-${id++}`,
        path,
        action: typeAction[issue.type] || issue.type,
        title: issue.text || '(no text)',
        detail: issue.suggestion || '',
        tone: typeTone[issue.type] || 'neutral',
        context: issue.context || '',
        fullUrl: page.url,
      });
    }
  }

  return items;
}

export function buildContentSummary(report) {
  const s = report?.content?.summary;
  const status = report?.content?.status;

  return {
    status: status || 'skipped',
    pagesAnalyzed: s?.pagesAnalyzed ?? 0,
    pagesWithIssues: s?.pagesWithIssues ?? 0,
    totalIssues: s?.totalIssues ?? 0,
    spellingIssues: s?.spellingIssues ?? 0,
    grammarIssues: s?.grammarIssues ?? 0,
    clarityIssues: s?.clarityIssues ?? 0,
  };
}

export function buildWordPressFlags(report) {
  const isWordPress = report?.security?.wordpress === true;
  const findings = (report?.security?.findings || []).filter(
    (f) => f.category === 'wordpress',
  );

  return {
    isWordPress,
    findings,
    xmlrpcExposed: findings.some((f) => f.pageUrl?.includes('xmlrpc.php')),
    usersEndpointExposed: findings.some((f) => f.pageUrl?.includes('wp-json/wp/v2/users')),
    loginExposed: findings.some((f) => f.pageUrl?.includes('wp-login.php')),
  };
}
