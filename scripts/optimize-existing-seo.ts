import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const s3Region = process.env.AWS_REGION || 'ap-south-1';
const s3BucketName = process.env.AWS_S3_BUCKET_NAME || 'printfielddigital';

const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function loadProductsFromS3() {
  try {
    const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/products.json' }));
    const str = await getRes.Body?.transformToString() || '[]';
    return JSON.parse(str);
  } catch (err: any) {
    console.error("Error fetching products.json from S3:", err.message || err);
    return [];
  }
}

async function saveProductsToS3(products: any[]) {
  const jsonStr = JSON.stringify(products, null, 2);
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketName,
    Key: 'database/products.json',
    Body: jsonStr,
    ContentType: 'application/json',
  }));
}

async function runSEO() {
  console.log("Loading existing products from S3...");
  const allProducts = await loadProductsFromS3();
  console.log(`Found ${allProducts.length} products in catalog.`);

  if (allProducts.length === 0) {
    console.log("No products to optimize.");
    return;
  }

  const batchSize = 5;
  let updatedCount = 0;

  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(allProducts.length / batchSize)}...`);

    const batchPromptList = batch.map((p: any, idx: number) => 
      `${idx + 1}. ID: "${p.id}", Name: "${p.name}", Category: "${p.category || 'Custom Printing'}", SubCategory: "${p.subCategory || ''}", Description: "${(p.description || '').slice(0, 200)}"`
    ).join('\n');

    const prompt = `You are an expert e-commerce SEO strategist. Generate high-ranking Meta Titles and Meta Descriptions for Google Search for EACH of these products:

Products:
${batchPromptList}

STRICT SEO REQUIREMENTS FOR EACH PRODUCT:
1. "id": must match the exact Product ID.
2. "metaTitle": 50-60 characters max. Include primary search keywords (e.g. "Custom Acrylic Award - Personalized Trophies | Printfield"). Always end with "| Printfield".
3. "metaDescription": 140-160 characters max. Persuasive search snippet with high CTR keywords (e.g. "Order custom acrylic awards with premium laser engraving. Fast delivery & bulk discounts at Printfield. Customize online today!").
4. "cardDescription": short 1-2 sentence summary (max 110 chars) for listing card grids.

Return JSON ONLY as an array of objects matching the schema.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                metaTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                cardDescription: { type: Type.STRING }
              },
              required: ["id", "metaTitle", "metaDescription"]
            }
          }
        }
      });

      const text = response.text?.trim() || "[]";
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed) && parsed.length > 0) {
        batch.forEach((item: any, bIdx: number) => {
          const matched = parsed.find((p: any) => p.id === item.id) || parsed[bIdx];
          const targetIdx = allProducts.findIndex((p: any) => p.id === item.id);
          if (targetIdx !== -1) {
            allProducts[targetIdx].metaTitle = matched?.metaTitle || `${item.name} - Custom Printing | Printfield`;
            allProducts[targetIdx].metaDescription = matched?.metaDescription || (item.cardDescription || item.description || `Buy custom ${item.name} at Printfield. High quality & fast shipping.`).slice(0, 160);
            if (!allProducts[targetIdx].cardDescription && matched?.cardDescription) {
              allProducts[targetIdx].cardDescription = matched.cardDescription;
            }
            allProducts[targetIdx].updatedAt = Date.now();
            updatedCount++;
            console.log(`  ✓ [${item.name}] => Title: "${allProducts[targetIdx].metaTitle}"`);
          }
        });
      }
    } catch (err: any) {
      console.error(`Error in batch ${i}:`, err.message || err);
      // Fallback
      batch.forEach((item: any) => {
        const targetIdx = allProducts.findIndex((p: any) => p.id === item.id);
        if (targetIdx !== -1) {
          allProducts[targetIdx].metaTitle = `${item.name} - Custom ${item.category || 'Printing'} | Printfield`;
          allProducts[targetIdx].metaDescription = (item.cardDescription || item.description || `Order custom printed ${item.name} online at Printfield. Quality guaranteed & fast shipping.`).slice(0, 160);
          allProducts[targetIdx].updatedAt = Date.now();
          updatedCount++;
        }
      });
    }
  }

  console.log("Saving updated products back to AWS S3...");
  await saveProductsToS3(allProducts);
  console.log(`🎉 SUCCESS: ${updatedCount} products updated with high-ranking AI SEO metadata!`);
}

runSEO().catch(err => {
  console.error("Script failed:", err);
});
