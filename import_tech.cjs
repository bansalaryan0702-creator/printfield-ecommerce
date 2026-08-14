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
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
  for (let i = 0; i < 15; i++) { await page.evaluate(() => window.scrollBy(0, 500)); await new Promise(r => setTimeout(r, 300)); }
  const html = await page.content();
  await browser.close();
  
  // Extract file IDs from data-id attributes
  const allDataIds = [...html.matchAll(/data-id="([a-zA-Z0-9_-]{25,})"/g)].map(m => m[1]);
  const fileIds = [...new Set(allDataIds)].filter(id => id !== FOLDER_ID);
  
  // Extract filenames
  const nameMatches = [...html.matchAll(/Urban Gear ([^<\n"]+)\.png/gi)];
  const uniqueNames = [...new Set(nameMatches.map(m => 'Urban Gear ' + m[1].trim() + '.png'))];
  
  console.log('File IDs:', fileIds.length, 'Names:', uniqueNames.length);
  
  // Pair by position
  const fileMap = [];
  const seenIds = new Set();
  for (let i = 0; i < Math.min(fileIds.length, uniqueNames.length); i++) {
    if (!seenIds.has(fileIds[i])) {
      seenIds.add(fileIds[i]);
      fileMap.push({ id: fileIds[i], name: uniqueNames[i] });
    }
  }
  
  // Load products
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  let updated = 0;
  
  for (const f of fileMap) {
    const imgName = f.name.replace(/^Urban Gear\s+/i, '').replace(/\.png$/i, '').replace(/[-_]/g, ' ').toLowerCase().trim();
    
    const match = prods.find(p => {
      const pname = (p.name || '').toLowerCase().replace('urban gear', '').replace(/[.\-_*]/g, ' ').replace(/\s+/g, ' ').trim();
      return pname === imgName || pname.includes(imgName) || imgName.includes(pname);
    });
    
    if (!match) { console.log(`? No match: "${f.name}"`); continue; }
    
    try {
      const url = `https://drive.google.com/uc?export=download&id=${f.id}`;
      console.log(`Downloading: ${f.name} -> "${match.name}"`);
      const buffer = await download(url);
      if (buffer.length < 5000) { console.log('  Too small'); continue; }
      
      const localPath = await optimizeAndSave(buffer, match.id + '-drive-tech');
      match.image = localPath;
      if (!Array.isArray(match.images)) match.images = [localPath];
      else match.images[0] = localPath;
      updated++;
      console.log(`  ✓ ${(buffer.length/1024).toFixed(0)} KB`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
  }
  
  console.log(`\nUpdated ${updated} products`);
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
