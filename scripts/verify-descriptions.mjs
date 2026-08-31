import { GoogleGenAI } from '@google/genai';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const s3 = new S3Client({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
const BUCKET = process.env.AWS_S3_BUCKET;
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];

async function loadProducts() {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: 'database/products.json' }));
  return JSON.parse(await res.Body.transformToString());
}

async function saveProducts(prods) {
  const json = JSON.stringify(prods, null, 2);
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: 'database/products.json', Body: json, ContentType: 'application/json' }));
  await fs.writeFile('./data/products.json', json);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function analyzeAndGenerate(name, category, imagePath) {
  const absPath = path.join(process.cwd(), imagePath);
  const buffer = await fs.readFile(absPath);
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { text: `You are a product copywriter for Printfield (custom printing company, Whitefield Bangalore).

TASK: Look at this product image and generate SEO-optimized content.

Product name: ${name}
Category: ${category}

Reply in EXACTLY this JSON format (no other text):
{"imageDescription":"what you see in the image (2 sentences)","description":"Product description (2-3 sentences). Open with strong verb, describe accurately based on what you SEE, mention custom printing at Printfield Whitefield Bangalore.","cardDescription":"Short punchy hook 10-15 words","metaTitle":"${name} - Custom ${category} | Printfield","metaDescription":"Order ${name} at Printfield, Whitefield Bangalore. [key feature from image]. Custom branding. Fast delivery. Shop now!"}` },
            { inlineData: { mimeType: mime, data: buffer.toString('base64') } }
          ]
        }],
        config: { maxOutputTokens: 400, temperature: 0.5 }
      });

      const text = response.text?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
        await sleep(120000); // Wait 2 min on rate limit
        continue; // Try next model
      }
      if (e.message?.includes('404')) continue; // Try next model
      throw e;
    }
  }
  return null;
}

async function main() {
  const prods = await loadProducts();
  const remainingIds = JSON.parse(await fs.readFile('./scripts/remaining-ids.json', 'utf8'));
  const remainingSet = new Set(remainingIds);
  const prodsToProcess = prods.filter(p => remainingSet.has(p.id) && p.image && p.image.startsWith('/uploads/'));

  console.log(`Processing ${prodsToProcess.length} remaining products (skipping ${prods.length - prodsToProcess.length} already done)...\n`);

  let checked = 0, updated = 0, skipped = 0, errors = 0;

  for (const p of prodsToProcess) {
    checked++;
    try {
      const result = await analyzeAndGenerate(p.name, p.category, p.image);
      if (!result || !result.description) { errors++; continue; }

      const idx = prods.findIndex(x => x.id === p.id);
      if (idx !== -1) {
        prods[idx].description = result.description;
        prods[idx].cardDescription = result.cardDescription || p.cardDescription;
        prods[idx].metaTitle = result.metaTitle || p.metaTitle;
        prods[idx].metaDescription = result.metaDescription || p.metaDescription;
        updated++;
        console.log(`UPDATED [${checked}/${prodsToProcess.length}]: ${p.name}`);
      }

      await sleep(3000);

      if (checked % 25 === 0) {
        console.log(`--- Progress: ${checked}/${prodsToProcess.length} | Updated: ${updated} | Errors: ${errors} ---`);
        await saveProducts(prods);
      }
    } catch (e) {
      errors++;
      console.log(`ERROR [${checked}] ${p.name}: ${e.message?.slice(0, 80)}`);
      if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log('Rate limited, waiting 120s...');
        await sleep(120000);
      }
    }
  }

  console.log(`\n=== DONE === Checked: ${checked} | Updated: ${updated} | Errors: ${errors}`);
  if (updated > 0) await saveProducts(prods);
}

main().catch(console.error);
