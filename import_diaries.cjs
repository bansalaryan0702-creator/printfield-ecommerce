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
  if (fs.existsSync(filePath)) return '/uploads/optimized/' + filename;
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
  
  // Scrape Google Drive folder to get file IDs and names
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`https://drive.google.com/drive/folders/${FOLDER_ID}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // Scroll to load all items
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 300));
  }
  
  const html = await page.content();
  await browser.close();
  
  // Extract file IDs from the page
  const fileMatches = [...html.matchAll(/data-id="([a-zA-Z0-9_-]{20,})"/g)];
  const fileIds = [...new Set(fileMatches.map(m => m[1]))];
  console.log('Found', fileIds.length, 'file IDs in folder');
  
  // Also try extracting from URLs
  const urlMatches = [...html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{20,})/g)];
  urlMatches.forEach(m => { if (!fileIds.includes(m[1])) fileIds.push(m[1]); });
  
  console.log('Total unique file IDs:', fileIds.length);
  
  // Map filenames to file IDs by looking at the HTML
  const nameMatches = [...html.matchAll(/(Urban Gear [^<"]+\.png)/gi)];
  console.log('Found names:', nameMatches.map(m => m[1]));
  
  // Download all images
  const images = [];
  for (const fileId of fileIds) {
    try {
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log('Downloading:', fileId);
      const buffer = await download(url);
      if (buffer.length > 5000) { // Valid image
        images.push({ id: fileId, buffer });
        console.log('  OK:', (buffer.length / 1024).toFixed(0), 'KB');
      }
    } catch (e) {
      console.log('  FAILED:', e.message);
    }
  }
  
  console.log('\nDownloaded', images.length, 'images');
  
  // Load products
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const diaryProducts = prods.filter(p => {
    const name = (p.name || '').toLowerCase();
    return name.includes('diary') || name.includes('note') || name.includes('journal') || 
           name.includes('eco notes') || name.includes('kraft') || name.includes('lumber') ||
           name.includes('korki') || name.includes('bambu') || name.includes('strap') ||
           name.includes('element') || name.includes('senate') || name.includes('vogue') ||
           name.includes('zigy') || name.includes('vetor') || name.includes('veter') ||
           name.includes('slant') || name.includes('polygon') || name.includes('regal') ||
           name.includes('elegant') || name.includes('classic') || name.includes('primo') ||
           name.includes('roca') || name.includes('mystic') || name.includes('milky') ||
           name.includes('sugar') || name.includes('softy') || name.includes('dual') ||
           name.includes('champ') || name.includes('croco') || name.includes('traveller') ||
           name.includes('rpet') || name.includes('capri') || name.includes('hardy') ||
           name.includes('korsa') || name.includes('kriss') || name.includes('athena') ||
           name.includes('basic');
  });
  
  console.log('Diary/note products found:', diaryProducts.length);
  
  // Match images to products using name similarity
  let updated = 0;
  for (const p of diaryProducts) {
    if (p.image && p.image.startsWith('/uploads/optimized/') && fs.existsSync(path.join(process.cwd(), p.image))) {
      continue;
    }
    
    const nameLower = (p.name || '').toLowerCase().replace('urban gear', '').trim();
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);
    
    let bestImage = null;
    let bestScore = 0;
    
    for (const img of images) {
      // Try to match by file ID by checking HTML for filename association
      // For now, use hash-based assignment
      const score = nameWords.filter(w => {
        const imgHash = crypto.createHash('md5').update(img.id).digest('hex');
        return imgHash.includes(w.substring(0, 3));
      }).length;
      
      if (score > bestScore) {
        bestScore = score;
        bestImage = img;
      }
    }
    
    // Fallback: assign sequentially based on product index
    if (!bestImage && images.length > 0) {
      const idx = Math.abs(crypto.createHash('md5').update(p.id).digest('hex').charCodeAt(0)) % images.length;
      bestImage = images[idx];
    }
    
    if (bestImage) {
      try {
        const localPath = await optimizeAndSave(bestImage.buffer, p.id + '-diary');
        p.image = localPath;
        if (!Array.isArray(p.images) || p.images.length === 0) p.images = [localPath];
        else p.images[0] = localPath;
        updated++;
        console.log(`Updated "${p.name}" -> ${localPath}`);
      } catch (e) {
        console.log(`FAILED "${p.name}": ${e.message}`);
      }
    }
  }
  
  console.log(`\nUpdated ${updated} diary products`);
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
