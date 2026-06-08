const fs = require('fs/promises');
const path = require('path');

const { runAudit } = require('../agent/audit');
const { nowIso } = require('./utils');

class AuditQueue {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    this.processing = false;
    this.pollTimer = null;
    this.cleanupTimer = null;
  }

  start() {
    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        this.tick().catch((error) => {
          console.error(`Queue tick failed: ${error.message}`);
        });
      }, this.config.workerPollMs);
    }

    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.store.cleanupExpiredArtifacts().catch((error) => {
          console.error(`Artifact cleanup failed: ${error.message}`);
        });
      }, this.config.cleanupIntervalMs);
    }

    this.tick().catch((error) => {
      console.error(`Initial queue tick failed: ${error.message}`);
    });
  }

  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async tick() {
    if (this.processing) {
      return;
    }

    const job = this.store.claimNextQueuedAuditJob();
    if (!job) {
      return;
    }

    this.processing = true;

    try {
      await this.processJob(job);
    } finally {
      this.processing = false;
    }
  }

  async processJob(job) {
    const userDir = path.join(this.config.storageDir, 'audits', job.userId, job.id);
    await fs.mkdir(userDir, { recursive: true });

    const jobConfig = {
      ...this.config,
      maxPages: job.crawlTier,
      contentReviewLimit: job.contentTier,
      reportsDir: userDir,
      reportJsonPath: path.join(userDir, 'report.json'),
      reportHtmlPath: path.join(userDir, 'report.html'),
    };

    this.store.appendAuditLog(job.id, `Audit started at ${nowIso()}`);

    try {
      const result = await runAudit(job.targetUrl, jobConfig, {
        onProgress: (message) => {
          this.store.appendAuditLog(job.id, message);
        },
      });

      const crawlUsed = Number(result.report?.summary?.pagesCrawled || 0);
      const contentUsed =
        result.report?.content?.status === 'success'
          ? Number(result.report?.content?.summary?.pagesAnalyzed || 0)
          : 0;

      if (job.billingMode === 'credits') {
        this.store.settleCreditsForJob(job.id, {
          crawlUsed,
          contentUsed,
        });
      } else if (job.billingMode === 'trial') {
        this.store.markTrialUsed(job.userId, job.id);
      }

      this.store.completeAuditJob(job.id, {
        reportSummary: {
          generatedAt: result.report?.generatedAt,
          summary: result.report?.summary,
          status: 'completed',
        },
        reportJsonPath: result.outputs.jsonPath,
        reportHtmlPath: result.outputs.htmlPath,
      });

      for (const [artifactType, targetPath] of [
        ['json', result.outputs.jsonPath],
        ['html', result.outputs.htmlPath],
      ]) {
        try {
          const stat = await fs.stat(targetPath);
          this.store.recordAuditArtifact(job.id, artifactType, targetPath, stat.size);
        } catch (error) {
          this.store.appendAuditLog(job.id, `Could not stat ${artifactType} artifact: ${error.message}`);
        }
      }

      this.store.appendAuditLog(job.id, 'Audit completed successfully.');
    } catch (error) {
      if (job.billingMode === 'credits') {
        this.store.releaseCreditsForJob(job.id, 'Audit failed before completion');
      } else if (job.billingMode === 'trial') {
        this.store.markTrialAvailable(job.userId);
      }

      this.store.failAuditJob(job.id, error.message || 'Audit failed.');
      this.store.appendAuditLog(job.id, `Audit failed: ${error.message}`);
    }
  }
}

module.exports = {
  AuditQueue,
};
