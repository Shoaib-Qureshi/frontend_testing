import React from 'react';

import {
  BrokenLinksTable,
  RedirectsTable,
  EmptyState,
  FailingAuditList,
  Icon,
  OverviewStats,
  Panel,
  RecommendationCard,
  ScoreRow,
  SecuritySnapshot,
  SecurityTable,
  SeoTable,
  StatusPill,
  TimelineList,
  UxPanel,
  VitalsPanel,
  CrawlMap,
  DuplicateTable,
} from './components';
import {
  documentationAgentRows,
  documentationApiRows,
  documentationCommandRows,
  documentationEnvironmentRows,
  documentationHighlights,
  documentationOutputRows,
  documentationTabRows,
  documentationTroubleshootingRows,
} from './report-utils';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function trimMessage(message, maxLength = 54) {
  if (!message) {
    return 'Audit event';
  }

  return message.length <= maxLength ? message : `${message.slice(0, maxLength - 1).trimEnd()}...`;
}

function toneToStatus(tone) {
  if (tone === 'good') {
    return 'success';
  }

  if (tone === 'warning' || tone === 'neutral') {
    return 'warning';
  }

  return 'error';
}

function PageHeader({ meta, target, lastRun, actions, aside }) {
  return (
    <section className={cx('page-header', aside && 'page-header-with-aside')}>
      <div className="page-copy">
        <p className="page-eyebrow">{meta.eyebrow}</p>
        <h1 className="page-title">{meta.title}</h1>
        <p className="page-subtitle">{meta.subtitle}</p>
        <div className="meta-strip">
          <span className="meta-chip">
            <Icon name="link" />
            <span>{target || 'Waiting for a website'}</span>
          </span>
          <span className="meta-chip meta-chip-muted">
            <Icon name="clock" />
            <span>{lastRun}</span>
          </span>
        </div>
      </div>
      <div className="page-header-side">
        {aside}
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

function SignalBars({ items }) {
  if (!items.length) {
    return <EmptyState message="No signal breakdown is available." />;
  }

  return (
    <div className="signal-bars">
      {items.map((item) => (
        <div className="signal-row" key={item.key}>
          <div className="signal-row-top">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="signal-track">
            <span className={cx('signal-fill', `signal-fill-${item.accent}`)} style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCards({ items }) {
  if (!items.length) {
    return <EmptyState message="No vitals are available for this run." />;
  }

  return (
    <section className="mini-card-grid">
      {items.slice(0, 3).map((item) => (
        <article className="mini-card" key={item.key}>
          <div className="mini-card-top">
            <span className={cx('mini-card-dot', `mini-card-dot-${item.rating}`)} />
            <span className={cx('mini-card-status', `mini-card-status-${item.rating}`)}>{item.state}</span>
          </div>
          <p className="mini-card-label">{item.label}</p>
          <strong className="mini-card-value">{item.value}</strong>
          <p className="mini-card-copy">Derived from the latest Lighthouse execution.</p>
        </article>
      ))}
    </section>
  );
}

function IssueStream({ items, emptyMessage = 'No issue stream is available.' }) {
  if (!items.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="issue-stream">
      {items.map((item) => (
        <article className={cx('issue-stream-card', `issue-stream-card-${item.tone}`)} key={item.id}>
          <div className="issue-stream-content">
            <div className="issue-stream-top">
              <span className="issue-stream-path">{item.path}</span>
              <span className={cx('issue-stream-action', `issue-stream-action-${item.tone}`)}>{item.action}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function SummaryTiles({ items }) {
  return (
    <div className="summary-tile-stack">
      {items.map((item) => (
        <article className={cx('summary-tile', `summary-tile-${item.tone}`)} key={item.key}>
          <div>
            <p className="summary-tile-label">{item.label}</p>
            <p className="summary-tile-copy">{item.detail}</p>
          </div>
          <strong>{String(item.value).padStart(2, '0')}</strong>
        </article>
      ))}
    </div>
  );
}

function InfoList({ items }) {
  return (
    <div className="info-list">
      {items.map((item) => (
        <div className="info-row" key={item.key || item.label}>
          <div>
            <strong>{item.label}</strong>
            <p>{item.detail || item.value}</p>
          </div>
          <span className={cx('info-badge', `info-badge-${item.tone}`)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function HeaderChecklist({ items }) {
  return (
    <div className="header-checklist">
      {items.map((item) => (
        <article className={cx('header-check-item', `header-check-item-${item.tone}`)} key={item.key}>
          <div>
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </div>
          <span className={cx('header-check-state', `header-check-state-${item.tone}`)}>
            {item.tone === 'good' ? 'Present' : 'Missing'}
          </span>
        </article>
      ))}
    </div>
  );
}

function RedirectBreakdown({ insight }) {
  const total = Math.max(insight.redirects + insight.broken + Math.max(insight.pages - insight.broken, 0), 1);
  const redirectWidth = `${Math.max((insight.redirects / total) * 100, insight.redirects ? 8 : 0)}%`;
  const brokenWidth = `${Math.max((insight.broken / total) * 100, insight.broken ? 8 : 0)}%`;

  return (
    <div className="redirect-stack">
      <div className="redirect-row">
        <div className="redirect-copy">
          <strong>Redirected URLs</strong>
          <span>{insight.redirects} routes</span>
        </div>
        <div className="redirect-track">
          <span className="redirect-fill redirect-fill-primary" style={{ width: redirectWidth }} />
        </div>
      </div>
      <div className="redirect-row">
        <div className="redirect-copy">
          <strong>Broken Entries</strong>
          <span>{insight.broken} routes</span>
        </div>
        <div className="redirect-track">
          <span className="redirect-fill redirect-fill-danger" style={{ width: brokenWidth }} />
        </div>
      </div>
    </div>
  );
}

function PerformanceTrace({ entries }) {
  if (!entries.length) {
    return <EmptyState message="No audit checkpoints are available." />;
  }

  return (
    <div className="trace-list">
      {entries.slice(0, 5).map((entry, index) => (
        <article className="trace-card" key={`${entry.at}-${index}`}>
          <div className="trace-card-rail">
            <span className="trace-card-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="trace-card-dot" />
          </div>
          <div className="trace-card-copy">
            <strong>{trimMessage(entry.message, 78)}</strong>
            <span>{entry.at}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function AgentNodes({ items }) {
  return (
    <div className="agent-node-list">
      {items.map((item) => (
        <div className="agent-node-row" key={item.key}>
          <div className="agent-node-meta">
            <span className={cx('agent-node-dot', `agent-node-dot-${item.tone}`)} />
            <strong>{item.label}</strong>
          </div>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function SessionCard({ target, lastRun, pages }) {
  return (
    <div className="session-card">
      <div className="session-icon">
        <Icon name="globe" />
      </div>
      <div className="session-copy">
        <strong>{target}</strong>
        <p>
          {pages} page{pages === 1 ? '' : 's'} scanned - {lastRun}
        </p>
      </div>
    </div>
  );
}

function HeroScoreCard({ className, eyebrow, score, title, description, chips, accent = 'indigo' }) {
  return (
    <article className={cx('hero-score-card', className)}>
      <div className="hero-score-badge">{eyebrow}</div>
      <div className="hero-score-layout">
        <div className={cx('score-orbit', 'score-orbit-large', `score-orbit-${accent}`)} style={{ '--score': score }}>
          <span>{score}</span>
        </div>
        <div className="hero-score-copy">
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="hero-score-chips">
            {chips.map((chip) => (
              <span className={cx('hero-chip', `hero-chip-${chip.tone}`)} key={chip.label}>
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function SeoHighlightGrid({ items, stacked = false }) {
  if (!items.length) {
    return <EmptyState message="SEO highlights are unavailable." />;
  }

  return (
    <div className={cx('seo-highlight-grid', stacked && 'seo-highlight-grid-stacked')}>
      {items.map((item) => (
        <article className={cx('seo-highlight-card', `seo-highlight-card-${item.tone}`)} key={item.key}>
          <div className="seo-highlight-top">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <p>{item.note}</p>
          <div className="seo-highlight-track">
            <span className={cx('seo-highlight-fill', `seo-highlight-fill-${item.tone}`)} style={{ width: `${item.progress}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

function DocumentationHighlightGrid({ items }) {
  return (
    <section className="documentation-highlight-grid">
      {items.map((item) => (
        <article className="documentation-highlight-card" key={item.key}>
          <p className="documentation-card-eyebrow">{item.eyebrow}</p>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
          <ul className="documentation-bullet-list">
            {item.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function DocumentationRows({ items }) {
  return (
    <div className="documentation-row-list">
      {items.map((item) => (
        <article className="documentation-row" key={item.key}>
          <div className="documentation-row-copy">
            <div className="documentation-row-top">
              <strong>{item.label}</strong>
              {item.meta ? <span className="documentation-row-meta">{item.meta}</span> : null}
            </div>
            <p>{item.detail}</p>
          </div>
          {item.code ? <code>{item.code}</code> : null}
        </article>
      ))}
    </div>
  );
}

function DocumentationAgentGrid({ items }) {
  return (
    <div className="documentation-agent-grid">
      {items.map((item) => (
        <article className="documentation-agent-card" key={item.key}>
          <div className="documentation-agent-top">
            <strong>{item.label}</strong>
            <span>{item.meta}</span>
          </div>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function DashboardView({
  meta,
  report,
  lastRun,
  headerActions,
  onOpenReport,
  overviewStats,
  scoreCards,
  vitalItems,
  vitalsHealth,
  failingAudits,
  failingAuditMeta,
  recommendation,
  securitySegments,
  issueItems,
  timelineEntries,
  uxModelText,
}) {
  return (
    <div className="view-stack">
      <PageHeader
        actions={headerActions}
        aside={overviewStats.length ? <OverviewStats items={overviewStats} /> : null}
        lastRun={lastRun}
        meta={meta}
        target={report?.target}
      />

      <ScoreRow items={scoreCards} />

      <section className="view-grid">
        <Panel
          actions={<StatusPill tone={vitalsHealth.tone}>{vitalsHealth.label}</StatusPill>}
          className="span-7"
          eyebrow="Core Web Vitals"
          subtitle="Real-user experience metrics from the latest Lighthouse pass."
          title="Core Web Vitals"
        >
          <VitalsPanel items={vitalItems} />
        </Panel>

        <Panel
          className="span-5"
          eyebrow="Performance Blockers"
          subtitle={failingAuditMeta.subtitle}
          title={failingAuditMeta.title}
        >
          <FailingAuditList audits={failingAudits} />
        </Panel>

        <div className="span-7">
          <RecommendationCard item={recommendation} onOpenReport={onOpenReport} />
        </div>

        <Panel
          className="span-5"
          eyebrow="Security Pulse"
          subtitle="Severity mix and issue pressure from the active report."
          title="Security snapshot"
        >
          <SecuritySnapshot issueItems={issueItems} segments={securitySegments} />
        </Panel>
      </section>

      <Panel
        className="span-full"
        eyebrow="Audit Stream"
        subtitle="Real-time breakdown of the latest technical sweep."
        title="Audit Stream"
      >
        <TimelineList entries={timelineEntries} limit={4} />
      </Panel>

      <Panel
        actions={uxModelText ? <p className="micro-copy">{uxModelText}</p> : null}
        className="span-full"
        eyebrow="AI Review"
        subtitle="LLM-based UX feedback and priority fixes."
        title="UX Review"
      >
        <UxPanel ux={report?.ux} />
      </Panel>
    </div>
  );
}

export function PerformanceView({
  meta,
  report,
  lastRun,
  headerActions,
  performanceCard,
  performanceMethodology,
  scoreBreakdown,
  vitalItems,
  vitalsHealth,
  failingAudits,
  timelineEntries,
}) {
  return (
    <div className="view-stack">
      <PageHeader actions={headerActions} lastRun={lastRun} meta={meta} target={report?.target} />

      <section className="view-grid">
        <HeroScoreCard
          accent={performanceCard?.accent || 'indigo'}
          chips={[
            { label: performanceCard?.state || 'Unavailable', tone: performanceCard?.value >= 75 ? 'good' : 'warning' },
            { label: vitalsHealth.label, tone: vitalsHealth.tone === 'success' ? 'good' : 'warning' },
            {
              label: report?.performance?.environment?.profileLabel || 'Lighthouse run',
              tone: 'neutral',
            },
          ]}
          className="span-8"
          description={performanceCard ? `${performanceCard.description}. The latest Lighthouse run scored ${performanceCard.value}. ${performanceMethodology}` : 'Performance data is unavailable for this run.'}
          eyebrow="Overall Score"
          score={performanceCard?.value || 0}
          title={meta.title}
        />

        <Panel
          className="span-4"
          eyebrow="Score Breakdown"
          subtitle="Relative score distribution across the technical categories."
          title="Audit Balance"
        >
          <SignalBars items={scoreBreakdown} />
        </Panel>
      </section>

      <MetricCards items={vitalItems} />

      <Panel
        className="span-full"
        eyebrow="Performance Blockers"
        subtitle="Actionable Lighthouse performance findings ordered by impact."
        title="Top Performance Blockers"
      >
        <FailingAuditList audits={failingAudits} compact limit={6} />
      </Panel>

      <Panel
        className="span-full"
        eyebrow="Audit Stream Visualization"
        subtitle="Key checkpoints from the latest performance pass."
        title="Performance Trace"
      >
        <PerformanceTrace entries={timelineEntries} />
      </Panel>
    </div>
  );
}

const ISSUE_TYPE_LABEL = { spelling: 'Spelling', grammar: 'Grammar', clarity: 'Clarity' };
const ISSUE_TYPE_CLASS = { spelling: 'content-chip-spelling', grammar: 'content-chip-grammar', clarity: 'content-chip-clarity' };

function ContentQualityPanel({ contentData }) {
  if (!contentData || contentData.status === 'skipped') {
    return (
      <Panel
        actions={<StatusPill tone="warning">Skipped — no API key</StatusPill>}
        className="span-full"
        eyebrow="AI Content Review"
        subtitle="Set OPENROUTER_API_KEY to enable AI-powered content review."
        title="Content Quality"
      >
        <EmptyState message="Content analysis was skipped — no OpenRouter API key configured." />
      </Panel>
    );
  }

  const pages = Array.isArray(contentData.pages) ? contentData.pages : [];
  const s = contentData.summary || {};
  const totalIssues = s.totalIssues ?? pages.reduce((acc, p) => acc + (Array.isArray(p.issues) ? p.issues.length : 0), 0);

  return (
    <Panel
      actions={
        totalIssues > 0
          ? <StatusPill tone="error">{totalIssues} issue(s) found</StatusPill>
          : <StatusPill tone="success">No issues found</StatusPill>
      }
      className="span-full"
      eyebrow="AI Content Review"
      subtitle={`Spelling, grammar, and clarity check across ${s.pagesAnalyzed ?? pages.length} page(s).`}
      title="Content Quality"
    >
      {totalIssues > 0 && (
        <div className="content-summary-chips">
          <span className={cx('content-chip', 'content-chip-spelling')}>{s.spellingIssues ?? 0} Spelling</span>
          <span className={cx('content-chip', 'content-chip-grammar')}>{s.grammarIssues ?? 0} Grammar</span>
          <span className={cx('content-chip', 'content-chip-clarity')}>{s.clarityIssues ?? 0} Clarity</span>
        </div>
      )}

      {pages.length === 0 ? (
        <EmptyState message="No pages were analysed for content quality." />
      ) : (
        <div className="content-pages-list">
          {pages.map((page) => {
            const issues = Array.isArray(page.issues) ? page.issues : [];
            return (
              <div className="content-page-block" key={page.url}>
                <div className="content-page-header">
                  <span className="content-page-url">{page.url}</span>
                  <span className={cx('content-chip', issues.length > 0 ? (ISSUE_TYPE_CLASS[page.overallQuality] || 'content-chip-clarity') : 'content-chip-grammar')} style={{ fontSize: '0.72rem' }}>
                    {page.overallQuality || 'unknown'} quality
                  </span>
                </div>
                {issues.length === 0 ? (
                  <p style={{ padding: '10px 14px', margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>No issues detected on this page.</p>
                ) : (
                  <div className="content-issue-list">
                    {issues.map((issue, idx) => (
                      <article className="content-issue-card" key={idx}>
                        <div className="content-issue-top">
                          <span className={cx('content-chip', ISSUE_TYPE_CLASS[issue.type] || 'content-chip-clarity')}>
                            {ISSUE_TYPE_LABEL[issue.type] || issue.type}
                          </span>
                          <code className="content-issue-found">{issue.text}</code>
                        </div>
                        {issue.context && (
                          <p className="content-issue-context">&ldquo;{issue.context}&rdquo;</p>
                        )}
                        {issue.suggestion && (
                          <p className="content-issue-suggestion">
                            <strong>Fix:</strong> {issue.suggestion}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function SeoView({
  meta,
  report,
  lastRun,
  headerActions,
  seoCard,
  seoHighlights,
  seoStreamItems,
  seoFilter,
  onSeoFilterChange,
  seoPagination,
  onSeoPageChange,
  sitemapRobotsItems,
  contentIssueItems,
  contentSummary,
  contentData,
}) {
  return (
    <div className="view-stack">
      <PageHeader actions={headerActions} lastRun={lastRun} meta={meta} target={report?.target} />

      <section className="seo-overview-stack">
        <HeroScoreCard
          accent={seoCard?.accent || 'emerald'}
          chips={[
            { label: seoCard?.state || 'Unavailable', tone: seoCard?.value >= 90 ? 'good' : 'warning' },
            { label: `${report?.seo?.summary?.pagesAnalyzed ?? 0} pages`, tone: 'neutral' },
          ]}
          className="seo-hero-card"
          description={seoCard ? `${seoCard.description}. The latest scan reviewed ${report?.seo?.summary?.pagesAnalyzed ?? 0} pages.` : 'SEO data is unavailable for this run.'}
          eyebrow="Overall SEO Health"
          score={seoCard?.value || 0}
          title={meta.title}
        />

        <SeoHighlightGrid items={seoHighlights} stacked />
      </section>

      <Panel
        className="span-full"
        eyebrow="Critical Issues Stream"
        subtitle="Pages with the most urgent SEO structure gaps."
        title="Critical Issues Stream"
      >
        <IssueStream emptyMessage="No priority SEO issues were captured." items={seoStreamItems} />
      </Panel>

      {sitemapRobotsItems && sitemapRobotsItems.length > 0 && (
        <Panel
          className="span-full"
          eyebrow="Crawl Indexing"
          subtitle="Sitemap availability and robots.txt directive health."
          title="Sitemap &amp; Robots.txt"
        >
          <InfoList items={sitemapRobotsItems} />
        </Panel>
      )}

      <ContentQualityPanel contentData={contentData} />

      <Panel
        actions={
          <label className="select-with-icon">
            <Icon name="filter" />
            <select onChange={(event) => onSeoFilterChange(event.target.value)} value={seoFilter}>
              <option value="">All issues</option>
              <option value="title">Missing title</option>
              <option value="description">Missing description</option>
              <option value="h1">H1 problems</option>
              <option value="alt">Missing alt text</option>
              <option value="canonical">Missing canonical</option>
            </select>
          </label>
        }
        className="span-full"
        eyebrow="Page Content Health Audit"
        subtitle="Detailed breakdown of metadata and heading health per URL."
        title="SEO Detail"
      >
        <SeoTable
          onPageChange={onSeoPageChange}
          page={seoPagination.page}
          rows={seoPagination.items}
          totalItems={seoPagination.totalItems}
          totalPages={seoPagination.totalPages}
        />
      </Panel>
    </div>
  );
}

export function SecurityView({
  meta,
  report,
  lastRun,
  headerActions,
  securityScore,
  securitySummaryCards,
  transportChecks,
  headerChecks,
  securitySegments,
  issueItems,
  securityFilter,
  onSecurityFilterChange,
  securityRows,
  timelineEntries,
  wordPressFlags,
}) {
  return (
    <div className="view-stack">
      <PageHeader actions={headerActions} lastRun={lastRun} meta={meta} target={report?.target} />

      <section className="view-grid">
        <HeroScoreCard
          accent="indigo"
          chips={[
            { label: `Global status: ${securityScore.label}`, tone: securityScore.tone },
            { label: `${report?.summary?.securityFindings ?? 0} findings`, tone: 'neutral' },
          ]}
          className="span-7"
          description={securityScore.description}
          eyebrow="Security posture"
          score={securityScore.score}
          title="Security Analysis"
        />

        <div className="span-5">
          <SummaryTiles items={securitySummaryCards} />
        </div>
      </section>

      <section className="view-grid">
        <Panel
          className="span-6"
          eyebrow="Transport"
          subtitle="HTTPS, cookies, mixed content, and header pressure."
          title="Transport & Policy"
        >
          <InfoList items={transportChecks} />
        </Panel>

        <Panel
          className="span-6"
          eyebrow="Header Integrity"
          subtitle="Core browser and response-policy headers across the scanned pages."
          title="Header Integrity"
        >
          <HeaderChecklist items={headerChecks} />
        </Panel>
      </section>

      {wordPressFlags?.isWordPress && (
        <Panel
          actions={<StatusPill tone="warning">WordPress detected</StatusPill>}
          className="span-full"
          eyebrow="WordPress Security"
          subtitle="Endpoint exposure checks specific to WordPress installations."
          title="WordPress Checks"
        >
          <InfoList
            items={[
              {
                key: 'xmlrpc',
                label: 'XML-RPC (/xmlrpc.php)',
                value: wordPressFlags.xmlrpcExposed ? 'Exposed' : 'Not detected',
                detail: wordPressFlags.xmlrpcExposed
                  ? 'Endpoint is accessible — disable it to prevent brute-force and DDoS amplification.'
                  : 'Endpoint did not respond — likely disabled or protected.',
                tone: wordPressFlags.xmlrpcExposed ? 'danger' : 'good',
              },
              {
                key: 'users',
                label: 'User Enumeration (/wp-json/wp/v2/users)',
                value: wordPressFlags.usersEndpointExposed ? 'Leaking usernames' : 'Protected',
                detail: wordPressFlags.usersEndpointExposed
                  ? 'Public user list is accessible — restrict this endpoint to authenticated requests.'
                  : 'User list is not publicly accessible.',
                tone: wordPressFlags.usersEndpointExposed ? 'warning' : 'good',
              },
              {
                key: 'login',
                label: 'Login Page (/wp-login.php)',
                value: wordPressFlags.loginExposed ? 'Unprotected' : 'Protected',
                detail: wordPressFlags.loginExposed
                  ? 'Login page is accessible with no extra protection — consider rate limiting or 2FA.'
                  : 'Login page has additional protection or is not reachable.',
                tone: wordPressFlags.loginExposed ? 'warning' : 'good',
              },
            ]}
          />
        </Panel>
      )}

      <Panel
        actions={
          <label className="select-with-icon">
            <Icon name="filter" />
            <select onChange={(event) => onSecurityFilterChange(event.target.value)} value={securityFilter}>
              <option value="">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        }
        className="span-full"
        eyebrow="Finding Detail"
        subtitle="Headers, mixed content, and browser policy findings from the latest run."
        title="Security Findings"
      >
        <SecurityTable rows={securityRows} />
      </Panel>

      <section className="view-grid">
        <Panel
          className="span-4"
          eyebrow="Severity Mix"
          subtitle="Issue distribution across the active security findings."
          title="Severity Mix"
        >
          <SecuritySnapshot issueItems={issueItems} segments={securitySegments} />
        </Panel>

        <Panel
          className="span-8"
          eyebrow="Recent Activity"
          subtitle="Key events captured while security checks were running."
          title="Security Stream"
        >
          <TimelineList entries={timelineEntries} limit={4} variant="cards" />
        </Panel>
      </section>
    </div>
  );
}

export function CrawlView({
  meta,
  report,
  lastRun,
  headerActions,
  crawlInsights,
  crawlMap,
  duplicateRows,
  brokenLinks,
  redirects,
}) {
  const healthyTone =
    crawlInsights.healthScore >= 90
      ? 'success'
      : crawlInsights.healthScore >= 70
        ? 'warning'
        : 'error';

  return (
    <div className="view-stack">
      <PageHeader actions={headerActions} lastRun={lastRun} meta={meta} target={report?.target} />

      <section className="view-grid">
        <Panel
          actions={<StatusPill tone={healthyTone}>Healthy score: {crawlInsights.healthScore}%</StatusPill>}
          className="span-8"
          eyebrow="Internal Link Structure"
          subtitle="Route hierarchy and top internal branches from the latest crawl."
          title="Site Structure"
        >
          <CrawlMap map={crawlMap} />
        </Panel>

        <div className="span-4 tab-stack">
          <article className="coverage-card">
            <p className="coverage-card-eyebrow">Crawl Coverage</p>
            <strong>{crawlInsights.coverageLabel}</strong>
            <span>URLs crawled</span>
            <div className="coverage-track">
              <span style={{ width: `${crawlInsights.coverageProgress}%` }} />
            </div>
            <p>{crawlInsights.coverageCopy}</p>
          </article>

          <Panel
            eyebrow="Redirect Chains"
            subtitle="Redirect and broken-route pressure inside the crawl graph."
            title="Redirect Profile"
          >
            <RedirectBreakdown insight={crawlInsights} />
          </Panel>
        </div>
      </section>

      <section className="view-grid">
        <Panel
          className="span-5"
          eyebrow="Duplicate Findings"
          subtitle="Pages sharing duplicate titles or descriptions."
          title="Duplicate Findings"
        >
          <DuplicateTable limit={6} rows={duplicateRows} />
        </Panel>

        <Panel
          className="span-7"
          eyebrow="404 Detailed Log"
          subtitle="Broken internal routes with the page they were found on."
          title="Broken Links"
        >
          <BrokenLinksTable limit={8} rows={brokenLinks} />
        </Panel>
      </section>

      <section className="view-grid">
        <Panel
          className="span-full"
          eyebrow="Redirect Log"
          subtitle="All detected redirects — where they start and where they resolve."
          title="Redirects"
        >
          <RedirectsTable limit={15} rows={redirects ?? []} />
        </Panel>
      </section>
    </div>
  );
}

export function AuditStreamView({
  meta,
  report,
  lastRun,
  headerActions,
  timelineEntries,
  auditHealth,
  agentNodes,
}) {
  const eventVelocity = timelineEntries.length * 24;
  const errorCount = timelineEntries.filter((entry) =>
    /(error|failed|broken)/i.test(entry.message),
  ).length;

  return (
    <div className="view-stack">
      <PageHeader actions={headerActions} lastRun={lastRun} meta={meta} target={report?.target} />

      <section className="stream-stats">
        <article className="stream-stat">
          <span>Event velocity</span>
          <strong>{eventVelocity}</strong>
          <small>e/min</small>
        </article>
        <article className="stream-stat">
          <span>Errors (24h)</span>
          <strong>{errorCount}</strong>
          <small>logged</small>
        </article>
      </section>

      <section className="view-grid">
        <Panel
          actions={
            <div className="filter-chip-row">
              <span className="filter-chip filter-chip-active">All Events</span>
              <span className="filter-chip">System Logs</span>
            </div>
          }
          className="span-8"
          eyebrow="Chronological Log"
          subtitle="Real-time telemetry and event logging from the latest audit run."
          title="Audit Stream"
        >
          <TimelineList entries={timelineEntries} variant="cards" />
        </Panel>

        <div className="span-4 tab-stack">
          <article className="audit-health-card">
            <p className="audit-health-eyebrow">Audit Health</p>
            <strong>{auditHealth.score}</strong>
            <span>{auditHealth.label}</span>
            <p>{auditHealth.detail}</p>
          </article>

          <Panel
            eyebrow="Crawler Nodes"
            subtitle="Current agent outputs contributing to the latest report."
            title="Crawler Nodes"
          >
            <AgentNodes items={agentNodes} />
          </Panel>

          <Panel
            eyebrow="Active Session"
            subtitle="The latest saved report currently loaded in the dashboard."
            title="Active Session"
          >
            <SessionCard
              lastRun={lastRun}
              pages={report?.summary?.pagesCrawled ?? 0}
              target={report?.target || 'No target'}
            />
          </Panel>
        </div>
      </section>
    </div>
  );
}

export function DocumentationView({ meta, onStartAudit, report }) {
  const reportStatus = report
    ? `Active report loaded for ${report.target || 'the current target'}.`
    : 'Enter any public URL in the bar above and click Run Audit to get your first report.';

  return (
    <div className="view-stack documentation-view">
      <section className="documentation-hero">
        <div className="documentation-hero-copy">
          <p className="page-eyebrow">{meta.eyebrow}</p>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
          <p className="documentation-hero-note">{reportStatus}</p>
          <div className="documentation-chip-row">
            <span className="documentation-chip">Link crawler</span>
            <span className="documentation-chip">Lighthouse scoring</span>
            <span className="documentation-chip">SEO inspection</span>
            <span className="documentation-chip">Security review</span>
            <span className="documentation-chip">AI UX analysis</span>
            <span className="documentation-chip">Exportable reports</span>
          </div>
          <div className="documentation-hero-actions">
            <button className="cta-button" onClick={onStartAudit} type="button">
              Run your first audit
            </button>
          </div>
        </div>

        <div className="documentation-hero-side">
          <article className="documentation-side-card">
            <p className="documentation-card-eyebrow">No Sign-up Required</p>
            <strong>Paste a URL and go</strong>
            <p>
              Frontend Atlas is a live tool. Enter any public URL, hit Run Audit, and results
              appear across six dashboard tabs in under two minutes.
            </p>
          </article>
          <article className="documentation-side-card documentation-side-card-soft">
            <p className="documentation-card-eyebrow">Every Audit Produces</p>
            <div className="documentation-output-stack">
              <code>Live dashboard results</code>
              <code>Downloadable JSON report</code>
              <code>Shareable HTML report</code>
            </div>
          </article>
        </div>
      </section>

      <DocumentationHighlightGrid items={documentationHighlights} />

      <section className="view-grid">
        <Panel
          className="span-full"
          eyebrow="Architecture"
          subtitle="The six agents that work together to build each report."
          title="Agent Pipeline"
        >
          <DocumentationAgentGrid items={documentationAgentRows} />
        </Panel>
      </section>

      <section className="view-grid">
        <Panel
          className="span-6"
          eyebrow="Getting Started"
          subtitle="How to get an audit result from the live dashboard."
          title="Using the Platform"
        >
          <DocumentationRows items={documentationCommandRows} />
        </Panel>

        <Panel
          className="span-6"
          eyebrow="Coverage"
          subtitle="The full set of checks the platform runs on every audit."
          title="What Gets Checked"
        >
          <DocumentationRows items={documentationEnvironmentRows} />
        </Panel>
      </section>

      <section className="view-grid">
        <Panel
          className="span-6"
          eyebrow="Results"
          subtitle="Every audit produces these outputs automatically."
          title="What You Get Back"
        >
          <DocumentationRows items={documentationApiRows} />
        </Panel>

        <Panel
          className="span-6"
          eyebrow="Contributing"
          subtitle="Areas where contributions have the most impact."
          title="Improving the Platform"
        >
          <DocumentationRows items={documentationOutputRows} />
        </Panel>
      </section>

      <section className="view-grid">
        <Panel
          className="span-7"
          eyebrow="Dashboard Guide"
          subtitle="What each tab shows once an audit report is loaded."
          title="Tabs Explained"
        >
          <DocumentationRows items={documentationTabRows} />
        </Panel>

        <Panel
          className="span-5"
          eyebrow="Get Involved"
          subtitle="How to report issues, suggest improvements, and contribute."
          title="Contributing & Feedback"
        >
          <DocumentationRows items={documentationTroubleshootingRows} />
        </Panel>
      </section>
    </div>
  );
}
