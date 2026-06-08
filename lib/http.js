function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(message);
}

function sendRedirect(response, location, statusCode = 302, headers = {}) {
  response.writeHead(statusCode, {
    Location: location,
    ...headers,
  });
  response.end();
}

async function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    request.on('data', (chunk) => {
      total += chunk.length;
      if (total > 5_000_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    request.on('error', reject);
  });
}

async function parseJsonBody(request) {
  const rawBuffer = await readRawBody(request);
  const rawText = rawBuffer.toString('utf8');

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
}

function getRequestIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return request.socket.remoteAddress || '';
}

module.exports = {
  getRequestIp,
  parseJsonBody,
  readRawBody,
  sendJson,
  sendRedirect,
  sendText,
};
