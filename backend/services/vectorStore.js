const fs = require('fs');
const path = require('path');
const { createEmbedding } = require('./embeddingsClient');

const repoRoot = path.resolve(__dirname, '..', '..');
const storePath = path.join(repoRoot, 'backend', 'data', 'vector_index.json');

function loadStore() {
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return { docs: [] };
}

function saveStore(store) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a) || 1e-12);
}

function cosine(a, b) {
  return dot(a, b) / (norm(a) * norm(b));
}

async function indexDocuments(items, opts = {}) {
  // items: [{ id, source, text }]
  const store = loadStore();
  const existing = new Map(store.docs.map(d => [d.source + '::' + (d.id || ''), d]));
  for (const it of items) {
    const key = it.source + '::' + (it.id || '');
    try {
      if (existing.has(key)) continue; // skip existing
      // eslint-disable-next-line no-console
      console.log('Indexing document:', key);
      const emb = await createEmbedding(it.text.slice(0, 2000));
      if (!emb || !Array.isArray(emb) || emb.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('Embedding empty for', key);
        continue;
      }
      const doc = { id: it.id || null, source: it.source || '', text: it.text, embedding: emb };
      store.docs.push(doc);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to index', key, e && e.message ? e.message : e);
    }
  }
  saveStore(store);
  return store.docs.length;
}

// Upsert a single document: remove existing then index new embedding
async function upsertDocument(item) {
  const store = loadStore();
  const key = item.source + '::' + (item.id || '');
  try {
    // remove existing
    store.docs = store.docs.filter(d => !(d.source + '::' + (d.id || '') === key));
    const emb = await createEmbedding(item.text.slice(0, 2000));
    if (!emb || !Array.isArray(emb) || emb.length === 0) {
      console.warn('Embedding empty for', key);
      saveStore(store);
      return store.docs.length;
    }
    const doc = { id: item.id || null, source: item.source || '', text: item.text, embedding: emb };
    store.docs.push(doc);
    saveStore(store);
    return store.docs.length;
  } catch (e) {
    console.error('upsertDocument failed for', key, e && e.message ? e.message : e);
    saveStore(store);
    throw e;
  }
}

// Remove document by source and id
function removeDocument(source, id) {
  try {
    const store = loadStore();
    const before = store.docs.length;
    store.docs = store.docs.filter(d => !(String(d.source) === String(source) && String(d.id) === String(id)));
    if (store.docs.length !== before) saveStore(store);
    return before - store.docs.length;
  } catch (e) {
    console.error('removeDocument failed', e && e.message ? e.message : e);
    return 0;
  }
}

async function search(query, topK = 5) {
  const store = loadStore();
  if (!store.docs || store.docs.length === 0) return [];
  let qemb;
  try {
    qemb = await createEmbedding(query.slice(0, 2000));
  } catch (e) {
    return [];
  }
  const scored = [];
  for (const d of store.docs) {
    if (!d.embedding) continue;
    const s = cosine(qemb, d.embedding);
    scored.push({ source: d.source, id: d.id, text: d.text, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { indexDocuments, search, loadStore, upsertDocument, removeDocument };
