const fs = require('fs');
const path = require('path');
const ProjectModel = require('../models/Project');
const BlogPostModel = require('../models/BlogPost');
const TopicModel = require('../models/Topic');
const TopicDetailModel = require('../models/TopicDetail');
const ResearchAreaModel = require('../models/ResearchArea');
const FAQModel = require('../models/FAQ');
const TestimonialModel = require('../models/Testimonial');
const SubjectModel = require('../models/Subject');
let vectorStore;
try {
  vectorStore = require('./vectorStore');
} catch (e) {
  vectorStore = null;
}

// Load prebuilt RAG index if available
let ragIndex = [];
let lastRebuiltAt = null;
let lastUpdatedAt = null;
try {
  const indexPath = path.join(__dirname, '..', 'data', 'rag-index.json');
  if (fs.existsSync(indexPath)) {
    const indexData = fs.readFileSync(indexPath, 'utf8');
    ragIndex = JSON.parse(indexData) || [];
    // eslint-disable-next-line no-console
    console.log(`[RAG] Loaded prebuilt index with ${ragIndex.length} documents`);
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[RAG] Failed to load prebuilt index:', e && e.message ? e.message : e);
}

// Helper: normalize text for matching
const norm = (s) => String(s || '').toLowerCase();

// Count overlapping keyword matches between query words and text
const scoreText = (queryWords, text) => {
  if (!text) return 0;
  const t = norm(text);
  let score = 0;
  for (const w of queryWords) {
    if (!w) continue;
    // boost multi-word matches
    if (t.includes(w)) score += 2;
    // word boundary match
    const regex = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\b');
    if (regex.test(t)) score += 3;
  }
  return score;
};

// FS fallback: scan a few repository directories for relevant text snippets
const repoRoot = path.resolve(__dirname, '..', '..');
const scanDirs = [
  path.join(repoRoot, 'README.md'),
  // Include the projects discovery guide so RAG can answer "how to search projects"
  path.join(repoRoot, 'backend', 'data', 'PROJECTS_DISCOVERY_GUIDE.md'),
  path.join(repoRoot, 'backend'),
  path.join(repoRoot, 'frontend'),
  path.join(repoRoot, 'api'),
  path.join(repoRoot, 'Recovered')
];

function fileSnippetMatches(filePath, words) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const ext = path.extname(filePath).toLowerCase();
    const allowed = ['.md', '.markdown', '.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.html'];
    if (!allowed.includes(ext)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    // Score whole file
    const fileScore = scoreText(words, raw);
    if (fileScore <= 0) return null;
    // Find best snippet lines containing query words
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const s = scoreText(words, line);
      if (s > 0) {
        const ctx = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
        hits.push({ score: s, snippet: ctx });
      }
    }
    // Choose top hit
    if (hits.length === 0) return null;
    hits.sort((a, b) => b.score - a.score);
    const top = hits[0];
    return { text: top.snippet.slice(0, 1000), score: fileScore };
  } catch (e) {
    return null;
  }
}

// Main retrieval function: looks for relevant Project and Subject documents.
// If DB lookup fails or returns few results, also search repository files.
// Returns array of { source, id, text, score }
async function retrieveRelevantDocs(query, limit = 3) {
  const q = norm(query);
  const words = Array.from(new Set(q.split(/[^a-z0-9]+/).filter(Boolean)));
  const results = [];

  // eslint-disable-next-line no-console
  console.log(`[RAG] Query: "${query}" → normalized words:`, words, `(limit=${limit})`);

  // Try DB sources first (non-fatal)
  try {
    const projects = await (ProjectModel.default || ProjectModel).find({}, { title: 1, description: 1, tags: 1 }).lean().limit(500);
    // eslint-disable-next-line no-console
    console.log(`[RAG] Found ${projects.length} projects in DB`);
    for (const p of projects) {
      const text = [p.title, p.description, (p.tags || []).join(' ')].filter(Boolean).join('\n');
      const s = scoreText(words, text);
      if (s > 0) {
        results.push({ source: `project:${p._id}`, id: p._id, text: text.slice(0, 800), score: s });
        // eslint-disable-next-line no-console
        console.log(`[RAG]   → Project match: "${p.title}" (score=${s})`);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[RAG] DB project lookup failed:', e && e.message ? e.message : e);
  }

  try {
    const subjects = await (SubjectModel.default || SubjectModel).find({}, { name: 1, description: 1 }).lean().limit(500);
    // eslint-disable-next-line no-console
    console.log(`[RAG] Found ${subjects.length} subjects in DB`);
    for (const sdoc of subjects) {
      const text = [sdoc.name, sdoc.description].filter(Boolean).join('\n');
      const s = scoreText(words, text);
      if (s > 0) {
        results.push({ source: `subject:${sdoc._id}`, id: sdoc._id, text: text.slice(0, 800), score: s });
        // eslint-disable-next-line no-console
        console.log(`[RAG]   → Subject match: "${sdoc.name}" (score=${s})`);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[RAG] DB subject lookup failed:', e && e.message ? e.message : e);
  }

  // Prefer vector store results if available
  if (vectorStore && typeof vectorStore.search === 'function') {
    try {
      const vs = await vectorStore.search(query, Math.max(limit, 5));
      // eslint-disable-next-line no-console
      console.log(`[RAG] Vector store returned ${vs && vs.length ? vs.length : 0} results`);
      if (Array.isArray(vs) && vs.length > 0) {
        // convert vector results to same shape and boost handbook files
        for (const v of vs) {
          let score = (v.score || 0) * 100; // scale up to compare with other heuristics
          if (v.source && String(v.source).includes('backend/data')) score *= 1.3; // prefer handbook files
          results.push({ source: v.source, id: v.id || null, text: v.text, score });
          // eslint-disable-next-line no-console
          console.log(`[RAG]   → Vector match: "${v.source}" (score=${score})`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[RAG] Vector store search failed:', e && e.message ? e.message : e);
    }
  }

  // Search prebuilt RAG index if available
  if (ragIndex && ragIndex.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[RAG] Searching prebuilt index (${ragIndex.length} docs)...`);
    for (const doc of ragIndex) {
      const text = [doc.text, (doc.keywords || []).join(' ')].filter(Boolean).join(' ');
      const s = scoreText(words, text);
      if (s > 0) {
        results.push({ source: doc.source, id: doc.id, text: doc.text.slice(0, 800), score: s });
        // eslint-disable-next-line no-console
        console.log(`[RAG]   → Index match: "${doc.id}" from "${doc.source}" (score=${s})`);
      }
    }
  }

  // If not enough results from DB/vector store/index, run filesystem scan fallback
  if (results.length < Math.max(1, limit)) {
    // eslint-disable-next-line no-console
    console.log(`[RAG] Only ${results.length} results so far, scanning filesystem (need ${Math.max(1, limit)})`);
    const fileResults = [];
    const visited = new Set();
    for (const d of scanDirs) {
      try {
        if (fs.existsSync(d)) {
          const stat = fs.statSync(d);
          if (stat.isFile()) {
            const match = fileSnippetMatches(d, words);
            if (match) {
              fileResults.push({ source: `file:${path.relative(repoRoot, d)}`, id: null, text: match.text, score: match.score });
              // eslint-disable-next-line no-console
              console.log(`[RAG]   → File match: "${path.relative(repoRoot, d)}" (score=${match.score})`);
            }
          } else if (stat.isDirectory()) {
            // walk directory shallowly
            const entries = fs.readdirSync(d);
            for (const e of entries) {
              const fp = path.join(d, e);
              if (visited.has(fp)) continue;
              visited.add(fp);
              const match = fileSnippetMatches(fp, words);
              if (match) {
                fileResults.push({ source: `file:${path.relative(repoRoot, fp)}`, id: null, text: match.text, score: match.score });
                // eslint-disable-next-line no-console
                console.log(`[RAG]   → File match: "${path.relative(repoRoot, fp)}" (score=${match.score})`);
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    results.push(...fileResults);
  }

  // Sort and dedupe by source/text
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const key = `${r.source}::${(r.id || '')}::${(r.text || '').slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ source: r.source, id: r.id, text: r.text, score: r.score });
    if (out.length >= limit) break;
  }

  // eslint-disable-next-line no-console
  console.log(`[RAG] Final result count: ${out.length}/${limit}`, out.map(r => r.source));
  return out;
}

// Rebuild the simple prebuilt RAG index from DB content (Projects, BlogPosts, Topics, KB, etc.)
async function rebuildIndex() {
  const docs = [];
  try {
    // Projects
    try {
      const projects = await (ProjectModel.default || ProjectModel).find({}, { title: 1, description: 1, tags: 1 }).lean().limit(2000);
      for (const p of projects) {
        const text = [p.title, p.description, (p.tags || []).join(' ')].filter(Boolean).join('\n');
        docs.push({ source: 'project', id: String(p._id), text: text.slice(0, 4000), keywords: p.tags || [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: projects failed', e && e.message ? e.message : e); }

    // Blog posts
    try {
      const posts = await (BlogPostModel.default || BlogPostModel).find({}, { title: 1, excerpt: 1, content: 1, tags: 1 }).lean().limit(2000);
      for (const b of posts) {
        const text = [b.title, b.excerpt || '', (b.content || '').slice(0, 4000)].filter(Boolean).join('\n');
        docs.push({ source: 'blog', id: String(b._id), text: text.slice(0, 4000), keywords: b.tags || [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: blog posts failed', e && e.message ? e.message : e); }

    // Topics and topic details
    try {
      const topics = await (TopicModel.default || TopicModel).find({}, { title: 1, description: 1 }).lean().limit(1000);
      for (const t of topics) {
        const text = [t.title, t.description].filter(Boolean).join('\n');
        docs.push({ source: 'topic', id: String(t._id), text: text.slice(0, 4000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: topics failed', e && e.message ? e.message : e); }
    try {
      const tdetails = await (TopicDetailModel.default || TopicDetailModel).find({}, { title: 1, body: 1 }).lean().limit(2000);
      for (const td of tdetails) {
        const text = [td.title, td.body || ''].filter(Boolean).join('\n');
        docs.push({ source: 'topic-detail', id: String(td._id), text: text.slice(0, 4000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: topic details failed', e && e.message ? e.message : e); }

    // Research areas
    try {
      const areas = await (ResearchAreaModel.default || ResearchAreaModel).find({}, { title: 1, description: 1 }).lean().limit(1000);
      for (const a of areas) {
        const text = [a.title, a.description || ''].filter(Boolean).join('\n');
        docs.push({ source: 'research-area', id: String(a._id), text: text.slice(0, 4000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: research areas failed', e && e.message ? e.message : e); }

    // FAQs
    try {
      const faqs = await (FAQModel.default || FAQModel).find({}, { question: 1, answer: 1 }).lean().limit(2000);
      for (const f of faqs) {
        const text = [f.question, f.answer].filter(Boolean).join('\n');
        docs.push({ source: 'faq', id: String(f._id), text: text.slice(0, 2000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: faqs failed', e && e.message ? e.message : e); }

    // Testimonials
    try {
      const tms = await (TestimonialModel.default || TestimonialModel).find({}, { author: 1, body: 1 }).lean().limit(2000);
      for (const t of tms) {
        const text = [t.author || '', t.body || ''].filter(Boolean).join('\n');
        docs.push({ source: 'testimonial', id: String(t._id), text: text.slice(0, 2000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: testimonials failed', e && e.message ? e.message : e); }

    // Subjects (knowledge base)
    try {
      const subjects = await (SubjectModel.default || SubjectModel).find({}, { name: 1, description: 1 }).lean().limit(2000);
      for (const s of subjects) {
        const text = [s.name, s.description || ''].filter(Boolean).join('\n');
        docs.push({ source: 'subject', id: String(s._id), text: text.slice(0, 2000), keywords: [] });
      }
    } catch (e) { console.warn('[RAG] rebuildIndex: subjects failed', e && e.message ? e.message : e); }

    // Write to backend/data/rag-index.json
    try {
      const outPath = path.join(__dirname, '..', 'data', 'rag-index.json');
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), 'utf8');
      ragIndex = docs;
      lastRebuiltAt = new Date();
      lastUpdatedAt = new Date();
      // If vector store present, upsert docs into vector index (best-effort)
      if (vectorStore && typeof vectorStore.upsertDocument === 'function') {
        try {
          for (const d of docs) {
            try {
              // best-effort synchronous-ish upsert
              // do not await too long, but await sequentially to avoid flooding API
              // eslint-disable-next-line no-await-in-loop
              await vectorStore.upsertDocument({ id: d.id, source: d.source, text: d.text });
            } catch (e) {
              // ignore per-doc errors
            }
          }
        } catch (e) {
          console.warn('[RAG] rebuildIndex: vector store upsert failed', e && e.message ? e.message : e);
        }
      }
      // eslint-disable-next-line no-console
      console.log(`[RAG] Rebuilt prebuilt index with ${docs.length} documents`);
      return docs.length;
    } catch (e) {
      console.warn('[RAG] rebuildIndex: failed to write index', e && e.message ? e.message : e);
      throw e;
    }
  } catch (e) {
    console.warn('[RAG] rebuildIndex: unexpected error', e && e.message ? e.message : e);
    throw e;
  }
}

// Incremental update: add or update a single document in the in-memory index and persist
async function addOrUpdateDoc(doc) {
  try {
    if (!doc || !doc.source || !doc.id) throw new Error('Invalid doc');
    // Ensure text is present
    const entry = {
      source: doc.source,
      id: String(doc.id),
      text: String(doc.text || '').slice(0, 4000),
      keywords: Array.isArray(doc.keywords) ? doc.keywords : []
    };
    // replace if exists
    let replaced = false;
    for (let i = 0; i < ragIndex.length; i++) {
      if (String(ragIndex[i].source) === String(entry.source) && String(ragIndex[i].id) === String(entry.id)) {
        ragIndex[i] = entry;
        replaced = true;
        break;
      }
    }
    if (!replaced) ragIndex.push(entry);
    // persist
    const outPath = path.join(__dirname, '..', 'data', 'rag-index.json');
    try {
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(ragIndex, null, 2), 'utf8');
      lastUpdatedAt = new Date();
      // Update vector store if available
      if (vectorStore && typeof vectorStore.upsertDocument === 'function') {
        try {
          await vectorStore.upsertDocument({ id: entry.id, source: entry.source, text: entry.text });
        } catch (e) {
          // non-fatal
          console.warn('[RAG] addOrUpdateDoc: vectorStore.upsertDocument failed', e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.warn('[RAG] addOrUpdateDoc: failed to persist index', e && e.message ? e.message : e);
    }
    return entry;
  } catch (e) {
    throw e;
  }
}

// Incremental update: remove a document by source and id
async function removeDoc(source, id) {
  try {
    if (!source || !id) throw new Error('source and id required');
    const before = ragIndex.length;
    ragIndex = ragIndex.filter(d => !(String(d.source) === String(source) && String(d.id) === String(id)));
    if (ragIndex.length !== before) {
      const outPath = path.join(__dirname, '..', 'data', 'rag-index.json');
      try {
        const dir = path.dirname(outPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(ragIndex, null, 2), 'utf8');
        lastUpdatedAt = new Date();
        if (vectorStore && typeof vectorStore.removeDocument === 'function') {
          try {
            vectorStore.removeDocument(source, id);
          } catch (e) {
            console.warn('[RAG] removeDoc: vectorStore.removeDocument failed', e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        console.warn('[RAG] removeDoc: failed to persist index', e && e.message ? e.message : e);
      }
      return true;
    }
    return false;
  } catch (e) {
    throw e;
  }
}

function getIndexStats() {
  const out = {
    docCount: Array.isArray(ragIndex) ? ragIndex.length : 0,
    lastRebuiltAt: lastRebuiltAt ? lastRebuiltAt.toISOString() : null,
    lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
    vectorStoreCount: null
  };
  try {
    if (vectorStore && typeof vectorStore.loadStore === 'function') {
      const vs = vectorStore.loadStore();
      out.vectorStoreCount = (vs && Array.isArray(vs.docs)) ? vs.docs.length : 0;
    }
  } catch (e) { /* ignore */ }
  return out;
}

module.exports = { retrieveRelevantDocs, rebuildIndex, addOrUpdateDoc, removeDoc, getIndexStats };
