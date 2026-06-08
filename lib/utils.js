const crypto = require('crypto');
const fs = require('fs/promises');

function nowIso() {
  return new Date().toISOString();
}

function addMilliseconds(base, amount) {
  const date = typeof base === 'string' ? new Date(base) : new Date(base);
  return new Date(date.getTime() + amount).toISOString();
}

function addDays(base, days) {
  return addMilliseconds(base, days * 24 * 60 * 60 * 1000);
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function randomToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function hashToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function createPasswordHash(password, salt = randomToken(16)) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) {
    return false;
  }

  const actual = Buffer.from(createPasswordHash(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');

  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function safeJsonParse(raw, fallback = null) {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of String(cookieHeader).split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge != null) {
    segments.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  }

  if (options.expires) {
    segments.push(`Expires=${new Date(options.expires).toUTCString()}`);
  }

  segments.push(`Path=${options.path || '/'}`);
  segments.push(`SameSite=${options.sameSite || 'Lax'}`);

  if (options.httpOnly !== false) {
    segments.push('HttpOnly');
  }

  if (options.secure) {
    segments.push('Secure');
  }

  return segments.join('; ');
}

function clearCookie(name, options = {}) {
  return serializeCookie(name, '', {
    ...options,
    expires: new Date(0).toISOString(),
    maxAge: 0,
  });
}

function redactSecret(value) {
  if (!value) {
    return '';
  }

  if (value.length <= 8) {
    return '********';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  addDays,
  addMilliseconds,
  clampNumber,
  clearCookie,
  createPasswordHash,
  fileExists,
  hashToken,
  normalizeEmail,
  nowIso,
  parseCookies,
  randomToken,
  redactSecret,
  safeJsonParse,
  serializeCookie,
  verifyPassword,
};
