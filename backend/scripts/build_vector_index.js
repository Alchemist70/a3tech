const fs = require('fs');
const path = require('path');
const { indexDocuments } = require('../services/vectorStore');

// Build a vector index from backend/data files and basic DB-like items (flat file scanning)
async function gatherDocs() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const dataDir = path.join(repoRoot, 'backend', 'data');
  const docs = [];
  try {
    if (fs.existsSync(dataDir)) {
      const entries = fs.readdirSync(dataDir);
      for (const e of entries) {
        const fp = path.join(dataDir, e);
        try {
          const stat = fs.statSync(fp);
          if (!stat.isFile()) continue;
          const ext = path.extname(fp).toLowerCase();
          const allowed = ['.md', '.txt', '.json'];
          if (!allowed.includes(ext)) continue;
          const raw = fs.readFileSync(fp, 'utf8').trim();
          if (!raw) continue;
          docs.push({ source: `file:backend/data/${e}`, id: null, text: raw.slice(0, 3000) });
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Always include README at repo root if present
  try {
    const readme = path.join(repoRoot, 'README.md');
    if (fs.existsSync(readme)) {
      const raw = fs.readFileSync(readme, 'utf8').trim();
      if (raw) docs.push({ source: 'file:README.md', id: null, text: raw.slice(0, 3000) });
    }
  } catch (e) {}

  return docs;
}

async function main() {
  console.log('Gathering docs for vector index...');
  const docs = await gatherDocs();
  console.log('Docs to index:', docs.map(d => d.source));
  const count = await indexDocuments(docs);
  console.log('Indexing complete. Document count:', count);
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
