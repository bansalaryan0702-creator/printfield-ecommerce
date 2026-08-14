require('dotenv').config();

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, res => {
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
  const FOLDER_ID = '1BbfYUaEX_nA7iipeu5xRtJzv1BYGC-n1';
  
  // Get file list from Google Drive
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`https://drive.google.com/drive/folders/${FOLDER_ID}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  for (let i = 0; i < 15; i++) { await page.evaluate(() => window.scrollBy(0, 500)); await new Promise(r => setTimeout(r, 300)); }
  const html = await page.content();
  await browser.close();
  
  // Extract file IDs and their names from the HTML
  // Google Drive puts data-id attributes on rows and the filename in a nearby element
  const $ = cheerio.load(html);
  const fileMap = []; // { id, name }
  
  // Find all rows with data-id
  $('[data-id]').each((i, el) => {
    const id = $(el).attr('data-id');
    if (id && id.length > 20) {
      // Look for filename text in the row
      const text = $(el).text();
      const nameMatch = text.match(/(Urban Gear [^\n]+)/i);
      if (nameMatch) {
        fileMap.push({ id, name: nameMatch[1].trim() });
      } else {
        fileMap.push({ id, name: '' });
      }
    }
  });
  
  // Fallback: use the nameMatches we found earlier and pair with fileIds
  const nameMatches = [...html.matchAll(/(Urban Gear [^<"]+\.png)/gi)].map(m => m[1]);
  const uniqueNames = [...new Set(nameMatches)];
  
  console.log('File IDs found via data-id:', fileMap.length);
  console.log('Unique filenames found:', uniqueNames.length);
  
  // If data-id didn't work well, use URL-based extraction
  const urlIds = [...html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{20,})/g)].map(m => m[1]);
  const uniqueUrlIds = [...new Set(urlIds)];
  console.log('File IDs from URLs:', uniqueUrlIds.length);
  
  // Build the mapping: pair uniqueNames with uniqueUrlIds by position
  const finalMap = [];
  if (uniqueNames.length === uniqueUrlIds.length) {
    for (let i = 0; i < uniqueNames.length; i++) {
      finalMap.push({ id: uniqueUrlIds[i], name: uniqueNames[i] });
    }
  } else {
    // Use data-id results
    for (const f of fileMap) {
      if (f.name) finalMap.push(f);
    }
    // If still no names, use URL IDs
    if (finalMap.length === 0) {
      for (let i = 0; i < uniqueUrlIds.length; i++) {
        finalMap.push({ id: uniqueUrlIds[i], name: uniqueNames[i] || `image-${i}` });
      }
    }
  }
  
  console.log('\nFinal mapping:');
  finalMap.forEach(f => console.log(`  ${f.name} -> ${f.id.substring(0, 15)}...`));
  
  // Download images
  const downloadedImages = [];
  for (const f of finalMap) {
    try {
      const url = `https://drive.google.com/uc?export=download&id=${f.id}`;
      console.log(`Downloading: ${f.name}`);
      const buffer = await download(url);
      if (buffer.length > 5000) {
        downloadedImages.push({ name: f.name, buffer });
        console.log(`  OK: ${(buffer.length/1024).toFixed(0)} KB`);
      }
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
    }
  }
  
  console.log(`\nDownloaded ${downloadedImages.length} images`);
  
  // Load products
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  
  // Match by name
  let updated = 0;
  for (const img of downloadedImages) {
    const imgName = img.name.replace(/^Urban Gear\s+/i, '').replace(/\.png$/i, '').replace(/[-_]/g, ' ').toLowerCase().trim();
    
    // Find matching product
    const match = prods.find(p => {
      const pname = (p.name || '').toLowerCase().replace('urban gear', '').replace(/[.\-_*]/g, ' ').replace(/\s+/g, ' ').trim();
      return pname === imgName || pname.includes(imgName) || imgName.includes(pname);
    });
    
    if (match) {
      try {
        const localPath = await optimizeAndSave(img.buffer, match.id + '-drive-diary');
        match.image = localPath;
        if (!Array.isArray(match.images)) match.images = [localPath];
        else match.images[0] = localPath;
        updated++;
        console.log(`✓ "${match.name}" -> ${localPath}`);
      } catch (e) {
        console.log(`✗ "${match.name}": ${e.message}`);
      }
    } else {
      console.log(`? No match for "${img.name}"`);
    }
  }
  
  console.log(`\nUpdated ${updated} products`);
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
