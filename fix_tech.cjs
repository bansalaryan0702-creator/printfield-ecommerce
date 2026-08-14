require('dotenv').config();

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ 
  region: 'ap-south-1', 
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } 
});

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'optimized');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function optimizeAndSave(buffer, name) {
  const hash = crypto.createHash('md5').update(name).digest('hex').substring(0, 12);
  const filename = hash + '.webp';
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    let pipeline = img;
    if (meta.width > 1200) pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
    const result = await pipeline.webp({ quality: 85 }).toBuffer();
    fs.writeFileSync(filePath, result);
    return '/uploads/optimized/' + filename;
  } catch (e) {
    const result = await sharp(buffer).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    const jpgName = hash + '.jpg';
    fs.writeFileSync(path.join(UPLOAD_DIR, jpgName), result);
    return '/uploads/optimized/' + jpgName;
  }
}

(async () => {
  const FOLDER_ID = '1US8VXJpwBCblDwLvdJqEs5zkl9yegwo2';
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`https://drive.google.com/drive/folders/${FOLDER_ID}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  for (let i = 0; i < 20; i++) { await page.evaluate(() => window.scrollBy(0, 500)); await new Promise(r => setTimeout(r, 300)); }
  const html = await page.content();
  await browser.close();
  
  // Extract ALL data-id attributes (they appear in order on the page)
  const allDataIds = [...html.matchAll(/data-id="([a-zA-Z0-9_-]{25,})"/g)].map(m => m[1]);
  const uniqueIds = [...new Set(allDataIds)].filter(id => id !== FOLDER_ID);
  
  // Extract filenames in order they appear
  const nameRegex = /Urban Gear ([^<\n"]+?)\.png/gi;
  const names = [];
  let match;
  while ((match = nameRegex.exec(html)) !== null) {
    const name = 'Urban Gear ' + match[1].trim();
    if (!names.includes(name)) names.push(name);
  }
  
  console.log('Unique IDs:', uniqueIds.length);
  console.log('Unique names:', names.length);
  console.log('\nAll names:', names);
  
  // Download ALL images and save with name-based keys
  const downloadedImages = [];
  for (let i = 0; i < Math.min(uniqueIds.length, names.length); i++) {
    try {
      const url = `https://drive.google.com/uc?export=download&id=${uniqueIds[i]}`;
      console.log(`[${i+1}] ${names[i]}`);
      const buffer = await download(url);
      if (buffer.length > 5000) {
        downloadedImages.push({ name: names[i], buffer, index: i });
        console.log(`  ✓ ${(buffer.length/1024).toFixed(0)} KB`);
      } else {
        console.log('  Too small');
      }
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
  }
  
  console.log(`\nDownloaded ${downloadedImages.length} images`);
  
  // Now match and update the 4 specific products
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const targets = ['C.D.O', 'Power Display 2.0', 'Twin 2.0', 'Glowchrg'];
  
  let updated = 0;
  for (const img of downloadedImages) {
    const imgName = img.name.replace(/^Urban Gear\s+/i, '').replace(/[-_]/g, ' ').toLowerCase().trim();
    
    for (const target of targets) {
      if (imgName.includes(target.toLowerCase().replace(/[.]/g, ' ').replace(/\s+/g, ' ').trim())) {
        const product = prods.find(p => (p.name||'').includes(target));
        if (product) {
          const localPath = await optimizeAndSave(img.buffer, product.id + '-drive-tech');
          product.image = localPath;
          if (!Array.isArray(product.images)) product.images = [localPath];
          else product.images[0] = localPath;
          updated++;
          console.log(`\n✓ Updated "${product.name}" with "${img.name}"`);
        }
        break;
      }
    }
  }
  
  // Also update Glowchrg Pro with the correct image (it got overwritten with Glowchrg's)
  // Find the Glowchrg Pro image from the downloaded set
  const glowchrgProImg = downloadedImages.find(i => i.name.toLowerCase().includes('glowchrg pro'));
  if (glowchrgProImg) {
    const product = prods.find(p => (p.name||'').includes('Glowchrg Pro'));
    if (product) {
      const localPath = await optimizeAndSave(glowchrgProImg.buffer, product.id + '-drive-tech-glowchrgpro');
      product.image = localPath;
      if (!Array.isArray(product.images)) product.images = [localPath];
      else product.images[0] = localPath;
      updated++;
      console.log(`\n✓ Fixed "${product.name}" with correct image`);
    }
  }
  
  console.log(`\nTotal updated: ${updated}`);
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
