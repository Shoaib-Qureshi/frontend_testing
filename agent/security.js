const axios = require('axios');
const cheerio = require('cheerio');

// Each entry: [recommendation, severity]
const REQUIRED_HEADERS = {
  'content-security-policy': [
    'Add a Content-Security-Policy header to reduce script injection risk.',
    'medium',
  ],
  'strict-transport-security': [
    'Add HSTS to enforce HTTPS on future requests.',
    'medium',
  ],
  'x-content-type-options': [
    'Set X-Content-Type-Options to nosniff to prevent MIME sniffing.',
    'medium',
  ],
  'referrer-policy': [
    'Add a Referrer-Policy header to control sensitive referrer leakage.',
    'medium',
  ],
  'permissions-policy': [
    'Add a Permissions-Policy header to limit powerful browser features.',
    'medium',
  ],
  'x-frame-options': [
    'Add X-Frame-Options (DENY or SAMEORIGIN) to prevent clickjacking attacks.',
    'medium',
  ],
  'x-xss-protection': [
    'Set X-XSS-Protection: 0 to disable the buggy legacy XSS filter (checked by many scanners).',
    'low',
  ],
};

function normalizeHeaders(headers) {
  const normalized = {};

  for (const [key, value] of Object.entries(headers || {})) {
    normalized[String(key).toLowerCase()] = Array.isArray(value)
      ? value.join('\n')
      : String(value);
  }

  return normalized;
}

function createSummary() {
  return {
    totalFindings: 0,
    bySeverity: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };
}

function pushFinding(findings, summary, finding) {
  findings.push(finding);
  summary.totalFindings += 1;
  summary.bySeverity[finding.severity] += 1;
}

function parseSetCookieHeader(headerValue) {
  if (!headerValue) {
    return [];
  }

  const rawValues = Array.isArray(headerValue)
    ? headerValue
    : String(headerValue).split(/\r?\n/);

  return rawValues
    .map((value) => value.trim())
    .filter(Boolean)
    .map((cookieLine) => {
      const parts = cookieLine.split(';').map((part) => part.trim());
      const name = parts[0] ? parts[0].split('=')[0] : 'unknown';
      const attributes = parts.slice(1).map((attribute) => attribute.toLowerCase());

      return {
        name,
        attributes,
      };
    });
}

function getMixedContentResources(html) {
  const $ = cheerio.load(html);
  const resources = new Set();

  $('[src], [href]').each((index, element) => {
    const src = $(element).attr('src');
    const href = $(element).attr('href');
    const candidate = src || href || '';

    if (candidate.trim().toLowerCase().startsWith('http:')) {
      resources.add(candidate.trim());
    }
  });

  return Array.from(resources).slice(0, 10);
}

function detectWordPress(pages) {
  for (const page of pages) {
    if (!page.html) continue;
    if (/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i.test(page.html)) {
      return true;
    }
    if (/wp-content\//i.test(page.html)) {
      return true;
    }
  }
  return false;
}

async function probeEndpoint(url, timeoutMs = 8000) {
  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      validateStatus: () => true,
      maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditBot/1.0)' },
    });
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: null, error: error.message };
  }
}

async function probeWordPressEndpoints(baseUrl, findings, summary) {
  const origin = new URL(baseUrl).origin;

  // Check xmlrpc.php — any non-5xx response means it is active
  const xmlrpc = await probeEndpoint(`${origin}/xmlrpc.php`);
  if (xmlrpc.status !== null && xmlrpc.status < 500) {
    pushFinding(findings, summary, {
      severity: 'high',
      category: 'wordpress',
      pageUrl: `${origin}/xmlrpc.php`,
      message: 'WordPress XML-RPC endpoint is publicly accessible.',
      recommendation:
        'Disable XML-RPC via your server config or a security plugin to prevent brute-force and DDoS amplification attacks.',
    });
  }

  // Check wp-json users — flag if it returns public user slugs
  const wpUsers = await probeEndpoint(`${origin}/wp-json/wp/v2/users`);
  if (wpUsers.status === 200) {
    let leaksUsernames = false;
    try {
      const users = typeof wpUsers.data === 'string'
        ? JSON.parse(wpUsers.data)
        : wpUsers.data;
      if (Array.isArray(users) && users.length > 0 && users[0].slug) {
        leaksUsernames = true;
      }
    } catch (_) {}
    if (leaksUsernames) {
      pushFinding(findings, summary, {
        severity: 'medium',
        category: 'wordpress',
        pageUrl: `${origin}/wp-json/wp/v2/users`,
        message: 'WordPress REST API exposes public user list including usernames.',
        recommendation:
          'Restrict /wp-json/wp/v2/users to authenticated requests only to prevent username enumeration.',
      });
    }
  }

  // Check wp-login.php — flag if accessible with no protection headers
  const wpLogin = await probeEndpoint(`${origin}/wp-login.php`);
  if (wpLogin.status === 200) {
    pushFinding(findings, summary, {
      severity: 'low',
      category: 'wordpress',
      pageUrl: `${origin}/wp-login.php`,
      message: 'WordPress login page is publicly accessible without extra protection.',
      recommendation:
        'Add rate limiting, two-factor authentication, or IP allowlisting to /wp-login.php.',
    });
  }
}

async function analyzeSecurity(crawlResult) {
  const findings = [];
  const summary = createSummary();

  if (new URL(crawlResult.startUrl).protocol !== 'https:') {
    pushFinding(findings, summary, {
      severity: 'high',
      category: 'transport',
      pageUrl: crawlResult.startUrl,
      message: 'The audited site is using HTTP instead of HTTPS.',
      recommendation: 'Serve the site over HTTPS and redirect all HTTP traffic.',
    });
  }

  for (const page of crawlResult.pages) {
    const pageUrl = page.finalUrl || page.url;
    const headers = normalizeHeaders(page.responseHeaders);

    for (const [headerName, [recommendation, severity]] of Object.entries(REQUIRED_HEADERS)) {
      if (!headers[headerName]) {
        pushFinding(findings, summary, {
          severity,
          category: 'headers',
          pageUrl,
          message: `Missing security header: ${headerName}`,
          recommendation,
        });
      }
    }

    if (pageUrl.startsWith('https://')) {
      const cookies = parseSetCookieHeader(headers['set-cookie']);

      for (const cookie of cookies) {
        if (!cookie.attributes.includes('secure')) {
          pushFinding(findings, summary, {
            severity: 'medium',
            category: 'cookies',
            pageUrl,
            message: `Cookie "${cookie.name}" is missing the Secure flag.`,
            recommendation:
              'Mark cookies as Secure so they are not sent over insecure connections.',
          });
        }

        if (!cookie.attributes.includes('httponly')) {
          pushFinding(findings, summary, {
            severity: 'low',
            category: 'cookies',
            pageUrl,
            message: `Cookie "${cookie.name}" is missing the HttpOnly flag.`,
            recommendation:
              'Add the HttpOnly attribute to reduce JavaScript access to session cookies.',
          });
        }
      }

      if (page.html) {
        const mixedContentResources = getMixedContentResources(page.html);

        if (mixedContentResources.length > 0) {
          pushFinding(findings, summary, {
            severity: 'high',
            category: 'mixed-content',
            pageUrl,
            message: `Found ${mixedContentResources.length} mixed-content resource(s).`,
            recommendation:
              'Update all referenced assets to HTTPS URLs or protocol-relative safe equivalents.',
            details: mixedContentResources,
          });
        }
      }
    }
  }

  const isWordPress = detectWordPress(crawlResult.pages);
  if (isWordPress) {
    await probeWordPressEndpoints(crawlResult.startUrl, findings, summary);
  }

  return {
    status: 'success',
    findings,
    summary,
    wordpress: isWordPress,
  };
}

module.exports = {
  analyzeSecurity,
};
