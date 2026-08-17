require('dotenv').config();
const fs = require('fs');
const http = require('http');

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen2.5:7b',
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 }
    });
    const req = http.request({
      hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const b = Buffer.concat(chunks).toString('utf8');
        try { resolve(JSON.parse(JSON.parse(b).response)); }
        catch (e) { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const CODE = /\b(?:(?:MTX?|WT|FB|W-|I-|V|CRICK|BDMTN|KABADDI)[A-Z]*\s?\d{1,5}[A-Z]*|\d{3,4}[A-Z]?|\d{3,4})\b/g;
const WD = /\bWD\s?\d{1,2}\b/g;
const CLEAN = /\b(?:coming soon|on order|with box)\b/gi;
const multi = /\s{2,}/g;
function cleanName(name){
  let n = name.replace(CODE,' ').replace(WD,' ').replace(CLEAN,' ').replace(multi,' ').trim();
  n = n.replace(/\bGLD\b/i,'Gold').replace(/\bSLVR\b/i,'Silver').replace(/\bBRZ\b/i,'Bronze')
       .replace(/\bDEFNDR\b/i,'Defender').replace(/\bBDMTN\b/i,'Badminton')
       .replace(/\b2Star\b/i,'Double Star').replace(/\bCRICK UMPIRE\b/i,'Cricket Umpire')
       .replace(/\bG Trophy\b/i,'Gold Trophy').replace(/\bS Trophy\b/i,'Silver Trophy').replace(/\bR Trophy\b/i,'Red Trophy')
       .replace(/\bTrophy Trophy\b/i,'Trophy');
  return n;
}

const prods = JSON.parse(fs.readFileSync('./data/products.json','utf8'));
const trophies = prods.filter(x => { const c = String(x.category || '').toLowerCase().trim(); return c === 'trophies' || c === 'awards'; });
console.log('trophies:', trophies.length);

const PROMPT_HEADER = `You write SEO meta for a premium trophy manufacturer website (Printfield). Product: NAME.
Create a Google-optimized metaTitle (max 60 chars) and metaDescription (max 155 chars, 1-2 sentences) for this trophy.
RULES:
- NEVER mention model numbers, SKU codes, or digit codes (like 5167, MT773, WT109). NEVER use digits at all unless part of a dimension.
- Make it rank high: lead with strong search keywords like "Custom Wooden Trophies", "Award Trophies India", "Sports Trophy Manufacturer", "Gold Metal Trophy", "Buy Trophies Online", "Trophy for Award Ceremony".
- Use natural commercial language: "custom", "premium", "awards & recognition", "engraving", "bulk orders", "India".
- Include the product type/material/sport if known.
- End the title with " | Printfield".
- Return JSON ONLY: {"items":[{"id":"...","metaTitle":"...","metaDescription":"..."}]} for exactly these product ids, one item per id, ids in same order.
`;

function batchPrompt(batch) {
  const lines = batch.map((x, i) => `${i + 1}. id=${x.id} | product="${x.name}" | clean="${cleanName(x.name)}" | material=${x.mat || 'unknown'} | finish=${x.fin || ''} | sport=${x.sport || ''} | design=${x.design || ''}`);
  return PROMPT_HEADER + '\n' + lines.join('\n') + '\n';
}

function attrs(x){
  const cn = cleanName(x.name);
  const a = { id: x.id, name: x.name, mat: { 'Wooden Trophies':'wooden','Metal Trophies':'metal','Fiber Trophies':'fiber' }[x.subCategory] || '' };
  const r = cn.match(/\b(batsman|bowler|fielder|umpire)\b/i); a.role = r ? r[1].toLowerCase() : '';
  const f = cn.match(/\b(gold|silver|bronze|black|white|blue|red|golden)\b/i); a.fin = f ? f[1].toLowerCase() : '';
  const s = cn.match(/\b(cricket|football|volleyball|kabaddi|tennis|table tennis|shuttlecock|badminton|basketball|hockey)\b/i); a.sport = s ? s[1].toLowerCase() : '';
  const d = cn.match(/\b(double star|single star|flying star|shooting star|star|heart|round|oscar|ashoka|glasscutt|steambeech|medal frame|piano wooden plaque|window plate|photo frame|certificate frame|plaque|shield|flag)\b/i); a.design = d ? d[1].toLowerCase() : '';
  return a;
}

const targets = trophies.map(attrs);
const BATCH = 6;
let done = 0, failed = 0;
let skip = Number(process.env.SKIP || 0);
const batchSize = BATCH;

(async () => {
  for (let i = skip; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    let ok = false;
    try {
      const res = await callOllama(batchPrompt(batch));
      if (res && Array.isArray(res.items)) {
        const byId = {};
        res.items.forEach(it => { if (it && it.id) byId[it.id] = it; });
        for (const t of batch) {
          const it = byId[t.id];
          const target = prods.find(p => p.id === t.id);
          if (it && target) {
            if (it.metaTitle && /Printfield/i.test(it.metaTitle) && !/\b\d{2,4}\b/.test(it.metaTitle)) {
              target.metaTitle = String(it.metaTitle).trim().slice(0, 70);
              target.metaDescription = String(it.metaDescription || '').trim().slice(0, 165);
              target.updatedAt = Date.now();
              ok = true; done++;
            } else { failed++; }
          } else { failed++; }
        }
      } else { failed += batch.length; }
    } catch (e) { failed += batch.length; }
    if (i % 60 === 0 || i + batchSize >= targets.length) console.log(`Processed ${Math.min(i + batchSize, targets.length)}/${targets.length} | ok:${done} fail:${failed}`);
    if (!ok) { /* allow retry */ }
  }
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  console.log('=== SUMMARY done:', done, '| fallback-failed:', failed, '===');
})();
