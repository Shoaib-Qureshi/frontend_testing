const fs = require('fs/promises');
const http = require('http');
const path = require('path');

const config = require('../config');
const { normalizeTargetUrl } = require('../agent/audit');
const { AuditQueue } = require('./audit-queue');
const { parseJsonBody, sendJson, sendText } = require('./http');
const { AppStore } = require('./store');
const { fileExists } = require('./utils');

const publicDir = path.join(__dirname, '..', 'public');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function validateAuditRequest(body) {
  const crawlTier = Number(body.crawlTier);
  const contentTier = Number(body.contentTier);
  const validCrawl = config.auditLimits.crawlTiers.includes(crawlTier);
  const validContent = config.auditLimits.contentTiers.includes(contentTier);

  if (!body.targetUrl || typeof body.targetUrl !== 'string') {
    throw new Error('A target URL is required.');
  }

  if (!validCrawl) {
    throw new Error(`Crawl tier must be one of ${config.auditLimits.crawlTiers.join(', ')}.`);
  }

  if (!validContent) {
    throw new Error(`Content tier must be one of ${config.auditLimits.contentTiers.join(', ')}.`);
  }

  if (contentTier > crawlTier) {
    throw new Error('Content review cannot exceed the selected crawl tier.');
  }

  return {
    targetUrl: normalizeTargetUrl(body.targetUrl),
    crawlTier,
    contentTier,
  };
}

async function serveStaticFile(requestPath, response) {
  const relativePath = requestPath.replace(/^\/+/, '') || 'index.html';
  const normalizedPath = path.join(publicDir, relativePath);
  const resolvedPath = path.resolve(normalizedPath);

  if (!resolvedPath.startsWith(publicDir)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    });
    response.end(file);
  } catch (error) {
    const fallback = path.join(publicDir, 'index.html');
    const file = await fs.readFile(fallback);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
    response.end(file);
  }
}

async function readJobReport(job) {
  if (!job?.reportJsonPath || !(await fileExists(job.reportJsonPath))) {
    return null;
  }

  const raw = await fs.readFile(job.reportJsonPath, 'utf8');
  return JSON.parse(raw);
}

async function createServerApp() {
  const store = new AppStore(config);
  await store.init();

  // Use the bootstrap admin account as the single system identity for all jobs.
  // ensureAdminBootstrap() (called inside store.init()) guarantees this user exists.
  const systemUser = store.findUserByEmail(config.adminBootstrap.email);

  const queue = new AuditQueue(store, config);
  queue.start();

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    try {
      if (request.method === 'GET' && requestUrl.pathname === '/api/me') {
        sendJson(response, 200, {
          publicConfig: store.getPublicConfig(),
        });
        return;
      }

      if (request.method === 'POST' && requestUrl.pathname === '/api/audits') {
        let input;
        try {
          input = validateAuditRequest(await parseJsonBody(request));
        } catch (error) {
          sendJson(response, 400, {
            status: 'error',
            message: error.message,
          });
          return;
        }

        if (input.contentTier > 0 && !config.openRouter.apiKey) {
          sendJson(response, 400, {
            status: 'error',
            message: 'Content review is unavailable until OPENROUTER_API_KEY is configured.',
          });
          return;
        }

        const job = store.createAuditJob({
          userId: systemUser.id,
          createdByRole: 'admin',
          targetUrl: input.targetUrl,
          crawlTier: input.crawlTier,
          contentTier: input.contentTier,
          billingMode: 'admin',
          retentionExpiresAt: null,
        });

        sendJson(response, 201, {
          status: 'success',
          audit: store.getAuditJobById(job.id),
        });
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/audits') {
        sendJson(response, 200, {
          status: 'success',
          audits: store.listAuditJobsForUser(systemUser.id),
        });
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname.startsWith('/api/audits/')) {
        const segments = requestUrl.pathname.split('/').filter(Boolean);
        const auditId = segments[2];
        const tail = segments[3] || '';
        const job = store.getAuditJobForUser(auditId, systemUser.id, 'admin');

        if (!job) {
          sendJson(response, 404, {
            status: 'error',
            message: 'Audit not found.',
          });
          return;
        }

        if (!tail) {
          sendJson(response, 200, {
            status: 'success',
            audit: job,
            report: job.status === 'completed' ? await readJobReport(job) : null,
          });
          return;
        }

        if (tail === 'log') {
          sendJson(response, 200, {
            status: 'success',
            log: job.logs,
          });
          return;
        }

        if (tail === 'report' && segments[4] === 'json') {
          if (!job.reportJsonPath || !(await fileExists(job.reportJsonPath))) {
            sendJson(response, 404, {
              status: 'empty',
              message: 'No JSON report is available for this audit.',
            });
            return;
          }

          const file = await fs.readFile(job.reportJsonPath);
          response.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-${auditId}.json"`,
          });
          response.end(file);
          return;
        }

        if (tail === 'report' && segments[4] === 'html') {
          if (!job.reportHtmlPath || !(await fileExists(job.reportHtmlPath))) {
            sendJson(response, 404, {
              status: 'empty',
              message: 'No HTML report is available for this audit.',
            });
            return;
          }

          const file = await fs.readFile(job.reportHtmlPath);
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-${auditId}.html"`,
          });
          response.end(file);
          return;
        }
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/latest-report') {
        const latest = store.getLatestCompletedAuditForUser(systemUser.id);
        if (!latest) {
          sendJson(response, 404, {
            status: 'empty',
            message: 'No saved report was found yet.',
          });
          return;
        }

        sendJson(response, 200, {
          status: 'success',
          audit: latest,
          report: await readJobReport(latest),
        });
        return;
      }

      if (requestUrl.pathname.startsWith('/api/')) {
        sendJson(response, 404, {
          status: 'error',
          message: 'API route not found.',
        });
        return;
      }

      if (request.method === 'GET') {
        await serveStaticFile(requestUrl.pathname, response);
        return;
      }

      sendText(response, 405, 'Method not allowed');
    } catch (error) {
      console.error(`Server error: ${error.message}`);
      sendJson(response, 500, {
        status: 'error',
        message: error.message || 'Unexpected server error.',
      });
    }
  });

  return {
    server,
    store,
    queue,
  };
}

module.exports = {
  createServerApp,
};
