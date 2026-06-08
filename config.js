const path = require('path');

require('dotenv').config({ quiet: true });

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseEnum(value, allowedValues, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function parseBoolean(value, fallback = false) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

const reportsDir = path.join(__dirname, 'reports');
const storageDir = path.join(__dirname, 'storage');
const serverPort = parsePositiveInt(process.env.PORT, 3000);
const appUrl = process.env.APP_URL || `http://127.0.0.1:${serverPort}`;

module.exports = {
  maxPages: parsePositiveInt(process.env.MAX_PAGES, 50),
  serverPort,
  appUrl,
  requestTimeoutMs: parsePositiveInt(process.env.REQUEST_TIMEOUT_MS, 30000),
  navigationTimeoutMs: parsePositiveInt(process.env.NAVIGATION_TIMEOUT_MS, 30000),
  userAgent:
    process.env.USER_AGENT ||
    'AgenticFrontendAudit/1.0 (+https://openrouter.ai; automated frontend audit)',
  reportsDir,
  storageDir,
  databasePath: process.env.DB_PATH || path.join(storageDir, 'app.sqlite'),
  reportJsonPath: path.join(reportsDir, 'report.json'),
  reportHtmlPath: path.join(reportsDir, 'report.html'),
  retentionDays: parsePositiveInt(process.env.RETENTION_DAYS, 90),
  topupExpiryDays: parsePositiveInt(process.env.TOPUP_EXPIRY_DAYS, 365),
  workerPollMs: parsePositiveInt(process.env.WORKER_POLL_MS, 1500),
  cleanupIntervalMs: parsePositiveInt(process.env.CLEANUP_INTERVAL_MS, 24 * 60 * 60 * 1000),
  auditLimits: {
    crawlTiers: [10, 30, 50],
    contentTiers: [0, 5, 10, 20],
    freeTrial: {
      crawl: 10,
      content: 5,
    },
  },
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || 'frontend_atlas_session',
    maxAgeMs: parsePositiveInt(process.env.SESSION_MAX_AGE_MS, 1000 * 60 * 60 * 24 * 14),
    secure:
      parseBoolean(process.env.SESSION_COOKIE_SECURE, false) ||
      appUrl.startsWith('https://'),
  },
  auth: {
    verificationTtlMs: parsePositiveInt(
      process.env.EMAIL_VERIFICATION_TTL_MS,
      1000 * 60 * 60 * 24
    ),
    resetTtlMs: parsePositiveInt(process.env.PASSWORD_RESET_TTL_MS, 1000 * 60 * 30),
    devExposeTokens: parseBoolean(
      process.env.AUTH_DEV_EXPOSE_TOKENS,
      process.env.NODE_ENV !== 'production'
    ),
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI || `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`,
    },
  },
  lighthouse: {
    formFactor: parseEnum(process.env.LIGHTHOUSE_FORM_FACTOR, ['mobile', 'desktop'], 'mobile'),
    throttlingMethod: parseEnum(
      process.env.LIGHTHOUSE_THROTTLING_METHOD,
      ['simulate', 'devtools', 'provided'],
      'simulate'
    ),
  },
  openRouter: {
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
  },
  adminBootstrap: {
    email: process.env.ADMIN_EMAIL || 'shoaib.saq@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    name: process.env.ADMIN_NAME || 'Platform Admin',
  },
};
