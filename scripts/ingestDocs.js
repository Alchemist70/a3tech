// Optional ingestion script: scans repository files (same directories as ragService)
// and computes embeddings (requires OPENAI_API_KEY). Writes backend/data/embeddings.json

const fs = require('fs');
const path = require('path');
const { getEmbedding } = require('../backend/services/embeddings');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const scanTargets = [
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'backend'),
    path.join(repoRoot, 'frontend'),
    path.join(repoRoot, 'api')
  ];

  const out = [];
  for (const t of scanTargets) {
    try {
      if (!fs.existsSync(t)) continue;
      const stat = fs.statSync(t);
      if (stat.isFile()) {
        const text = fs.readFileSync(t, 'utf8').slice(0, 2000);
        const emb = await getEmbedding(text);
        out.push({ source: path.relative(repoRoot, t), text: text.slice(0, 1000), embedding: emb });
      } else if (stat.isDirectory()) {
        const entries = fs.readdirSync(t);
        for (const e of entries) {
          const fp = path.join(t, e);
          try {
            const s2 = fs.statSync(fp);
            if (!s2.isFile()) continue;
            const text = fs.readFileSync(fp, 'utf8').slice(0, 2000);
            const emb = await getEmbedding(text);
            out.push({ source: path.relative(repoRoot, fp), text: text.slice(0, 1000), embedding: emb });
          } catch (e) {
            // skip file
          }
        }
      }
    } catch (e) {
      // continue
    }
  }

  const targetDir = path.join(repoRoot, 'backend', 'data');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'embeddings.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', out.length, 'embeddings to backend/data/embeddings.json');
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
