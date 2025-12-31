const https = require('https');

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
          return resolve({ statusCode: res.statusCode, raw: data, parsed });
        } catch (e) {
          return resolve({ statusCode: res.statusCode, raw: data, parsed: null });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.write(body);
    req.end();
  });
}

async function createEmbedding(text, opts = {}) {
  // Support Perplexity or OpenAI keys. Prefer Perplexity when provided.
  const ppKey = process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_KEY || process.env.PERPLEXITY_API_Key;
  const openAiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

  let apiKey = null;
  let host = null;
  let apiPath = null;
  let model = opts.model || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

  if (ppKey) {
    apiKey = ppKey;
    // allow custom URL for Perplexity
    const configuredUrl = process.env.PERPLEXITY_API_URL;
    if (configuredUrl) {
      try {
        const u = new URL(configuredUrl);
        host = u.hostname;
        apiPath = u.pathname + (u.search || '');
      } catch (e) {
        // fall back to default host/path
      }
    }
    host = host || 'api.perplexity.ai';
    apiPath = apiPath || '/v1/embeddings';
    // allow Perplexity-specific model env var
    model = opts.model || process.env.PERPLEXITY_EMBEDDING_MODEL || model;
  } else if (openAiKey) {
    apiKey = openAiKey;
    host = 'api.openai.com';
    apiPath = '/v1/embeddings';
    model = opts.model || process.env.OPENAI_EMBEDDING_MODEL || model;
  } else {
    throw new Error('No embeddings provider configured. Set PERPLEXITY_API_KEY or OPENAI_API_KEY.');
  }

  const payload = { model, input: text };

  // Try provider; if Perplexity fails and an OpenAI key exists, fall back to OpenAI
  try {
    const resp = await httpPostJson(host, apiPath, { Authorization: `Bearer ${apiKey}` }, payload, opts.timeout || 20000);
    if (!resp) throw new Error('Empty response from embeddings API');
    if (resp.statusCode && resp.statusCode >= 400) {
      throw new Error(`Embeddings HTTP ${resp.statusCode}`);
    }
    const parsed = resp.parsed;
    if (!parsed || !Array.isArray(parsed.data) || parsed.data.length === 0) {
      throw new Error('Invalid embeddings response');
    }
    return parsed.data[0].embedding;
  } catch (e) {
    // If we attempted Perplexity and it failed, try OpenAI when available
    if (ppKey && openAiKey) {
      // eslint-disable-next-line no-console
      console.warn('Perplexity embeddings failed, falling back to OpenAI embeddings:', e && e.message ? e.message : e);
      const oaHost = 'api.openai.com';
      const oaPath = '/v1/embeddings';
      const resp2 = await httpPostJson(oaHost, oaPath, { Authorization: `Bearer ${openAiKey}` }, { model: model, input: text }, opts.timeout || 20000);
      if (!resp2) throw new Error('Empty response from OpenAI embeddings API');
      if (resp2.statusCode && resp2.statusCode >= 400) {
        throw new Error(`OpenAI Embeddings HTTP ${resp2.statusCode}`);
      }
      const parsed2 = resp2.parsed;
      if (!parsed2 || !Array.isArray(parsed2.data) || parsed2.data.length === 0) {
        throw new Error('Invalid OpenAI embeddings response');
      }
      return parsed2.data[0].embedding;
    }
    throw e;
  }
}

module.exports = { createEmbedding };
