import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { EmptyState, StatusPill } from './components';
import ReportWorkspace from './report-workspace';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function getRoute() {
  const { pathname } = window.location;

  if (pathname.startsWith('/audits/')) {
    return { name: 'audit', auditId: pathname.split('/')[2] };
  }

  return { name: 'home' };
}

function navigate(pathname) {
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
  });

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
}

function buildMotionProps(shouldReduceMotion, delay = 0, distance = 18) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0.01, delay: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] },
  };
}

function MotionSection({ children, className, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.section className={className} {...buildMotionProps(shouldReduceMotion, delay)}>
      {children}
    </motion.section>
  );
}

function MotionDiv({ children, className, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div className={className} {...buildMotionProps(shouldReduceMotion, delay, 14)}>
      {children}
    </motion.div>
  );
}

function MetricCard({ label, value, copy, tone = 'default' }) {
  return (
    <article className={cx('saas-metric-card', `saas-metric-card-${tone}`)}>
      <p>{label}</p>
      <strong>{value}</strong>
      {copy ? <span>{copy}</span> : null}
    </article>
  );
}

function SectionCard({ eyebrow, title, subtitle, actions, children, className }) {
  return (
    <section className={cx('saas-section-card', className)}>
      <div className="saas-section-head">
        <div>
          {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="saas-section-actions">{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function AppChrome({ onNavigate }) {
  return (
    <header className="saas-header">
      <button className="brand-button" onClick={() => onNavigate('/')} type="button">
        <span className="brand-mark brand-mark-saas" />
        <span className="brand-copy">
          <strong>Frontend Atlas</strong>
          <small>AI website audits</small>
        </span>
      </button>
    </header>
  );
}

function DashboardPage({ audits, publicConfig, onCreateAudit, onNavigate }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [crawlIndex, setCrawlIndex] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const crawlTier = publicConfig.tiers.crawlTiers[crawlIndex];
  const contentTier = publicConfig.tiers.contentTiers[contentIndex];
  const contentReviewEnabled =
    contentTier === 0 || publicConfig.capabilities.contentReviewEnabled;

  return (
    <main className="dashboard-shell">
      <MotionSection className="dashboard-hero dashboard-hero-refined" delay={0.04}>
        <div>
          <p className="eyebrow">Audit Panel</p>
          <h1>Frontend Audit Tool</h1>
          <p>Run crawler, SEO, performance, and security audits. Enter a URL and queue a job.</p>
        </div>
        <div className="dashboard-hero-side">
          <StatusPill tone="success">Ready</StatusPill>
        </div>
      </MotionSection>

      <MotionDiv delay={0.1}>
        <SectionCard
          eyebrow="New run"
          className="builder-card"
          title="Create a new audit"
          subtitle="Pick crawl depth and content review scope before queuing the job."
        >
          <form
            className="audit-builder builder-layout"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateAudit({ targetUrl, crawlTier, contentTier });
            }}
          >
            <div className="builder-main">
              <label className="stacked-field">
                <span>Website URL</span>
                <input
                  onBlur={(event) => {
                    const val = event.target.value.trim();
                    if (val && !/^https?:\/\//i.test(val)) {
                      setTargetUrl('https://' + val);
                    }
                  }}
                  onChange={(event) => setTargetUrl(event.target.value)}
                  placeholder="example.com"
                  required
                  type="url"
                  value={targetUrl}
                />
              </label>

              <div className="stacked-field">
                <span>Crawl pages</span>
                <div className="tier-scale">
                  {publicConfig.tiers.crawlTiers.map((value, index) => (
                    <button
                      className={cx('tier-chip', index === crawlIndex && 'tier-chip-active')}
                      key={`crawl-${value}`}
                      onClick={() => {
                        setCrawlIndex(index);
                        if (publicConfig.tiers.contentTiers[contentIndex] > value) {
                          const safeIndex = publicConfig.tiers.contentTiers.findIndex((v) => v <= value);
                          setContentIndex(Math.max(safeIndex, 0));
                        }
                      }}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stacked-field">
                <span>Content review pages</span>
                <div className="tier-scale">
                  {publicConfig.tiers.contentTiers.map((value, index) => (
                    <button
                      className={cx(
                        'tier-chip',
                        index === contentIndex && 'tier-chip-active',
                        value > crawlTier && 'tier-chip-disabled'
                      )}
                      disabled={value > crawlTier}
                      key={`content-${value}`}
                      onClick={() => setContentIndex(index)}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {!contentReviewEnabled ? (
                <div className="inline-banner subtle">
                  Content review is disabled — configure OPENROUTER_API_KEY on the server to enable it.
                </div>
              ) : null}
            </div>

            <aside className="builder-side">
              <div className="audit-summary-card">
                <p className="section-kicker">Audit summary</p>
                <h3>
                  {crawlTier} crawl / {contentTier} content
                </h3>
                <div className="audit-summary-list">
                  <div>
                    <span>Crawl depth</span>
                    <strong>{crawlTier} pages</strong>
                  </div>
                  <div>
                    <span>Content review</span>
                    <strong>{contentTier === 0 ? 'Disabled' : `${contentTier} pages`}</strong>
                  </div>
                  <div>
                    <span>Queue policy</span>
                    <strong>Single worker</strong>
                  </div>
                </div>
                <button
                  className="cta-button full-width"
                  disabled={!contentReviewEnabled && contentTier > 0}
                  type="submit"
                >
                  Queue Audit
                </button>
              </div>
            </aside>
          </form>
        </SectionCard>
      </MotionDiv>

      <MotionDiv delay={0.16}>
        <SectionCard
          eyebrow="History"
          title="Audit history"
          subtitle="Open any completed audit to view the full six-tab report workspace."
        >
          {!audits.length ? (
            <EmptyState message="No audits queued yet." />
          ) : (
            <div className="simple-list">
              {audits.map((audit) => (
                <button
                  className="audit-row-button"
                  key={audit.id}
                  onClick={() => onNavigate(`/audits/${audit.id}`)}
                  type="button"
                >
                  <div>
                    <strong>{audit.targetUrl}</strong>
                    <p>
                      {audit.crawlTier} crawl / {audit.contentTier} content
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      audit.status === 'completed'
                        ? 'success'
                        : audit.status === 'failed'
                          ? 'error'
                          : 'loading'
                    }
                  >
                    {audit.status}
                  </StatusPill>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </MotionDiv>
    </main>
  );
}

function AuditStatusPage({ audit, onNavigate, onRefresh }) {
  const statusTone =
    audit.status === 'completed' ? 'success' : audit.status === 'failed' ? 'error' : 'loading';

  return (
    <main className="dashboard-shell">
      <MotionSection className="dashboard-hero dashboard-hero-refined" delay={0.04}>
        <div>
          <p className="eyebrow">Audit job</p>
          <h1>{audit.targetUrl}</h1>
          <p>Track queue progress and execution state before the report workspace is ready.</p>
        </div>
        <StatusPill tone={statusTone}>{audit.status}</StatusPill>
      </MotionSection>

      <MotionDiv delay={0.1}>
        <SectionCard
          eyebrow="Status"
          title="Run details"
          subtitle={audit.targetUrl}
          actions={
            <button className="ghost-button" onClick={onRefresh} type="button">
              Refresh
            </button>
          }
        >
          <div className="feature-grid">
            <MetricCard label="Status" value={audit.status} />
            <MetricCard
              label="Crawl / Content"
              value={`${audit.crawlTier} / ${audit.contentTier}`}
              copy={`Consumed ${audit.consumedCrawl} / ${audit.consumedContent}`}
            />
            <MetricCard
              label="Queued"
              value={formatDate(audit.queuedAt)}
              copy={
                audit.finishedAt ? `Finished ${formatDate(audit.finishedAt)}` : 'Still processing'
              }
            />
          </div>

          <div className="inline-banner subtle">
            <StatusPill tone={statusTone}>{audit.status}</StatusPill>
            <span>{audit.errorMessage || 'Follow the live log below while the worker runs.'}</span>
          </div>
        </SectionCard>
      </MotionDiv>

      <MotionDiv delay={0.16}>
        <SectionCard eyebrow="Logs" title="Execution log">
          {!audit.logs?.length ? (
            <EmptyState message="No log entries yet." />
          ) : (
            <div className="simple-list">
              {audit.logs.map((entry, index) => (
                <article className="simple-list-row" key={`${entry.at}-${index}`}>
                  <div>
                    <strong>{entry.message}</strong>
                    <p>{formatDate(entry.at)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </MotionDiv>

      {audit.status === 'failed' ? (
        <button className="cta-button" onClick={() => onNavigate('/')} type="button">
          Start Another Audit
        </button>
      ) : null}
    </main>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [route, setRoute] = useState(getRoute);
  const [publicConfig, setPublicConfig] = useState({
    tiers: {
      crawlTiers: [10, 30, 50],
      contentTiers: [0, 5, 10, 20],
      freeTrial: { crawl: 10, content: 5 },
    },
    capabilities: {},
  });
  const [audits, setAudits] = useState([]);
  const [auditDetail, setAuditDetail] = useState(null);
  const [flash, setFlash] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  async function refreshBase() {
    const mePayload = await apiFetch('/api/me');
    if (mePayload.publicConfig) {
      setPublicConfig(mePayload.publicConfig);
    }
  }

  async function refreshAudits() {
    const payload = await apiFetch('/api/audits');
    setAudits(payload.audits || []);
  }

  async function loadAudit(auditId) {
    const payload = await apiFetch(`/api/audits/${auditId}`);
    setAuditDetail(payload);
  }

  useEffect(() => {
    refreshBase().catch((error) => setFlash(error.message));
    refreshAudits().catch((error) => setFlash(error.message));
  }, []);

  useEffect(() => {
    if (route.name === 'audit' && route.auditId) {
      loadAudit(route.auditId).catch((error) => setFlash(error.message));
    }
  }, [route]);

  useEffect(() => {
    if (
      route.name !== 'audit' ||
      !auditDetail?.audit ||
      ['completed', 'failed'].includes(auditDetail.audit.status)
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      loadAudit(route.auditId).catch(() => {});
    }, 4000);

    return () => window.clearInterval(timer);
  }, [route, auditDetail]);

  async function handleCreateAudit({ targetUrl, crawlTier, contentTier }) {
    setBusy(true);
    try {
      const payload = await apiFetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, crawlTier, contentTier }),
      });
      await refreshAudits();
      navigate(`/audits/${payload.audit.id}`);
    } catch (error) {
      setFlash(error.message);
    } finally {
      setBusy(false);
    }
  }

  const auditStatus = (() => {
    if (!auditDetail?.audit) {
      return { label: 'Completed', tone: 'success' };
    }
    const audit = auditDetail.audit;
    return {
      label:
        audit.status === 'completed'
          ? 'Audit complete'
          : audit.status === 'failed'
            ? 'Audit failed'
            : 'Audit running',
      tone:
        audit.status === 'completed'
          ? 'success'
          : audit.status === 'failed'
            ? 'error'
            : 'loading',
    };
  })();

  let routeContent = null;

  if (route.name === 'home') {
    routeContent = (
      <DashboardPage
        audits={audits}
        onCreateAudit={handleCreateAudit}
        onNavigate={navigate}
        publicConfig={publicConfig}
      />
    );
  } else if (route.name === 'audit') {
    routeContent =
      auditDetail?.audit?.status === 'completed' && auditDetail.report ? (
        <ReportWorkspace
          auditStatus={auditStatus}
          logEntries={auditDetail.audit.logs || []}
          onExportHtml={() =>
            window.open(
              `/api/audits/${auditDetail.audit.id}/report/html`,
              '_blank',
              'noopener,noreferrer'
            )
          }
          onExportJson={() =>
            window.open(
              `/api/audits/${auditDetail.audit.id}/report/json`,
              '_blank',
              'noopener,noreferrer'
            )
          }
          onStartNewAudit={() => navigate('/')}
          report={auditDetail.report}
        />
      ) : auditDetail?.audit ? (
        <AuditStatusPage
          audit={auditDetail.audit}
          onNavigate={navigate}
          onRefresh={() => loadAudit(route.auditId).catch((error) => setFlash(error.message))}
        />
      ) : (
        <main className="dashboard-shell">
          <EmptyState message="Loading audit..." />
        </main>
      );
  }

  return (
    <div className="saas-app">
      <AppChrome onNavigate={navigate} />

      {flash ? (
        <motion.div
          className="app-flash"
          {...buildMotionProps(shouldReduceMotion, 0, 8)}
        >
          <span>{flash}</span>
          <button onClick={() => setFlash('')} type="button">
            Dismiss
          </button>
        </motion.div>
      ) : null}

      {busy ? (
        <motion.div
          className="busy-bar"
          {...buildMotionProps(shouldReduceMotion, 0.03, 8)}
        >
          Queuing audit...
        </motion.div>
      ) : null}

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          className="route-frame"
          key={
            route.name === 'audit'
              ? `${route.name}-${route.auditId}-${auditDetail?.audit?.status || 'loading'}`
              : route.name
          }
          {...buildMotionProps(shouldReduceMotion, 0.02, 20)}
        >
          {routeContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
