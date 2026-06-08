const fs = require('fs/promises');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<span class="muted">None</span>';
  }

  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function renderOverviewCards(report) {
  const cards = [
    ['Pages Crawled', report.summary.pagesCrawled],
    ['Broken Links', report.summary.brokenLinks],
    ['Redirects', report.summary.redirects],
    ['Security Findings', report.summary.securityFindings],
  ];

  return cards
    .map(
      ([label, value]) => `
        <div class="card">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join('');
}

function renderBrokenLinks(crawler) {
  if (!crawler.brokenLinks || crawler.brokenLinks.length === 0) {
    return '<p class="muted">No broken links were detected.</p>';
  }

  const rows = crawler.brokenLinks
    .map(
      (link) => `
        <tr>
          <td>${escapeHtml(link.url)}</td>
          <td>${escapeHtml(link.status ?? 'n/a')}</td>
          <td>${escapeHtml(link.error || '')}</td>
        </tr>
      `
    )
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Status</th>
          <th>Issue</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderSeoSummary(seo) {
  if (!seo || seo.status !== 'success') {
    return '<p class="muted">SEO analysis did not complete successfully.</p>';
  }

  const issueRows = seo.pages
    .filter((page) => page.issues.length > 0)
    .map(
      (page) => `
        <tr>
          <td>${escapeHtml(page.url)}</td>
          <td>${escapeHtml(page.title || 'Missing')}</td>
          <td>${escapeHtml(page.metaDescription || 'Missing')}</td>
          <td>${escapeHtml(page.h1.length)}</td>
          <td>${escapeHtml(page.imagesWithoutAlt.length)}</td>
          <td>${escapeHtml(page.issues.join(', '))}</td>
        </tr>
      `
    )
    .join('');

  if (!issueRows) {
    return '<p class="muted">No SEO issues were detected in the crawled HTML pages.</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>Title</th>
          <th>Meta Description</th>
          <th>H1 Count</th>
          <th>Images Without Alt</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>${issueRows}</tbody>
    </table>
  `;
}

function renderPerformance(performance) {
  if (!performance || performance.status !== 'success') {
    return `<p class="muted">${escapeHtml(
      performance && performance.message
        ? performance.message
        : 'Performance audit did not complete.'
    )}</p>`;
  }

  const scoreCards = Object.entries(performance.scores)
    .map(
      ([label, value]) => `
        <div class="card small">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join('');

  const metricList = Object.entries(performance.metrics)
    .map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || 'n/a')}</li>`
    )
    .join('');

  const failingAudits = performance.failingAudits.length
    ? `<table>
        <thead>
          <tr>
            <th>Audit</th>
            <th>Score</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          ${performance.failingAudits
            .map(
              (audit) => `
                <tr>
                  <td>${escapeHtml(audit.title)}</td>
                  <td>${escapeHtml(audit.score)}</td>
                  <td>${escapeHtml(audit.displayValue || audit.description || '')}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>`
    : '<p class="muted">No major failing Lighthouse audits were captured.</p>';

  return `
    <div class="card-grid">${scoreCards}</div>
    <ul>${metricList}</ul>
    ${failingAudits}
  `;
}

function renderUx(ux) {
  if (!ux) {
    return '<p class="muted">UX analysis is unavailable.</p>';
  }

  if (ux.status === 'skipped') {
    return `<p class="muted">${escapeHtml(ux.reason)}</p>`;
  }

  if (ux.status === 'error') {
    return `<p class="muted">${escapeHtml(ux.message)}</p>`;
  }

  return `
    <p>${escapeHtml(ux.overallAssessment)}</p>
    <h3>UI Issues</h3>
    ${renderList(ux.uiIssues)}
    <h3>CTA Improvements</h3>
    ${renderList(ux.ctaImprovements)}
    <h3>Layout Suggestions</h3>
    ${renderList(ux.layoutSuggestions)}
    <h3>Priority Fixes</h3>
    ${renderList(ux.priorityFixes)}
  `;
}

function renderDuplicateContent(seo) {
  if (!seo || seo.status !== 'success' || !Array.isArray(seo.duplicates) || seo.duplicates.length === 0) {
    return '<p class="muted">No duplicate titles or descriptions were detected.</p>';
  }

  const rows = seo.duplicates
    .map(
      (dup) => `
        <tr>
          <td>${escapeHtml(dup.field)}</td>
          <td>${escapeHtml(dup.value)}</td>
          <td>${dup.urls.map((u) => `<div>${escapeHtml(u)}</div>`).join('')}</td>
        </tr>
      `
    )
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Pages</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderContentAnalysis(content) {
  if (!content || content.status === 'skipped') {
    return '<p class="muted">Content analysis was skipped — no OpenRouter API key configured.</p>';
  }

  if (content.status === 'error') {
    return `<p class="muted">Content analysis failed: ${escapeHtml(content.message || '')}</p>`;
  }

  if (!Array.isArray(content.pages) || content.pages.length === 0) {
    return '<p class="muted">No pages were analysed for content quality.</p>';
  }

  const typeLabels = { spelling: 'Spelling', grammar: 'Grammar', clarity: 'Clarity' };
  const typeColors = { spelling: '#c0392b', grammar: '#e67e22', clarity: '#2980b9' };

  const sections = content.pages
    .filter((p) => p.issues && p.issues.length > 0)
    .map((p) => {
      const rows = p.issues
        .map(
          (issue) => `
          <tr>
            <td>
              <span style="font-size:0.8rem;font-weight:600;color:${typeColors[issue.type] || '#555'};text-transform:uppercase">
                ${escapeHtml(typeLabels[issue.type] || issue.type)}
              </span>
            </td>
            <td><code>${escapeHtml(issue.text || '')}</code></td>
            <td>${escapeHtml(issue.suggestion || '')}</td>
            <td style="color:#888;font-size:0.85rem">${escapeHtml(issue.context || '')}</td>
          </tr>`
        )
        .join('');

      return `
        <details open>
          <summary style="cursor:pointer;padding:8px 0;font-weight:600">
            ${escapeHtml(p.url)}
            <span style="margin-left:8px;font-size:0.8rem;color:#888">${p.issues.length} issue(s) &mdash; overall: ${escapeHtml(p.overallQuality || 'unknown')}</span>
          </summary>
          <table style="margin-top:8px">
            <thead>
              <tr>
                <th>Type</th>
                <th>Found</th>
                <th>Suggestion</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </details>`;
    })
    .join('');

  if (!sections) {
    return '<p class="muted">No spelling, grammar, or clarity issues were detected.</p>';
  }

  const s = content.summary;
  return `
    <p style="margin-bottom:16px">
      Analysed <strong>${escapeHtml(s.pagesAnalyzed)}</strong> page(s) &mdash;
      <strong>${escapeHtml(s.spellingIssues)}</strong> spelling,
      <strong>${escapeHtml(s.grammarIssues)}</strong> grammar,
      <strong>${escapeHtml(s.clarityIssues)}</strong> clarity issues found.
    </p>
    ${sections}
  `;
}

function renderSitemapRobots(seo) {
  if (!seo || seo.status !== 'success' || !seo.sitemapRobots) {
    return '<p class="muted">Sitemap and robots.txt check did not run.</p>';
  }

  const { sitemap, robots, issues } = seo.sitemapRobots;

  const rows = [
    [
      'Sitemap',
      sitemap.found
        ? `<span style="color:#1a7f44">Found</span> — <a href="${escapeHtml(sitemap.url)}" target="_blank">${escapeHtml(sitemap.url)}</a>`
        : '<span style="color:#c0392b">Not found</span>',
    ],
    [
      'robots.txt',
      robots.found
        ? robots.blocksCrawlers
          ? '<span style="color:#c0392b">Found but blocks all crawlers</span>'
          : '<span style="color:#1a7f44">Found</span>'
        : '<span style="color:#c0392b">Not found</span>',
    ],
  ]
    .map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`)
    .join('');

  const issueList =
    issues.length > 0
      ? `<ul>${issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : '<p class="muted">No issues detected.</p>';

  return `
    <table><tbody>${rows}</tbody></table>
    ${issueList}
  `;
}

function renderSecurity(security) {
  if (!security || security.status !== 'success') {
    return '<p class="muted">Security analysis did not complete successfully.</p>';
  }

  if (security.findings.length === 0) {
    return '<p class="muted">No security findings were detected by the lightweight checks.</p>';
  }

  const rows = security.findings
    .map(
      (finding) => `
        <tr>
          <td>${escapeHtml(finding.severity)}</td>
          <td>${escapeHtml(finding.category)}</td>
          <td>${escapeHtml(finding.pageUrl)}</td>
          <td>${escapeHtml(finding.message)}</td>
          <td>${escapeHtml(finding.recommendation)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Category</th>
          <th>Page</th>
          <th>Finding</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildHtmlReport(report) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Frontend Audit Report</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --surface: #ffffff;
        --text: #162033;
        --muted: #5f6c84;
        --border: #d8e0ef;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 56px;
      }

      h1,
      h2,
      h3 {
        margin-top: 0;
      }

      section {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 24px rgba(15, 32, 61, 0.06);
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }

      .card {
        background: #f9fbff;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
      }

      .card.small {
        min-height: 88px;
      }

      .label {
        color: var(--muted);
        font-size: 0.9rem;
        margin-bottom: 8px;
        text-transform: capitalize;
      }

      .value {
        font-size: 1.6rem;
        font-weight: 700;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--border);
        text-align: left;
        padding: 10px 8px;
        vertical-align: top;
      }

      th {
        color: var(--muted);
        font-size: 0.9rem;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      .muted {
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Frontend Audit Report</h1>
        <p><strong>Target:</strong> ${escapeHtml(report.target)}</p>
        <p><strong>Generated:</strong> ${escapeHtml(report.generatedAt)}</p>
        <div class="card-grid">${renderOverviewCards(report)}</div>
      </section>

      <section>
        <h2>Broken Links</h2>
        ${renderBrokenLinks(report.crawler)}
      </section>

      <section>
        <h2>SEO Findings</h2>
        ${renderSeoSummary(report.seo)}
      </section>

      <section>
        <h2>Duplicate Content</h2>
        ${renderDuplicateContent(report.seo)}
      </section>

      <section>
        <h2>Content Quality</h2>
        ${renderContentAnalysis(report.content)}
      </section>

      <section>
        <h2>Lighthouse</h2>
        ${renderPerformance(report.performance)}
      </section>

      <section>
        <h2>UX Review</h2>
        ${renderUx(report.ux)}
      </section>

      <section>
        <h2>Sitemap &amp; Robots.txt</h2>
        ${renderSitemapRobots(report.seo)}
      </section>

      <section>
        <h2>Security Findings${report.security && report.security.wordpress ? ' <span style="font-size:0.75rem;background:#f0f4ff;border:1px solid #c5d3f0;border-radius:6px;padding:2px 8px;vertical-align:middle;color:#3a5cbf">WordPress detected</span>' : ''}</h2>
        ${renderSecurity(report.security)}
      </section>
    </main>
  </body>
</html>`;
}

async function generateReports(finalReport, config) {
  await fs.mkdir(config.reportsDir, { recursive: true });
  await fs.writeFile(
    config.reportJsonPath,
    JSON.stringify(finalReport, null, 2),
    'utf8'
  );
  await fs.writeFile(config.reportHtmlPath, buildHtmlReport(finalReport), 'utf8');

  return {
    jsonPath: config.reportJsonPath,
    htmlPath: config.reportHtmlPath,
  };
}

module.exports = {
  generateReports,
};
