const fs = require('fs/promises');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const config = require('../config');
const {
  addMilliseconds,
  createPasswordHash,
  hashToken,
  normalizeEmail,
  nowIso,
  randomToken,
  safeJsonParse,
} = require('./utils');

const DEFAULT_PRODUCTS = [
  { code: 'trial-small', name: 'Free Trial', category: 'trial', billingKind: 'one_time', crawlCredits: 10, contentCredits: 5, priceInr: 0, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'crawl-topup-10', name: 'Crawler Top-up 10', category: 'topup', billingKind: 'one_time', crawlCredits: 10, contentCredits: 0, priceInr: 299, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'crawl-topup-30', name: 'Crawler Top-up 30', category: 'topup', billingKind: 'one_time', crawlCredits: 30, contentCredits: 0, priceInr: 699, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'crawl-topup-50', name: 'Crawler Top-up 50', category: 'topup', billingKind: 'one_time', crawlCredits: 50, contentCredits: 0, priceInr: 999, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'content-topup-5', name: 'Content Review Top-up 5', category: 'topup', billingKind: 'one_time', crawlCredits: 0, contentCredits: 5, priceInr: 199, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'content-topup-10', name: 'Content Review Top-up 10', category: 'topup', billingKind: 'one_time', crawlCredits: 0, contentCredits: 10, priceInr: 349, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'content-topup-20', name: 'Content Review Top-up 20', category: 'topup', billingKind: 'one_time', crawlCredits: 0, contentCredits: 20, priceInr: 599, currency: 'INR', intervalUnit: null, intervalCount: null, active: 1 },
  { code: 'subscription-starter', name: 'Starter', category: 'subscription', billingKind: 'recurring', crawlCredits: 30, contentCredits: 10, priceInr: 1499, currency: 'INR', intervalUnit: 'monthly', intervalCount: 1, active: 1 },
  { code: 'subscription-growth', name: 'Growth', category: 'subscription', billingKind: 'recurring', crawlCredits: 100, contentCredits: 30, priceInr: 3999, currency: 'INR', intervalUnit: 'monthly', intervalCount: 1, active: 1 },
  { code: 'subscription-agency', name: 'Agency', category: 'subscription', billingKind: 'recurring', crawlCredits: 250, contentCredits: 100, priceInr: 7999, currency: 'INR', intervalUnit: 'monthly', intervalCount: 1, active: 1 },
];

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    trialStatus: row.trial_status,
    trialReservedJobId: row.trial_reserved_job_id,
    trialUsedJobId: row.trial_used_job_id,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    verificationTokenHash: row.verification_token_hash,
    verificationTokenExpiresAt: row.verification_token_expires_at,
    resetTokenHash: row.reset_token_hash,
    resetTokenExpiresAt: row.reset_token_expires_at,
  };
}

function mapProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    billingKind: row.billing_kind,
    crawlCredits: row.crawl_credits,
    contentCredits: row.content_credits,
    priceInr: row.price_inr,
    currency: row.currency,
    intervalUnit: row.interval_unit,
    intervalCount: row.interval_count,
    active: Boolean(row.active),
    paymentReference: row.payment_reference,
    metadata: safeJsonParse(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditJob(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    createdByRole: row.created_by_role,
    targetUrl: row.target_url,
    crawlTier: row.crawl_tier,
    contentTier: row.content_tier,
    status: row.status,
    billingMode: row.billing_mode,
    reservedCrawl: row.reserved_crawl,
    reservedContent: row.reserved_content,
    consumedCrawl: row.consumed_crawl,
    consumedContent: row.consumed_content,
    reservation: safeJsonParse(row.reservation_json, { crawl: [], content: [] }),
    logs: safeJsonParse(row.progress_log_json, []),
    reportJsonPath: row.report_json_path,
    reportHtmlPath: row.report_html_path,
    errorMessage: row.error_message,
    queuedAt: row.queued_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    retentionExpiresAt: row.retention_expires_at,
    archivedAt: row.archived_at,
    reportSummary: safeJsonParse(row.report_summary_json, null),
  };
}

function mapPaymentEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerEventId: row.provider_event_id,
    providerOrderId: row.provider_order_id,
    providerSubscriptionId: row.provider_subscription_id,
    providerPaymentId: row.provider_payment_id,
    eventType: row.event_type,
    status: row.status,
    productId: row.product_id,
    amount: row.amount,
    currency: row.currency,
    payload: safeJsonParse(row.payload_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at,
  };
}

class AppStore {
  constructor(runtimeConfig = config) {
    this.config = runtimeConfig;
    this.db = null;
  }

  async init() {
    await fs.mkdir(path.dirname(this.config.databasePath), { recursive: true });
    await fs.mkdir(this.config.storageDir, { recursive: true });
    this.db = new DatabaseSync(this.config.databasePath);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.createTables();
    this.seedProducts();
    this.ensureAdminBootstrap();
    this.requeueRunningJobs();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        password_salt TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        email_verified_at TEXT,
        verification_token_hash TEXT,
        verification_token_expires_at TEXT,
        reset_token_hash TEXT,
        reset_token_expires_at TEXT,
        trial_status TEXT NOT NULL DEFAULT 'available',
        trial_reserved_job_id TEXT,
        trial_used_job_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS auth_identities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(provider, provider_user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        billing_kind TEXT NOT NULL,
        crawl_credits INTEGER NOT NULL DEFAULT 0,
        content_credits INTEGER NOT NULL DEFAULT 0,
        price_inr INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'INR',
        interval_unit TEXT,
        interval_count INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        payment_reference TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_subscription_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        current_period_start TEXT,
        current_period_end TEXT,
        cancelled_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS credit_buckets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        wallet_type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        product_id TEXT,
        total_amount INTEGER NOT NULL,
        reserved_amount INTEGER NOT NULL DEFAULT 0,
        consumed_amount INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS credit_ledger (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        wallet_type TEXT NOT NULL,
        bucket_id TEXT,
        job_id TEXT,
        product_id TEXT,
        entry_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bucket_id) REFERENCES credit_buckets(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS audit_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_by_role TEXT NOT NULL,
        target_url TEXT NOT NULL,
        crawl_tier INTEGER NOT NULL,
        content_tier INTEGER NOT NULL,
        status TEXT NOT NULL,
        billing_mode TEXT NOT NULL,
        reserved_crawl INTEGER NOT NULL DEFAULT 0,
        reserved_content INTEGER NOT NULL DEFAULT 0,
        consumed_crawl INTEGER NOT NULL DEFAULT 0,
        consumed_content INTEGER NOT NULL DEFAULT 0,
        reservation_json TEXT,
        progress_log_json TEXT,
        report_summary_json TEXT,
        report_json_path TEXT,
        report_html_path TEXT,
        error_message TEXT,
        queued_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        retention_expires_at TEXT,
        archived_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_artifacts (
        id TEXT PRIMARY KEY,
        audit_job_id TEXT NOT NULL,
        artifact_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        byte_size INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (audit_job_id) REFERENCES audit_jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payment_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_event_id TEXT,
        provider_order_id TEXT,
        provider_subscription_id TEXT,
        provider_payment_id TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        product_id TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'INR',
        payload_json TEXT,
        processed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS admin_actions (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_user_id TEXT,
        target_id TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event
      ON payment_events(provider_event_id)
      WHERE provider_event_id IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_payment
      ON payment_events(provider_payment_id)
      WHERE provider_payment_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_credit_buckets_user_wallet
      ON credit_buckets(user_id, wallet_type);

      CREATE INDEX IF NOT EXISTS idx_audit_jobs_user_status
      ON audit_jobs(user_id, status);
    `);
  }

  runInTransaction(callback) {
    this.db.exec('BEGIN IMMEDIATE');

    try {
      const result = callback();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  seedProducts() {
    const statement = this.db.prepare(`
      INSERT OR IGNORE INTO products (
        id, code, name, category, billing_kind, crawl_credits, content_credits, price_inr,
        currency, interval_unit, interval_count, active, payment_reference, metadata_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of DEFAULT_PRODUCTS) {
      const timestamp = nowIso();
      statement.run(
        randomToken(16),
        product.code,
        product.name,
        product.category,
        product.billingKind,
        product.crawlCredits,
        product.contentCredits,
        product.priceInr,
        product.currency,
        product.intervalUnit,
        product.intervalCount,
        product.active,
        null,
        JSON.stringify({ seeded: true }),
        timestamp,
        timestamp
      );
    }
  }

  ensureAdminBootstrap() {
    const existing = this.findUserByEmail(this.config.adminBootstrap.email);
    if (existing) {
      if (existing.role !== 'admin') {
        this.db
          .prepare(
            'UPDATE users SET role = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?'
          )
          .run('admin', nowIso(), nowIso(), existing.id);
      }
      return;
    }

    const { hash, salt } = createPasswordHash(this.config.adminBootstrap.password);
    const timestamp = nowIso();

    this.db
      .prepare(
        `INSERT INTO users (
          id, email, name, password_hash, password_salt, role, email_verified_at,
          trial_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'admin', ?, 'used', ?, ?)`
      )
      .run(
        randomToken(16),
        normalizeEmail(this.config.adminBootstrap.email),
        this.config.adminBootstrap.name,
        hash,
        salt,
        timestamp,
        timestamp,
        timestamp
      );
  }

  requeueRunningJobs() {
    const now = nowIso();
    const rows = this.db
      .prepare('SELECT id, progress_log_json FROM audit_jobs WHERE status = ?')
      .all('running');

    const update = this.db.prepare(
      'UPDATE audit_jobs SET status = ?, started_at = NULL, progress_log_json = ? WHERE id = ?'
    );

    for (const row of rows) {
      const logs = safeJsonParse(row.progress_log_json, []);
      logs.push({
        at: now,
        message: 'Server restarted while this audit was running. The job was returned to the queue.',
      });
      update.run('queued', JSON.stringify(logs), row.id);
    }
  }

  getPublicConfig() {
    return {
      appUrl: this.config.appUrl,
      capabilities: {
        contentReviewEnabled: Boolean(this.config.openRouter.apiKey),
        googleEnabled: Boolean(this.config.auth.google.clientId && this.config.auth.google.clientSecret),
        paymentsEnabled: Boolean(this.config.razorpay.keyId && this.config.razorpay.keySecret),
      },
      tiers: this.config.auditLimits,
      razorpay: {
        keyId: this.config.razorpay.keyId,
        currency: this.config.razorpay.currency,
      },
      retentionDays: this.config.retentionDays,
      adminBootstrap: {
        email: this.config.adminBootstrap.email,
      },
    };
  }

  findUserByEmail(email) {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(normalizeEmail(email));
    return mapUser(row);
  }

  getUserById(userId) {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return mapUser(row);
  }

  findUserByVerificationToken(token) {
    const tokenHash = hashToken(token);
    const row = this.db
      .prepare(
        'SELECT * FROM users WHERE verification_token_hash = ? AND verification_token_expires_at > ?'
      )
      .get(tokenHash, nowIso());
    return mapUser(row);
  }

  findUserByResetToken(token) {
    const tokenHash = hashToken(token);
    const row = this.db
      .prepare('SELECT * FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > ?')
      .get(tokenHash, nowIso());
    return mapUser(row);
  }

  findUserByIdentity(provider, providerUserId) {
    const row = this.db
      .prepare(
        `
        SELECT u.*
        FROM auth_identities ai
        JOIN users u ON u.id = ai.user_id
        WHERE ai.provider = ? AND ai.provider_user_id = ?
      `
      )
      .get(provider, providerUserId);
    return mapUser(row);
  }

  createUser({ email, name, passwordHash, passwordSalt, role = 'user', verified = false }) {
    const id = randomToken(16);
    const timestamp = nowIso();
    this.db
      .prepare(
        `INSERT INTO users (
          id, email, name, password_hash, password_salt, role, email_verified_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        normalizeEmail(email),
        name,
        passwordHash || null,
        passwordSalt || null,
        role,
        verified ? timestamp : null,
        timestamp,
        timestamp
      );

    return this.getUserById(id);
  }

  issueVerificationToken(userId) {
    const token = randomToken(24);
    const tokenHash = hashToken(token);
    const expiresAt = addMilliseconds(nowIso(), this.config.auth.verificationTtlMs);

    this.db
      .prepare(
        'UPDATE users SET verification_token_hash = ?, verification_token_expires_at = ?, updated_at = ? WHERE id = ?'
      )
      .run(tokenHash, expiresAt, nowIso(), userId);

    return token;
  }

  verifyUserEmail(token) {
    const user = this.findUserByVerificationToken(token);
    if (!user) {
      return null;
    }

    const verifiedAt = nowIso();
    this.db
      .prepare(
        `
          UPDATE users
          SET email_verified_at = ?,
              verification_token_hash = NULL,
              verification_token_expires_at = NULL,
              updated_at = ?
          WHERE id = ?
        `
      )
      .run(verifiedAt, verifiedAt, user.id);

    return this.getUserById(user.id);
  }

  issueResetToken(userId) {
    const token = randomToken(24);
    const tokenHash = hashToken(token);
    const expiresAt = addMilliseconds(nowIso(), this.config.auth.resetTtlMs);

    this.db
      .prepare(
        'UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ?, updated_at = ? WHERE id = ?'
      )
      .run(tokenHash, expiresAt, nowIso(), userId);

    return token;
  }

  resetPassword(token, passwordHash, passwordSalt) {
    const user = this.findUserByResetToken(token);
    if (!user) {
      return null;
    }

    const timestamp = nowIso();
    this.db
      .prepare(
        `
        UPDATE users
        SET password_hash = ?,
            password_salt = ?,
            reset_token_hash = NULL,
            reset_token_expires_at = NULL,
            updated_at = ?
        WHERE id = ?
      `
      )
      .run(passwordHash, passwordSalt, timestamp, user.id);

    return this.getUserById(user.id);
  }

  linkAuthIdentity(userId, provider, providerUserId, email = null) {
    this.db
      .prepare(
        `
        INSERT OR IGNORE INTO auth_identities (
          id, user_id, provider, provider_user_id, email, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(randomToken(16), userId, provider, providerUserId, email, nowIso());
  }

  markUserVerified(userId) {
    const timestamp = nowIso();
    this.db
      .prepare(
        'UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?'
      )
      .run(timestamp, timestamp, userId);
    return this.getUserById(userId);
  }

  createOrLinkGoogleUser({ email, name, providerUserId }) {
    return this.runInTransaction(() => {
      const byIdentity = this.findUserByIdentity('google', providerUserId);
      if (byIdentity) {
        return byIdentity;
      }

      const byEmail = this.findUserByEmail(email);
      let user = byEmail;

      if (!user) {
        user = this.createUser({
          email,
          name: name || email.split('@')[0],
          verified: true,
        });
      } else if (!user.emailVerifiedAt) {
        user = this.markUserVerified(user.id);
      }

      this.linkAuthIdentity(user.id, 'google', providerUserId, email);
      return this.getUserById(user.id);
    });
  }

  createSession(userId, { userAgent = '', ipAddress = '' } = {}) {
    const id = randomToken(16);
    const secret = randomToken(24);
    const secretHash = hashToken(secret);
    const now = nowIso();
    const expiresAt = addMilliseconds(now, this.config.session.maxAgeMs);

    this.db
      .prepare(
        `
        INSERT INTO sessions (
          id, user_id, secret_hash, user_agent, ip_address, expires_at, created_at, last_seen_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(id, userId, secretHash, userAgent, ipAddress, expiresAt, now, now);

    return {
      cookieValue: `${id}.${secret}`,
      expiresAt,
    };
  }

  getSessionById(sessionId) {
    return this.db
      .prepare(
        `
        SELECT s.*, u.email, u.name, u.role, u.email_verified_at, u.trial_status, u.trial_reserved_job_id, u.trial_used_job_id
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = ?
      `
      )
      .get(sessionId);
  }

  touchSession(sessionId) {
    this.db
      .prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?')
      .run(nowIso(), sessionId);
  }

  deleteSession(sessionId) {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  deleteExpiredSessions() {
    this.db
      .prepare('DELETE FROM sessions WHERE expires_at <= ?')
      .run(nowIso());
  }

  getCatalog({ includeInactive = false } = {}) {
    const rows = this.db
      .prepare(
        `SELECT * FROM products ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY category, price_inr, name`
      )
      .all();
    return rows.map(mapProduct);
  }

  getProductById(productId) {
    return mapProduct(this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId));
  }

  getProductByCode(code) {
    return mapProduct(this.db.prepare('SELECT * FROM products WHERE code = ?').get(code));
  }

  updateProduct(productId, updates = {}) {
    const current = this.getProductById(productId);
    if (!current) {
      return null;
    }

    const next = {
      priceInr:
        Number.isFinite(Number(updates.priceInr)) && Number(updates.priceInr) >= 0
          ? Number(updates.priceInr)
          : current.priceInr,
      active:
        typeof updates.active === 'boolean'
          ? Number(updates.active)
          : current.active
            ? 1
            : 0,
    };

    this.db
      .prepare(
        'UPDATE products SET price_inr = ?, active = ?, updated_at = ? WHERE id = ?'
      )
      .run(next.priceInr, next.active, nowIso(), productId);

    return this.getProductById(productId);
  }

  setProductPaymentReference(productId, paymentReference) {
    this.db
      .prepare('UPDATE products SET payment_reference = ?, updated_at = ? WHERE id = ?')
      .run(paymentReference, nowIso(), productId);
  }

  createOrUpdateSubscription({
    userId,
    productId,
    providerSubscriptionId,
    status,
    currentPeriodStart = null,
    currentPeriodEnd = null,
  }) {
    const existing = this.db
      .prepare('SELECT * FROM subscriptions WHERE provider_subscription_id = ?')
      .get(providerSubscriptionId);
    const timestamp = nowIso();

    if (existing) {
      this.db
        .prepare(
          `
          UPDATE subscriptions
          SET status = ?,
              current_period_start = COALESCE(?, current_period_start),
              current_period_end = COALESCE(?, current_period_end),
              updated_at = ?
          WHERE provider_subscription_id = ?
        `
        )
        .run(status, currentPeriodStart, currentPeriodEnd, timestamp, providerSubscriptionId);
    } else {
      this.db
        .prepare(
          `
          INSERT INTO subscriptions (
            id, user_id, product_id, provider, provider_subscription_id, status,
            current_period_start, current_period_end, created_at, updated_at
          ) VALUES (?, ?, ?, 'razorpay', ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          randomToken(16),
          userId,
          productId,
          providerSubscriptionId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          timestamp,
          timestamp
        );
    }
  }

  getActiveSubscriptionForUser(userId) {
    return this.db
      .prepare(
        `
        SELECT s.*, p.name AS product_name, p.code AS product_code, p.crawl_credits, p.content_credits,
               p.price_inr, p.currency, p.interval_unit, p.interval_count
        FROM subscriptions s
        JOIN products p ON p.id = s.product_id
        WHERE s.user_id = ? AND s.status IN ('created', 'authenticated', 'active')
        ORDER BY s.updated_at DESC
        LIMIT 1
      `
      )
      .get(userId);
  }

  getSubscriptionByProviderId(providerSubscriptionId) {
    return this.db
      .prepare('SELECT * FROM subscriptions WHERE provider_subscription_id = ?')
      .get(providerSubscriptionId);
  }

  cancelSubscription(providerSubscriptionId) {
    this.db
      .prepare(
        'UPDATE subscriptions SET status = ?, cancelled_at = ?, updated_at = ? WHERE provider_subscription_id = ?'
      )
      .run('cancelled', nowIso(), nowIso(), providerSubscriptionId);
  }

  recordLedgerEntry({
    userId,
    walletType,
    bucketId = null,
    jobId = null,
    productId = null,
    entryType,
    amount,
    description = '',
    metadata = {},
  }) {
    this.db
      .prepare(
        `
        INSERT INTO credit_ledger (
          id, user_id, wallet_type, bucket_id, job_id, product_id, entry_type,
          amount, description, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        randomToken(16),
        userId,
        walletType,
        bucketId,
        jobId,
        productId,
        entryType,
        amount,
        description,
        JSON.stringify(metadata),
        nowIso()
      );
  }

  grantCredits({
    userId,
    walletType,
    amount,
    sourceType,
    sourceId,
    productId = null,
    expiresAt = null,
    description = '',
    metadata = {},
  }) {
    if (!amount || amount <= 0) {
      return null;
    }

    const bucketId = randomToken(16);
    this.db
      .prepare(
        `
        INSERT INTO credit_buckets (
          id, user_id, wallet_type, source_type, source_id, product_id, total_amount,
          reserved_amount, consumed_amount, expires_at, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
      `
      )
      .run(
        bucketId,
        userId,
        walletType,
        sourceType,
        sourceId,
        productId,
        amount,
        expiresAt,
        JSON.stringify(metadata),
        nowIso()
      );

    this.recordLedgerEntry({
      userId,
      walletType,
      bucketId,
      productId,
      entryType: 'grant',
      amount,
      description,
      metadata,
    });

    return bucketId;
  }

  grantProductCredits({ userId, product, sourceType, sourceId, expiresAt, metadata = {} }) {
    return this.runInTransaction(() => {
      const granted = [];

      if (product.crawlCredits > 0) {
        granted.push(
          this.grantCredits({
            userId,
            walletType: 'crawl',
            amount: product.crawlCredits,
            sourceType,
            sourceId,
            productId: product.id,
            expiresAt,
            description: `${product.name} crawl credits`,
            metadata,
          })
        );
      }

      if (product.contentCredits > 0) {
        granted.push(
          this.grantCredits({
            userId,
            walletType: 'content',
            amount: product.contentCredits,
            sourceType,
            sourceId,
            productId: product.id,
            expiresAt,
            description: `${product.name} content credits`,
            metadata,
          })
        );
      }

      return granted.filter(Boolean);
    });
  }

  getEligibleBuckets(userId, walletType) {
    return this.db
      .prepare(
        `
        SELECT *
        FROM credit_buckets
        WHERE user_id = ?
          AND wallet_type = ?
          AND total_amount - consumed_amount - reserved_amount > 0
          AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY
          CASE source_type
            WHEN 'subscription' THEN 0
            WHEN 'topup' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END,
          COALESCE(expires_at, '9999-12-31T00:00:00.000Z'),
          created_at ASC
      `
      )
      .all(userId, walletType, nowIso());
  }

  getCreditSummary(userId) {
    const buckets = this.db
      .prepare(
        `
        SELECT *
        FROM credit_buckets
        WHERE user_id = ?
        ORDER BY wallet_type, COALESCE(expires_at, '9999-12-31T00:00:00.000Z'), created_at
      `
      )
      .all(userId);

    const now = nowIso();
    const summary = {
      crawl: { available: 0, reserved: 0, total: 0, expired: 0 },
      content: { available: 0, reserved: 0, total: 0, expired: 0 },
      upcomingExpiries: [],
      buckets: [],
    };

    for (const bucket of buckets) {
      const wallet = bucket.wallet_type;
      const remaining = bucket.total_amount - bucket.consumed_amount - bucket.reserved_amount;
      const expired = bucket.expires_at && bucket.expires_at <= now;

      summary[wallet].total += bucket.total_amount;
      if (expired) {
        summary[wallet].expired += Math.max(remaining, 0);
      } else {
        summary[wallet].available += Math.max(remaining, 0);
        summary[wallet].reserved += bucket.reserved_amount;

        if (bucket.expires_at && remaining > 0) {
          summary.upcomingExpiries.push({
            walletType: wallet,
            sourceType: bucket.source_type,
            amount: remaining,
            expiresAt: bucket.expires_at,
          });
        }
      }

      summary.buckets.push({
        id: bucket.id,
        walletType: wallet,
        sourceType: bucket.source_type,
        sourceId: bucket.source_id,
        totalAmount: bucket.total_amount,
        consumedAmount: bucket.consumed_amount,
        reservedAmount: bucket.reserved_amount,
        availableAmount: expired ? 0 : Math.max(remaining, 0),
        expiresAt: bucket.expires_at,
        metadata: safeJsonParse(bucket.metadata_json, {}),
      });
    }

    summary.upcomingExpiries.sort((a, b) => String(a.expiresAt).localeCompare(String(b.expiresAt)));
    return summary;
  }

  reserveCreditsForJob(jobId, userId, { crawl = 0, content = 0 }) {
    return this.runInTransaction(() => {
      const reservation = { crawl: [], content: [] };

      for (const [walletType, amount] of [['crawl', crawl], ['content', content]]) {
        let remaining = amount;
        if (!remaining) {
          continue;
        }

        const buckets = this.getEligibleBuckets(userId, walletType);
        for (const bucket of buckets) {
          if (remaining <= 0) {
            break;
          }

          const available = bucket.total_amount - bucket.consumed_amount - bucket.reserved_amount;
          if (available <= 0) {
            continue;
          }

          const allocated = Math.min(available, remaining);
          this.db
            .prepare('UPDATE credit_buckets SET reserved_amount = reserved_amount + ? WHERE id = ?')
            .run(allocated, bucket.id);

          reservation[walletType].push({
            bucketId: bucket.id,
            amount: allocated,
            sourceType: bucket.source_type,
            expiresAt: bucket.expires_at,
          });

          this.recordLedgerEntry({
            userId,
            walletType,
            bucketId: bucket.id,
            jobId,
            productId: bucket.product_id,
            entryType: 'reserve',
            amount: allocated,
            description: `Reserved ${walletType} credits for audit ${jobId}`,
          });

          remaining -= allocated;
        }

        if (remaining > 0) {
          throw new Error(`Insufficient ${walletType} credits.`);
        }
      }

      this.db
        .prepare(
          'UPDATE audit_jobs SET reserved_crawl = ?, reserved_content = ?, reservation_json = ? WHERE id = ?'
        )
        .run(crawl, content, JSON.stringify(reservation), jobId);

      return reservation;
    });
  }

  releaseCreditsForJob(jobId, reason = 'Audit did not complete') {
    return this.runInTransaction(() => {
      const job = this.getAuditJobById(jobId);
      if (!job) {
        return null;
      }

      const reservation = job.reservation || { crawl: [], content: [] };
      for (const walletType of ['crawl', 'content']) {
        for (const allocation of reservation[walletType]) {
          this.db
            .prepare(
              'UPDATE credit_buckets SET reserved_amount = MAX(reserved_amount - ?, 0) WHERE id = ?'
            )
            .run(allocation.amount, allocation.bucketId);

          this.recordLedgerEntry({
            userId: job.userId,
            walletType,
            bucketId: allocation.bucketId,
            jobId,
            entryType: 'release',
            amount: allocation.amount,
            description: reason,
          });
        }
      }

      this.db
        .prepare(
          'UPDATE audit_jobs SET reserved_crawl = 0, reserved_content = 0, reservation_json = ? WHERE id = ?'
        )
        .run(JSON.stringify({ crawl: [], content: [] }), jobId);

      return this.getAuditJobById(jobId);
    });
  }

  settleCreditsForJob(jobId, { crawlUsed = 0, contentUsed = 0 }) {
    return this.runInTransaction(() => {
      const job = this.getAuditJobById(jobId);
      if (!job) {
        return null;
      }

      const reservation = job.reservation || { crawl: [], content: [] };
      const usage = { crawl: crawlUsed, content: contentUsed };

      for (const walletType of ['crawl', 'content']) {
        let remainingUsage = usage[walletType];

        for (const allocation of reservation[walletType]) {
          const consume = Math.min(allocation.amount, remainingUsage);
          const release = allocation.amount - consume;

          this.db
            .prepare(
              `
              UPDATE credit_buckets
              SET reserved_amount = MAX(reserved_amount - ?, 0),
                  consumed_amount = consumed_amount + ?
              WHERE id = ?
            `
            )
            .run(allocation.amount, consume, allocation.bucketId);

          if (consume > 0) {
            this.recordLedgerEntry({
              userId: job.userId,
              walletType,
              bucketId: allocation.bucketId,
              jobId,
              entryType: 'consume',
              amount: consume,
              description: `Consumed ${walletType} credits for completed audit`,
            });
          }

          if (release > 0) {
            this.recordLedgerEntry({
              userId: job.userId,
              walletType,
              bucketId: allocation.bucketId,
              jobId,
              entryType: 'release',
              amount: release,
              description: 'Released unused reserved credits after audit settlement',
            });
          }

          remainingUsage -= consume;
        }
      }

      this.db
        .prepare(
          `
          UPDATE audit_jobs
          SET reserved_crawl = 0,
              reserved_content = 0,
              consumed_crawl = ?,
              consumed_content = ?,
              reservation_json = ?
          WHERE id = ?
        `
        )
        .run(crawlUsed, contentUsed, JSON.stringify({ crawl: [], content: [] }), jobId);

      return this.getAuditJobById(jobId);
    });
  }

  markTrialReserved(userId, jobId) {
    this.db
      .prepare(
        'UPDATE users SET trial_status = ?, trial_reserved_job_id = ?, updated_at = ? WHERE id = ?'
      )
      .run('reserved', jobId, nowIso(), userId);
  }

  markTrialAvailable(userId) {
    this.db
      .prepare(
        'UPDATE users SET trial_status = ?, trial_reserved_job_id = NULL, updated_at = ? WHERE id = ?'
      )
      .run('available', nowIso(), userId);
  }

  markTrialUsed(userId, jobId) {
    this.db
      .prepare(
        `
        UPDATE users
        SET trial_status = 'used',
            trial_reserved_job_id = NULL,
            trial_used_job_id = ?,
            updated_at = ?
        WHERE id = ?
      `
      )
      .run(jobId, nowIso(), userId);
  }

  createAuditJob({
    userId,
    createdByRole,
    targetUrl,
    crawlTier,
    contentTier,
    billingMode,
    retentionExpiresAt,
  }) {
    const id = randomToken(16);
    const timestamp = nowIso();
    this.db
      .prepare(
        `
        INSERT INTO audit_jobs (
          id, user_id, created_by_role, target_url, crawl_tier, content_tier, status, billing_mode,
          progress_log_json, queued_at, retention_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)
      `
      )
      .run(
        id,
        userId,
        createdByRole,
        targetUrl,
        crawlTier,
        contentTier,
        billingMode,
        JSON.stringify([{ at: timestamp, message: 'Audit queued and waiting for the worker.' }]),
        timestamp,
        retentionExpiresAt
      );

    return this.getAuditJobById(id);
  }

  appendAuditLog(jobId, message) {
    const row = this.db
      .prepare('SELECT progress_log_json FROM audit_jobs WHERE id = ?')
      .get(jobId);

    if (!row) {
      return;
    }

    const logs = safeJsonParse(row.progress_log_json, []);
    logs.push({ at: nowIso(), message });

    this.db
      .prepare('UPDATE audit_jobs SET progress_log_json = ? WHERE id = ?')
      .run(JSON.stringify(logs), jobId);
  }

  claimNextQueuedAuditJob() {
    return this.runInTransaction(() => {
      const row = this.db
        .prepare("SELECT * FROM audit_jobs WHERE status = 'queued' ORDER BY queued_at ASC LIMIT 1")
        .get();

      if (!row) {
        return null;
      }

      const timestamp = nowIso();
      const logs = safeJsonParse(row.progress_log_json, []);
      logs.push({ at: timestamp, message: 'Worker picked up the queued audit.' });

      this.db
        .prepare(
          `
          UPDATE audit_jobs
          SET status = 'running',
              started_at = ?,
              error_message = NULL,
              progress_log_json = ?
          WHERE id = ?
        `
        )
        .run(timestamp, JSON.stringify(logs), row.id);

      return this.getAuditJobById(row.id);
    });
  }

  completeAuditJob(jobId, { reportSummary, reportJsonPath, reportHtmlPath }) {
    this.db
      .prepare(
        `
        UPDATE audit_jobs
        SET status = 'completed',
            report_summary_json = ?,
            report_json_path = ?,
            report_html_path = ?,
            finished_at = ?,
            error_message = NULL
        WHERE id = ?
      `
      )
      .run(JSON.stringify(reportSummary || {}), reportJsonPath, reportHtmlPath, nowIso(), jobId);
  }

  failAuditJob(jobId, errorMessage) {
    this.db
      .prepare(
        'UPDATE audit_jobs SET status = ?, error_message = ?, finished_at = ? WHERE id = ?'
      )
      .run('failed', errorMessage, nowIso(), jobId);
  }

  recordAuditArtifact(jobId, artifactType, filePath, byteSize) {
    this.db
      .prepare(
        `
        INSERT INTO audit_artifacts (
          id, audit_job_id, artifact_type, file_path, byte_size, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(randomToken(16), jobId, artifactType, filePath, byteSize, nowIso());
  }

  getAuditJobById(jobId) {
    return mapAuditJob(this.db.prepare('SELECT * FROM audit_jobs WHERE id = ?').get(jobId));
  }

  getAuditJobForUser(jobId, userId, role = 'user') {
    if (role === 'admin') {
      return this.getAuditJobById(jobId);
    }

    return mapAuditJob(
      this.db.prepare('SELECT * FROM audit_jobs WHERE id = ? AND user_id = ?').get(jobId, userId)
    );
  }

  listAuditJobsForUser(userId) {
    const rows = this.db
      .prepare('SELECT * FROM audit_jobs WHERE user_id = ? ORDER BY queued_at DESC')
      .all(userId);
    return rows.map(mapAuditJob);
  }

  listAllAuditJobs() {
    const rows = this.db
      .prepare(
        `
        SELECT a.*, u.email, u.name, u.role
        FROM audit_jobs a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.queued_at DESC
      `
      )
      .all();

    return rows.map((row) => ({
      ...mapAuditJob(row),
      user: {
        email: row.email,
        name: row.name,
        role: row.role,
      },
    }));
  }

  getLatestCompletedAuditForUser(userId) {
    return mapAuditJob(
      this.db
        .prepare(
          "SELECT * FROM audit_jobs WHERE user_id = ? AND status = 'completed' ORDER BY finished_at DESC LIMIT 1"
        )
        .get(userId)
    );
  }

  createPaymentIntent({
    userId,
    provider,
    providerOrderId = null,
    providerSubscriptionId = null,
    eventType,
    status,
    productId,
    amount,
    currency,
    payload = {},
  }) {
    const timestamp = nowIso();
    this.db
      .prepare(
        `
        INSERT INTO payment_events (
          id, user_id, provider, provider_order_id, provider_subscription_id, event_type,
          status, product_id, amount, currency, payload_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        randomToken(16),
        userId,
        provider,
        providerOrderId,
        providerSubscriptionId,
        eventType,
        status,
        productId,
        amount,
        currency,
        JSON.stringify(payload),
        timestamp,
        timestamp
      );
  }

  findPaymentIntentByOrderId(providerOrderId) {
    return mapPaymentEvent(
      this.db
        .prepare(
          'SELECT * FROM payment_events WHERE provider_order_id = ? ORDER BY created_at DESC LIMIT 1'
        )
        .get(providerOrderId)
    );
  }

  findPaymentIntentBySubscriptionId(providerSubscriptionId) {
    return mapPaymentEvent(
      this.db
        .prepare(
          'SELECT * FROM payment_events WHERE provider_subscription_id = ? ORDER BY created_at DESC LIMIT 1'
        )
        .get(providerSubscriptionId)
    );
  }

  findPaymentByProviderPaymentId(providerPaymentId) {
    return mapPaymentEvent(
      this.db
        .prepare('SELECT * FROM payment_events WHERE provider_payment_id = ?')
        .get(providerPaymentId)
    );
  }

  markPaymentProcessed({
    baseEvent,
    providerEventId = null,
    providerPaymentId = null,
    eventType,
    status,
    payload = {},
  }) {
    const timestamp = nowIso();
    this.db
      .prepare(
        `
        UPDATE payment_events
        SET provider_event_id = COALESCE(?, provider_event_id),
            provider_payment_id = COALESCE(?, provider_payment_id),
            event_type = ?,
            status = ?,
            payload_json = ?,
            processed_at = ?,
            updated_at = ?
        WHERE id = ?
      `
      )
      .run(
        providerEventId,
        providerPaymentId,
        eventType,
        status,
        JSON.stringify(payload),
        timestamp,
        timestamp,
        baseEvent.id
      );

    return mapPaymentEvent(this.db.prepare('SELECT * FROM payment_events WHERE id = ?').get(baseEvent.id));
  }

  listInvoices(userId) {
    const rows = this.db
      .prepare(
        `
        SELECT pe.*, p.name AS product_name, p.code AS product_code
        FROM payment_events pe
        JOIN products p ON p.id = pe.product_id
        WHERE pe.user_id = ? AND pe.status IN ('paid', 'captured', 'active')
        ORDER BY pe.created_at DESC
      `
      )
      .all(userId);

    return rows.map((row) => ({
      ...mapPaymentEvent(row),
      productName: row.product_name,
      productCode: row.product_code,
    }));
  }

  listUsers() {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();

    return rows.map((row) => {
      const user = mapUser(row);
      return {
        ...user,
        credits: this.getCreditSummary(user.id),
        subscription: this.getActiveSubscriptionForUser(user.id),
      };
    });
  }

  updateUserRole(userId, role) {
    this.db
      .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .run(role, nowIso(), userId);
    return this.getUserById(userId);
  }

  recordAdminAction({
    adminUserId,
    actionType,
    targetUserId = null,
    targetId = null,
    metadata = {},
  }) {
    this.db
      .prepare(
        `
        INSERT INTO admin_actions (
          id, admin_user_id, action_type, target_user_id, target_id, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        randomToken(16),
        adminUserId,
        actionType,
        targetUserId,
        targetId,
        JSON.stringify(metadata),
        nowIso()
      );
  }

  async cleanupExpiredArtifacts() {
    const rows = this.db
      .prepare(
        `
        SELECT a.id, a.report_json_path, a.report_html_path
        FROM audit_jobs a
        JOIN users u ON u.id = a.user_id
        WHERE u.role != 'admin'
          AND a.archived_at IS NULL
          AND a.retention_expires_at IS NOT NULL
          AND a.retention_expires_at <= ?
      `
      )
      .all(nowIso());

    for (const row of rows) {
      for (const targetPath of [row.report_json_path, row.report_html_path]) {
        if (!targetPath) {
          continue;
        }

        try {
          await fs.rm(targetPath, { force: true });
        } catch (error) {
          // Ignore cleanup failures.
        }
      }

      this.db
        .prepare(
          'UPDATE audit_jobs SET archived_at = ?, report_json_path = NULL, report_html_path = NULL WHERE id = ?'
        )
        .run(nowIso(), row.id);
    }
  }
}

module.exports = {
  AppStore,
  mapAuditJob,
  mapPaymentEvent,
  mapProduct,
  mapUser,
};
