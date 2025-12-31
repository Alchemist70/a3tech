const https = require('https');

const OPENAI_EMBEDDING_HOST = 'api.openai.com';
const OPENAI_EMBEDDING_PATH = '/v1/embeddings';

function httpPostJson(hostname, path, headers, payload, timeout = 20000) {
  const body = JSON.stringify(payload);
  const options = {
    hostname,
    path,
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers || {}),
    timeout
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          return resolve(parsed);
        } catch (e) {
          return reject(e);
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    req.write(body);
    req.end();
  });
}

async function getEmbedding(text, opts = {}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!apiKey) throw new Error('OpenAI API key required for embeddings (set OPENAI_API_KEY)');

  const model = opts.model || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const payload = { input: text, model };
  const parsed = await httpPostJson(OPENAI_EMBEDDING_HOST, OPENAI_EMBEDDING_PATH, { Authorization: `Bearer ${apiKey}` }, payload, opts.timeout || 20000);
  if (parsed && parsed.data && Array.isArray(parsed.data) && parsed.data[0] && Array.isArray(parsed.data[0].embedding)) {
    return parsed.data[0].embedding;
  }
  throw new Error('Invalid embedding response');
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0; let na = 0; let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

module.exports = { getEmbedding, cosineSim };
