require('dotenv').config();

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ 
  region: 'ap-south-1', 
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } 
});

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'optimized');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
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
    const result = await pipeline.webp({ quality: 75 }).toBuffer();
    fs.writeFileSync(filePath, result);
    return '/uploads/optimized/' + filename;
  } catch (e) {
    const result = await sharp(buffer).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
    const jpgName = hash + '.jpg';
    fs.writeFileSync(path.join(UPLOAD_DIR, jpgName), result);
    return '/uploads/optimized/' + jpgName;
  }
}

async function scrapeImagesFromPage(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_5) AppleWebKit/537.36');
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) { window.scrollBy(0, 500); await new Promise(r => setTimeout(r, 200)); }
    });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    const images = new Set();
    
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('dataimg') || '';
      if (src && src.includes('imimg.com') && src.includes('http') && !src.includes('logo') && !src.includes('125x125')) {
        // Get larger version
        src = src.replace(/-\d+x\d+\./, '-1000x1000.');
        if (!src.includes('1000x1000')) src = src.replace(/\.(jpg|jpeg|png)/i, '-1000x1000.$1');
        images.add(src);
      }
    });
    
    // Also check data-multiimg
    $('img[data-multiimg]').each((i, el) => {
      const multi = $(el).attr('data-multiimg') || '';
      multi.split(',').forEach(u => {
        u = u.trim();
        if (u && u.includes('imimg.com')) images.add(u.replace(/-\d+x\d+\./, '-1000x1000.'));
      });
    });
    
    await browser.close();
    return Array.from(images);
  } catch (e) {
    await browser.close();
    return [];
  }
}

(async () => {
  // Load current products
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const urban = prods.filter(p => (p.name || '').toLowerCase().includes('urban gear'));
  console.log('Urban Gear products:', urban.length);
  
  // Scrape images from multiple distributor pages
  const sources = [
    'https://www.indiamart.com/differentconcepts-delhi/photos.html',
    'https://www.indiamart.com/jaans-enterprises/',
    'https://www.indiamart.com/bags-n-tags/',
  ];
  
  const allImages = [];
  for (const url of sources) {
    console.log('Scraping:', url);
    const imgs = await scrapeImagesFromPage(url);
    console.log('  Found', imgs.length, 'images');
    allImages.push(...imgs);
  }
  
  // Also get images from specific product pages
  const productPages = [
    'https://www.indiamart.com/proddetail/urban-gear-2-in-1-mobile-holder-sports-bottle-23960554673.html',
    'https://www.indiamart.com/proddetail/urban-gear-stainless-steel-led-temperature-bottle-2854482781591.html',
    'https://www.indiamart.com/proddetail/urban-gear-sigma-pro-bottle-with-logo-2850165485688.html',
    'https://www.indiamart.com/proddetail/grain-wheat-fibre-eco-friendly-mug-2853918613555.html',
    'https://www.indiamart.com/proddetail/corky-ceramic-with-cork-base-2851633118755.html',
    'https://www.indiamart.com/proddetail/sigma-stainless-steel-sports-bottle-25410781012.html',
  ];
  
  for (const url of productPages) {
    console.log('Scraping product page:', url.split('/').pop());
    const imgs = await scrapeImagesFromPage(url);
    console.log('  Found', imgs.length, 'images');
    allImages.push(...imgs);
  }
  
  console.log('\nTotal unique images found:', allImages.length);
  
  // Match images to products by name similarity
  let updated = 0;
  for (const p of urban) {
    if (p.image && p.image.startsWith('/uploads/optimized/') && fs.existsSync(path.join(process.cwd(), p.image))) {
      continue; // Already has optimized image
    }
    
    const nameLower = (p.name || '').toLowerCase().replace('urban gear', '').trim();
    
    // Try to find a matching image
    let bestImage = null;
    for (const img of allImages) {
      const imgLower = img.toLowerCase();
      if (nameLower.split(' ').some(word => word.length > 3 && imgLower.includes(word))) {
        bestImage = img;
        break;
      }
    }
    
    // If no specific match, use a random image from the pool
    if (!bestImage && allImages.length > 0) {
      const idx = Math.abs(crypto.createHash('md5').update(p.id).digest('hex').charCodeAt(0)) % allImages.length;
      bestImage = allImages[idx];
    }
    
    if (bestImage) {
      try {
        console.log(`Downloading for "${p.name}": ${bestImage.substring(0, 80)}...`);
        const buffer = await download(bestImage);
        const localPath = await optimizeAndSave(buffer, p.id + '-' + nameLower.replace(/\s+/g, '-'));
        p.image = localPath;
        if (!Array.isArray(p.images) || p.images.length === 0) p.images = [localPath];
        else p.images[0] = localPath;
        updated++;
        console.log(`  -> ${localPath}`);
      } catch (e) {
        console.log(`  FAILED: ${e.message}`);
      }
    }
  }
  
  console.log(`\nUpdated ${updated} products with new images`);
  
  // Save
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
