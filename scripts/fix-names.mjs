import 'dotenv/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const API_URL = 'http://localhost:3000';
const adminToken = jwt.sign({ role: 'admin', email: 'admin@printfield.com' }, JWT_SECRET, { expiresIn: '2h' });

async function fetchProducts() {
  const res = await fetch(`${API_URL}/api/products?limit=2000`);
  const data = await res.json();
  return data.data || data.products || [];
}

async function detectNameFromImage(imageUrl, category) {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava:7b',
        messages: [{
          role: 'user',
          content: `You are a product naming expert for a printing and corporate gifting company in Bangalore, India.

Look at this product image and give it a specific, marketable product name.

The product is in the "${category || 'Corporate Gifts'}" category.

Rules:
- Be specific (e.g. "Ceramic Coffee Mug with Lid" not just "Mug")
- Include material/feature if visible (e.g. "Stainless Steel", "Bamboo", "Cotton")
- Keep it under 60 characters
- No brand names unless clearly visible
- Return ONLY the product name, nothing else, no quotes, no period`,
          images: [base64]
        }],
        stream: false,
        options: { temperature: 0.3, num_predict: 30 }
      })
    });

    const data = await ollamaRes.json();
    return data.message?.content?.trim()?.replace(/^["']|["']$/g, '') || null;
  } catch (e) {
    console.error('  Ollama error:', e.message?.slice(0, 100));
    return null;
  }
}

async function updateProduct(id, name) {
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ name })
  });
  return res.ok;
}

async function main() {
  console.log('Fetching products...');
  const products = await fetchProducts();
  
  const needsFix = products.filter(p => {
    const name = p.name || '';
    return name.startsWith('Product ') || name.startsWith('New Product') || name.length < 3;
  });

  console.log(`Found ${needsFix.length} products with generic names\n`);

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < needsFix.length; i++) {
    const p = needsFix[i];
    const rawUrl = p.image || (p.images && p.images[0]) || '';
    const imageUrl = rawUrl.startsWith('http') ? rawUrl : `${API_URL}${rawUrl}`;
    
    if (!imageUrl || imageUrl === API_URL) {
      console.log(`[${i+1}/${needsFix.length}] SKIP ${p.id} — no image`);
      failed++;
      continue;
    }

    process.stdout.write(`[${i+1}/${needsFix.length}] ${p.name} → `);

    const newName = await detectNameFromImage(imageUrl, p.category);
    
    if (newName && newName !== p.name && newName.length > 2) {
      const success = await updateProduct(p.id, newName);
      if (success) {
        console.log(`"${newName}" ✓`);
        fixed++;
      } else {
        console.log(`update failed ✗`);
        failed++;
      }
    } else {
      console.log(`no change (${newName || 'null'})`);
      failed++;
    }
  }

  console.log(`\nDone! Fixed: ${fixed}, Failed/Skipped: ${failed}`);
}

main().catch(console.error);
