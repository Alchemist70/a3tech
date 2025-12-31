const https = require('https');

const OPENAI_API_HOST = 'api.openai.com';
const OPENAI_API_PATH = '/v1/chat/completions';
const PERPLEXITY_API_HOST = 'api.perplexity.ai';
// Use the correct endpoint for Perplexity's OpenAI-compatible API
const PERPLEXITY_API_PATH = '/v1/chat/completions';

function httpPostJson(hostname, path, headers, payload, timeout = 20000) {
  const body = JSON.stringify(payload);
  const options = {
    hostname,
    path,
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers || {
      'Content-Type': 'application/json'
    }),
    timeout
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const statusCode = res.statusCode || 0;
        // Try parse JSON; if fails, return raw text for callers to handle
        try {
          const parsed = JSON.parse(data);
          return resolve({ statusCode, raw: data, parsed });
        } catch (e) {
          return resolve({ statusCode, raw: data, parsed: null });
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

async function callPerplexityChat(messages, opts = {}) {
  const apiKey = process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY;
  if (!apiKey) throw new Error('Perplexity API key not configured');
  // Determine Perplexity endpoint from env (allows custom URLs)
  const configuredUrl = process.env.PERPLEXITY_API_URL;
  let host = PERPLEXITY_API_HOST;
  let path = PERPLEXITY_API_PATH;
  if (configuredUrl) {
    try {
      const u = new URL(configuredUrl);
      host = u.hostname;
      path = u.pathname + (u.search || '');
    } catch (e) {
      // ignore and use defaults
    }
  }

  // Perplexity's chat completions API is OpenAI-compatible
  // Valid models: sonar, sonar-pro, sonar-deep-research, sonar-reasoning-pro
  const model = opts.model || process.env.PERPLEXITY_MODEL || 'sonar';
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;

  const payload = {
    model,
    messages,
    temperature,
    max_tokens: 1024,
    stream: false
  };

  try {
    const resp = await httpPostJson(
      host,
      path,
      { Authorization: `Bearer ${apiKey}` },
      payload,
      opts.timeout || 30000
    );

    // Log status for debugging
    if (!resp) throw new Error('Empty response from Perplexity');
    const { statusCode, raw, parsed } = resp;

    if (statusCode && statusCode >= 400) {
      // eslint-disable-next-line no-console
      console.error(`Perplexity HTTP ${statusCode} response:`, (raw || '').slice(0, 500));
      throw new Error(`Perplexity HTTP ${statusCode}`);
    }

    if (parsed && parsed.error) {
      throw new Error(`Perplexity error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
    }

    // Perplexity API returns OpenAI-compatible format
    if (parsed && Array.isArray(parsed.choices) && parsed.choices[0] && parsed.choices[0].message) {
      const content = parsed.choices[0].message.content;
      return typeof content === 'string' ? content.trim() : JSON.stringify(parsed);
    }

    // If raw is non-empty, return it as a best-effort text answer
    if (raw && raw.trim().length > 0) {
      // eslint-disable-next-line no-console
      console.warn('Perplexity returned non-JSON body; returning raw text snippet');
      return raw.trim().slice(0, 2000);
    }

    // Otherwise fail
    // eslint-disable-next-line no-console
    console.error('Perplexity response empty or unparseable:', raw ? raw.slice(0, 200) : '<empty>');
    throw new Error('Invalid response structure from Perplexity');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Perplexity API call failed:', e && e.message ? e.message : e);
    throw e;
  }
}

async function callOpenAIChat(messages, opts = {}) {
  // Prioritize Perplexity if key is present; do NOT fallback to OpenAI automatically
  const ppKey = process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY;
  if (ppKey) {
    // If Perplexity fails, surface error so caller uses RAG-only fallback
    const r = await callPerplexityChat(messages, opts);
    return r;
  }

  // If Perplexity not configured, optionally use OpenAI if available
  const openAiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!openAiKey) {
    throw new Error('No LLM provider configured. Set PERPLEXITY_API_KEY or OPENAI_API_KEY.');
  }

  const model = opts.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;

  const payload = { model, messages, temperature, max_tokens: 800 };

  try {
    const parsed = await httpPostJson(
      OPENAI_API_HOST,
      OPENAI_API_PATH,
      { Authorization: `Bearer ${openAiKey}` },
      payload,
      opts.timeout || 20000
    );

    // Check for API errors in response
    if (parsed && parsed.error) {
      // eslint-disable-next-line no-console
      console.error('OpenAI API error:', parsed.error.message || JSON.stringify(parsed.error));
      throw new Error(`OpenAI error: ${parsed.error.message || 'Unknown error'}`);
    }

    if (parsed && Array.isArray(parsed.choices) && parsed.choices.length > 0 && parsed.choices[0].message) {
      const content = parsed.choices[0].message.content;
      return typeof content === 'string' ? content.trim() : JSON.stringify(parsed);
    }

    // eslint-disable-next-line no-console
    console.error('OpenAI response missing choices or message:', JSON.stringify(parsed).slice(0, 200));
    throw new Error('Invalid response structure from OpenAI');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('OpenAI API call failed:', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = { callOpenAIChat };
