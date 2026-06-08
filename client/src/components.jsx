import React from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function inferTimelineTone(message = '') {
  const lower = message.toLowerCase();

  if (lower.includes('error') || lower.includes('failed') || lower.includes('broken')) {
    return 'danger';
  }

  if (lower.includes('warning') || lower.includes('missing') || lower.includes('flagged')) {
    return 'warning';
  }

  if (lower.includes('complete') || lower.includes('saved') || lower.includes('generated')) {
    return 'success';
  }

  return 'neutral';
}

const iconMap = {
  dashboard: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.6" />
      <rect x="14" y="4" width="6" height="6" rx="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.6" />
    </>
  ),
  performance: (
    <>
      <path d="M5 16a7 7 0 1 1 14 0" />
      <path d="M12 12l4-3" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  seo: (
    <>
      <circle cx="11" cy="11" r="5.6" />
      <path d="M16 16l4 4" />
    </>
  ),
  security: (
    <>
      <path d="M12 3l7 3v5c0 4.3-2.7 7.9-7 10-4.3-2.1-7-5.7-7-10V6l7-3z" />
      <path d="M9.5 12.2l1.8 1.8 3.5-3.8" />
    </>
  ),
  crawl: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M8 8.4l8-1" />
      <path d="M7.4 8.8l3.7 6.8" />
      <path d="M16.9 7.8l-3.3 7" />
    </>
  ),
  stream: (
    <>
      <path d="M6 6h12" />
      <path d="M6 12h12" />
      <path d="M6 18h8" />
      <circle cx="16.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  docs: (
    <>
      <path d="M7 5.5h8.5a2.5 2.5 0 0 1 2.5 2.5v10.5H9.5A2.5 2.5 0 0 0 7 21V5.5z" />
      <path d="M7 5.5h-.5A2.5 2.5 0 0 0 4 8v10.5h12" />
      <path d="M10 9.5h5" />
      <path d="M10 13h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M8.5 10.5L12 14l3.5-3.5" />
      <path d="M5 19h14" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M18.4 11A6.5 6.5 0 0 0 7.2 6.9L5 11" />
      <path d="M5.6 13A6.5 6.5 0 0 0 16.8 17.1L19 13" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5l3-3" />
      <path d="M8 15a3.5 3.5 0 0 1 0-5l2-2a3.5 3.5 0 1 1 5 5l-.8.8" />
      <path d="M16 9a3.5 3.5 0 0 1 0 5l-2 2a3.5 3.5 0 0 1-5-5l.8-.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 12h15" />
      <path d="M12 4a12 12 0 0 1 0 16" />
      <path d="M12 4a12 12 0 0 0 0 16" />
    </>
  ),
  server: (
    <>
      <rect x="5" y="4.5" width="14" height="6" rx="1.8" />
      <rect x="5" y="13.5" width="14" height="6" rx="1.8" />
      <path d="M8 7.5h.01" />
      <path d="M8 16.5h.01" />
    </>
  ),
  filter: (
    <>
      <path d="M5 7h14" />
      <path d="M8 12h8" />
      <path d="M10 17h4" />
    </>
  ),
};

export function Icon({ name, className }) {
  return (
    <svg
      aria-hidden="true"
      className={cx('icon', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      {iconMap[name] || iconMap.spark}
    </svg>
  );
}

export function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}

export function StatusPill({ tone = 'idle', children }) {
  return <span className={cx('status-pill', `status-pill-${tone}`)}>{children}</span>;
}

export function Panel({ eyebrow, title, subtitle, actions, className, children, id }) {
  return (
    <section className={cx('panel', className)} id={id}>
      {(eyebrow || title || subtitle || actions) && (
        <header className="panel-head">
          <div>
            {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="panel-title">{title}</h2> : null}
            {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Sidebar({
  items,
  activeTab,
  onSelect,
  onStartNewAudit,
  onOpenDocumentation,
  brandName = 'Frontend Atlas',
  brandSubtitle = 'Automation Testing Suite',
}) {
  return (
    <aside className="app-sidebar">
      <div className="brand-lockup">
        <span className="brand-mark" />
        <div>
          <strong>{brandName}</strong>
          <p>{brandSubtitle}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            className={cx('nav-button', activeTab === item.id && 'nav-button-active')}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <Icon className="nav-icon" name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="sidebar-cta" onClick={onStartNewAudit} type="button">
        <Icon name="plus" />
        <span>Start New Audit</span>
      </button>

      <div className="sidebar-footer">
        <button
          className={cx('sidebar-footer-link', activeTab === 'documentation' && 'sidebar-footer-link-active')}
          onClick={onOpenDocumentation}
          type="button"
        >
          <Icon name="docs" />
          Documentation
        </button>
      </div>
    </aside>
  );
}

export function TopTabs({ items, activeTab, onSelect }) {
  return (
    <nav className="top-tabs" aria-label="Primary dashboard sections">
      {items.map((item) => (
        <button
          className={cx('top-tab', activeTab === item.id && 'top-tab-active')}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function OverviewStats({ items }) {
  return (
    <div className="overview-stats">
      {items.map((item) => (
        <article className="overview-stat" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}

export function ScoreRow({ items }) {
  if (!items.length) {
    return <EmptyState message="Lighthouse data is unavailable for this run." />;
  }

  return (
    <div className="score-row">
      {items.map((item) => (
        <article className="score-tile" key={item.key}>
          <div className={cx('score-orbit', `score-orbit-${item.accent}`)} style={{ '--score': item.value }}>
            <span>{item.value}</span>
          </div>
          <div className="score-tile-copy">
            <small>{item.state}</small>
            <h3>{item.label}</h3>
            <p>{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function VitalsPanel({ items }) {
  if (!items.length) {
    return <EmptyState message="Performance metrics are unavailable." />;
  }

  return (
    <div className="vitals-list">
      {items.map((item) => (
        <article className="vital-row" key={item.key}>
          <div className="vital-head">
            <div>
              <span className="vital-label">{item.label}</span>
              <strong className="vital-value">{item.value}</strong>
            </div>
            <span className={cx('vital-state', `vital-state-${item.rating}`)}>{item.state}</span>
          </div>
          <div className="vital-track">
            <span className={cx('vital-fill', `vital-fill-${item.rating}`)} style={{ width: `${item.fill}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function FailingAuditList({ audits, compact = false, limit = 4 }) {
  if (!audits.length) {
    return <EmptyState message="No failing Lighthouse audits to display." />;
  }

  return (
    <div className={cx('audit-card-stack', compact && 'audit-card-stack-compact')}>
      {audits.slice(0, limit).map((audit) => (
        <article className={cx('audit-card', `audit-card-${audit.severity}`)} key={audit.id || audit.title}>
          <div className="audit-card-top">
            <h3>{audit.title}</h3>
            <span className={cx('impact-pill', `impact-pill-${audit.severity}`)}>
              {audit.severity === 'high' ? 'High Impact' : 'Medium Impact'}
            </span>
          </div>
          <p>{audit.description || 'No description available.'}</p>
          <div className="audit-card-bottom">
            <span className="audit-score-chip">Score {audit.score ?? '-'}</span>
            <strong>{audit.displayValue || 'Potential savings pending'}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RecommendationCard({ item, onOpenReport }) {
  return (
    <article className="recommendation-card">
      <p className="recommendation-eyebrow">{item.eyebrow}</p>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      <div className="recommendation-footer">
        <button className="recommendation-button" onClick={onOpenReport} type="button">
          View implementation guide
        </button>
        <span>{item.meta}</span>
      </div>
    </article>
  );
}

export function SecuritySnapshot({ segments, issueItems }) {
  if (!segments.length) {
    return <EmptyState message="Security findings are unavailable." />;
  }

  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 1);

  return (
    <div className="snapshot-stack">
      <div className="severity-meter">
        {segments.map((segment) => (
          <span
            className={cx('severity-segment', `severity-${segment.label}`)}
            key={segment.label}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="snapshot-grid">
        {segments.map((segment) => (
          <article className="snapshot-chip" key={segment.label}>
            <strong>{segment.label}</strong>
            <span>{segment.value} findings</span>
          </article>
        ))}
      </div>

      <div className="issue-mini-list">
        {issueItems.slice(0, 4).map((item) => (
          <div className="issue-mini-row" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ title, items }) {
  return (
    <article className="detail-card">
      <h3>{title}</h3>
      {Array.isArray(items) && items.length ? (
        <ul>
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No items reported.</p>
      )}
    </article>
  );
}

export function UxPanel({ ux }) {
  if (!ux) {
    return <EmptyState message="UX analysis is unavailable." />;
  }

  if (ux.status === 'skipped' || ux.status === 'error') {
    return <EmptyState message={ux.reason || ux.message || 'No UX output.'} />;
  }

  return (
    <div className="ux-section">
      <article className="detail-card detail-card-wide">
        <h3>Overall Assessment</h3>
        <p>{ux.overallAssessment || 'No narrative supplied.'}</p>
      </article>
      <div className="detail-grid-two">
        <ListBlock items={ux.uiIssues} title="UI Issues" />
        <ListBlock items={ux.ctaImprovements} title="CTA Improvements" />
        <ListBlock items={ux.layoutSuggestions} title="Layout Suggestions" />
        <ListBlock items={ux.priorityFixes} title="Priority Fixes" />
      </div>
    </div>
  );
}

export function TimelineList({ entries, variant = 'line', limit }) {
  const items = typeof limit === 'number' ? entries.slice(0, limit) : entries;

  if (!items.length) {
    return <EmptyState message="No audit events are available for this run." />;
  }

  if (variant === 'cards') {
    return (
      <div className="timeline-card-list">
        {items.map((entry, index) => {
          const tone = inferTimelineTone(entry.message);

          return (
            <article className={cx('timeline-card', `timeline-card-${tone}`)} key={`${entry.at}-${index}`}>
              <span className="timeline-card-dot" />
              <div className="timeline-card-copy">
                <div className="timeline-card-top">
                  <strong>{entry.message}</strong>
                  <span>{entry.at}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="stream-list">
      {items.map((entry, index) => (
        <article className="stream-item" key={`${entry.at}-${index}`}>
          <span className="stream-dot" />
          <div className="stream-copy">
            <div className="stream-top">
              <strong>{entry.message}</strong>
              <span>{entry.at}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function BrokenLinksTable({ rows, limit = 12 }) {
  if (!rows.length) {
    return <EmptyState message="No broken internal links were detected." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Broken URL</th>
            <th>Status</th>
            <th>Issue</th>
            <th>Found On</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row) => (
            <tr key={row.url}>
              <td>
                <code>{row.url}</code>
              </td>
              <td>{row.status ?? 'n/a'}</td>
              <td>{row.error || 'Unknown failure'}</td>
              <td>
                {Array.isArray(row.foundOn) && row.foundOn.length > 0 ? (
                  <div className="found-on-list">
                    {row.foundOn.map((src) => (
                      <code className="found-on-src" key={src}>{src}</code>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RedirectsTable({ rows, limit = 15 }) {
  if (!rows.length) {
    return <EmptyState message="No redirects were detected." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th>Found On</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row) => (
            <tr key={row.url}>
              <td><code>{row.url}</code></td>
              <td><code>{row.finalUrl || row.chain?.[row.chain.length - 1] || '—'}</code></td>
              <td>{row.status ?? 'n/a'}</td>
              <td>
                {Array.isArray(row.foundOn) && row.foundOn.length > 0 ? (
                  <div className="found-on-list">
                    {row.foundOn.map((src) => (
                      <code className="found-on-src" key={src}>{src}</code>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CrawlMap({ map }) {
  if (!map || !map.routes.length) {
    return <EmptyState message="Not enough crawl data to render the site structure." />;
  }

  const [root, ...branches] = map.routes;

  return (
    <div className="crawl-structure">
      <article className="crawl-root-node">
        <div className="crawl-node-main">
          <div className="crawl-node-icon">
            <Icon name="crawl" />
          </div>
          <div className="crawl-node-copy">
            <strong>{root.path}</strong>
            <p>
              Depth 0 - {root.outgoing} outbound links - {root.incoming} inbound links
            </p>
          </div>
        </div>
        <span className="crawl-status-badge">HTTP {root.status}</span>
      </article>

      <div className="crawl-branch-list">
        {branches.map((route) => (
          <article
            className={cx('crawl-branch-item', Number(route.status) >= 400 && 'crawl-branch-item-danger')}
            key={route.id}
          >
            <div className="crawl-branch-copy">
              <strong>{route.path}</strong>
              <p>{route.title}</p>
            </div>
            <div className="crawl-branch-meta">
              <span>HTTP {route.status}</span>
              <span>{route.outgoing} out</span>
              <span>{route.incoming} in</span>
              {route.redirect ? <span>Redirected</span> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SeoTable({ rows, page, totalPages, totalItems, onPageChange }) {
  if (!rows.length) {
    return <EmptyState message="No major SEO issues were captured for the selected filter." />;
  }

  return (
    <>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Title</th>
              <th>Description</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.url}>
                <td>
                  <code>{row.url}</code>
                </td>
                <td>{row.title || 'Missing'}</td>
                <td>{row.metaDescription || 'Missing'}</td>
                <td>{row.issues.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="table-pagination">
          <span>
            Showing {rows.length} of {totalItems} items
          </span>
          <div className="table-pagination-actions">
            <button
              className="ghost-button small-button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              type="button"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="ghost-button small-button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SecurityTable({ rows, limit = 20 }) {
  if (!rows.length) {
    return <EmptyState message="No security findings were captured for the selected filter." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Category</th>
            <th>Page</th>
            <th>Finding</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row, index) => (
            <tr key={`${row.pageUrl}-${index}`}>
              <td>
                <span className={cx('severity-tag', `severity-tag-${row.severity}`)}>{row.severity}</span>
              </td>
              <td>{row.category}</td>
              <td>
                <code>{row.pageUrl}</code>
              </td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DuplicateTable({ rows, limit = 12 }) {
  if (!rows.length) {
    return <EmptyState message="No duplicate titles or descriptions detected." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
            <th>Affected pages</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, limit).map((row, index) => (
            <tr key={`${row.field}-${index}`}>
              <td>
                <span className="duplicate-badge">{row.field}</span>
              </td>
              <td>{row.value}</td>
              <td>
                <div className="code-stack">
                  {row.urls.map((url) => (
                    <code key={url}>{url}</code>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-layout">
      <div className="score-row">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={`card-${index}`} />
        ))}
      </div>
      <div className="view-grid">
        <div className="skeleton-panel span-7" />
        <div className="skeleton-panel span-5" />
        <div className="skeleton-panel span-full" />
      </div>
    </div>
  );
}
