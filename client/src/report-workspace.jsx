import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { EmptyState, Icon, Sidebar, StatusPill } from './components';
import {
  AuditStreamView,
  CrawlView,
  DashboardView,
  DocumentationView,
  PerformanceView,
  SecurityView,
  SeoView,
} from './tab-views';
import {
  buildAgentNodes,
  buildAuditHealth,
  buildBrokenLinks,
  buildCrawlInsights,
  buildCrawlMap,
  buildDuplicateRows,
  buildFailingAudits,
  buildFailingAuditMeta,
  buildIssueItems,
  buildOverviewStats,
  buildPerformanceMethodology,
  buildPrimaryRecommendation,
  buildScoreBreakdown,
  buildScoreCards,
  buildSecurityHeaderItems,
  buildSecurityRows,
  buildSecurityScore,
  buildSecuritySegments,
  buildSecuritySummaryCards,
  buildSeoHighlights,
  buildSeoRows,
  buildSeoStreamItems,
  buildTimelineEntries,
  buildTransportChecks,
  buildVitalItems,
  buildVitalsHealth,
  buildSitemapRobotsItems,
  buildWordPressFlags,
  buildContentIssueItems,
  buildContentSummary,
  buildRedirects,
  formatRelativeTime,
  getScoreCard,
  paginateRows,
  sidebarItems,
  tabMeta,
} from './report-utils';

const siteBrand = {
  name: 'Frontend Atlas',
  subtitle: 'Automation Testing Suite',
};

export default function ReportWorkspace({
  report,
  logEntries = [],
  auditStatus = { label: 'Completed', tone: 'success' },
  onStartNewAudit,
  onExportJson,
  onExportHtml,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [seoFilter, setSeoFilter] = useState('');
  const [seoPage, setSeoPage] = useState(1);
  const [securityFilter, setSecurityFilter] = useState('');

  useEffect(() => {
    setSeoPage(1);
  }, [seoFilter, report]);

  const overviewStats = buildOverviewStats(report);
  const scoreCards = buildScoreCards(report);
  const scoreBreakdown = buildScoreBreakdown(scoreCards);
  const performanceCard = getScoreCard(scoreCards, 'performance');
  const seoCard = getScoreCard(scoreCards, 'seo');
  const vitalItems = buildVitalItems(report);
  const vitalsHealth = buildVitalsHealth(vitalItems);
  const failingAudits = buildFailingAudits(report);
  const failingAuditMeta = buildFailingAuditMeta(report, failingAudits);
  const performanceMethodology = buildPerformanceMethodology(report);
  const recommendation = buildPrimaryRecommendation(report, failingAudits);
  const securitySegments = buildSecuritySegments(report);
  const issueItems = buildIssueItems(report);
  const timelineEntries = buildTimelineEntries(report, logEntries).map((entry) => ({
    ...entry,
    at: formatRelativeTime(entry.at),
  }));
  const brokenLinks = buildBrokenLinks(report);
  const redirects = buildRedirects(report);
  const crawlMap = buildCrawlMap(report);
  const crawlInsights = buildCrawlInsights(report);
  const allSeoRows = buildSeoRows(report);
  const seoRows = buildSeoRows(report, seoFilter);
  const seoPagination = paginateRows(seoRows, seoPage, 20);
  const seoHighlights = buildSeoHighlights(report, allSeoRows);
  const seoStreamItems = buildSeoStreamItems(allSeoRows);
  const allSecurityRows = buildSecurityRows(report);
  const securityRows = buildSecurityRows(report, securityFilter);
  const securityScore = buildSecurityScore(report);
  const securitySummaryCards = buildSecuritySummaryCards(report);
  const transportChecks = buildTransportChecks(report, allSecurityRows);
  const headerChecks = buildSecurityHeaderItems(allSecurityRows);
  const duplicateRows = buildDuplicateRows(report);
  const agentNodes = buildAgentNodes(report, allSeoRows, allSecurityRows, failingAudits);
  const auditHealth = buildAuditHealth(report);
  const sitemapRobotsItems = buildSitemapRobotsItems(report);
  const wordPressFlags = buildWordPressFlags(report);
  const contentIssueItems = buildContentIssueItems(report);
  const contentSummary = buildContentSummary(report);

  const uxModelText =
    report?.ux?.status === 'success'
      ? `Model: ${report.ux.model}`
      : report?.ux?.status === 'skipped'
        ? 'LLM step skipped'
        : report?.ux?.status === 'error'
          ? 'LLM step returned an error'
          : '';

  const headerActions = (
    <>
      <button className="ghost-button" onClick={onExportJson} type="button">
        <Icon name="download" />
        <span>Export JSON</span>
      </button>
      <button className="ghost-button" onClick={onExportHtml} type="button">
        <Icon name="download" />
        <span>Export HTML</span>
      </button>
      <button className="cta-button" onClick={onStartNewAudit} type="button">
        <Icon name="plus" />
        <span>New Audit</span>
      </button>
    </>
  );

  function renderActiveView() {
    const meta = tabMeta[activeTab] || tabMeta.dashboard;
    const lastRun = report ? `Last run: ${formatRelativeTime(report.generatedAt)}` : 'No report loaded';

    switch (activeTab) {
      case 'documentation':
        return <DocumentationView meta={meta} onStartAudit={onStartNewAudit} report={report} />;
      case 'performance':
        return (
          <PerformanceView
            failingAudits={failingAudits}
            headerActions={headerActions}
            lastRun={lastRun}
            meta={meta}
            performanceCard={performanceCard}
            performanceMethodology={performanceMethodology}
            report={report}
            scoreBreakdown={scoreBreakdown}
            timelineEntries={timelineEntries}
            vitalItems={vitalItems}
            vitalsHealth={vitalsHealth}
          />
        );
      case 'seo':
        return (
          <SeoView
            headerActions={headerActions}
            lastRun={lastRun}
            meta={meta}
            onSeoFilterChange={setSeoFilter}
            onSeoPageChange={setSeoPage}
            report={report}
            seoCard={seoCard}
            seoFilter={seoFilter}
            seoHighlights={seoHighlights}
            seoPagination={seoPagination}
            seoStreamItems={seoStreamItems}
            sitemapRobotsItems={sitemapRobotsItems}
            contentIssueItems={contentIssueItems}
            contentSummary={contentSummary}
            contentData={report?.content}
          />
        );
      case 'security':
        return (
          <SecurityView
            headerActions={headerActions}
            headerChecks={headerChecks}
            issueItems={issueItems}
            lastRun={lastRun}
            meta={meta}
            onSecurityFilterChange={setSecurityFilter}
            report={report}
            securityFilter={securityFilter}
            securityRows={securityRows}
            securityScore={securityScore}
            securitySegments={securitySegments}
            securitySummaryCards={securitySummaryCards}
            timelineEntries={timelineEntries}
            transportChecks={transportChecks}
            wordPressFlags={wordPressFlags}
          />
        );
      case 'crawl':
        return (
          <CrawlView
            brokenLinks={brokenLinks}
            crawlInsights={crawlInsights}
            crawlMap={crawlMap}
            duplicateRows={duplicateRows}
            headerActions={headerActions}
            lastRun={lastRun}
            meta={meta}
            redirects={redirects}
            report={report}
          />
        );
      case 'stream':
        return (
          <AuditStreamView
            agentNodes={agentNodes}
            auditHealth={auditHealth}
            headerActions={headerActions}
            lastRun={lastRun}
            meta={meta}
            report={report}
            timelineEntries={timelineEntries}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardView
            failingAuditMeta={failingAuditMeta}
            failingAudits={failingAudits}
            headerActions={headerActions}
            issueItems={issueItems}
            lastRun={lastRun}
            meta={meta}
            onOpenReport={onExportHtml}
            overviewStats={overviewStats}
            recommendation={recommendation}
            report={report}
            scoreCards={scoreCards}
            securitySegments={securitySegments}
            timelineEntries={timelineEntries}
            uxModelText={uxModelText}
            vitalItems={vitalItems}
            vitalsHealth={vitalsHealth}
          />
        );
    }
  }

  if (!report) {
    return (
      <motion.section
        className="panel empty-workspace"
        animate={{ opacity: 1, y: 0 }}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Workspace</p>
            <h2 className="panel-title">This audit has no finished report yet</h2>
            <p className="panel-subtitle">
              Once the run completes, the performance, SEO, security, crawl, and stream views will
              all populate here.
            </p>
          </div>
        </div>
        <div className="panel-body">
          <EmptyState message="No report has been loaded yet." />
        </div>
      </motion.section>
    );
  }

  return (
    <div className="app-shell app-shell-refined">
      <Sidebar
        activeTab={activeTab}
        brandName={siteBrand.name}
        brandSubtitle={siteBrand.subtitle}
        items={sidebarItems}
        onOpenDocumentation={() => setActiveTab('documentation')}
        onSelect={setActiveTab}
        onStartNewAudit={onStartNewAudit}
      />

      <main className="app-main">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="topbar"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="topbar-row">
            <div className="topbar-brand-group">
              <div>
                <p className="topbar-label">Audit workspace</p>
                <div className="topbar-brand">{siteBrand.name}</div>
              </div>
              <div className="topbar-context">{tabMeta[activeTab]?.title || 'Audit Dashboard'}</div>
            </div>
            <StatusPill tone={auditStatus.tone}>{auditStatus.label}</StatusPill>
          </div>
        </motion.header>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="report-view-shell"
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            key={activeTab}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
