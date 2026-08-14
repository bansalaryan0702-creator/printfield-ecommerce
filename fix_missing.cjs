require('dotenv').config();

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

// Files from the Tech Drive folder that were skipped due to dots in names
const FILES = [
  { name: 'Urban Gear C.D.O', id: '13hfAuBjs_D9yVUz_qyK-PLl7Kp8dQNJf' },  // placeholder - need correct ID
];

// Actually let me just download all images from the folder and re-match properly
const ALL_IDS = [
  '13hfAuBjs_D9yVUz_qyK-PLl7Kp8dQNJf',
  '11pGOIVTonCODG7sjUvE-tSStBCCXyQDi',
  '1iOBTKsGfCIjyiWgfSORhFueNTJcARuJU',
  '1fuXmGLSTdk4XBzWQODyQKdUtHRldMlcy',
  '1IaL7ZXUGPeOw4WyiINWCcFIyLDlB7Ozg',
  '10dscpTmC31uEuTKFQpbS-I2aIE4YaOC1',
  '1CqU5qt6wNqDicj5mewiVWL4xpC690cmw',
  '16KTpPs2e4sPceWc9zH1GXwMINEcb4XVm',
  '1T2bHE5JRlD1KGOPG9Yes0ces07m87E7K',
  '1IZ8N6REL4u9jnrXcYXQWjvE_PU7GaxsS',
  '1YrpJcriS2i1jcalVCEBMzs2MaeMB64NB',
  '1vHr-1UuQUhJXJKqTnoRcOXkwrrkQrxlZ',
  '1G3o7aF827cFmgo3me86E3Do-yB39oqFs',
  '17ufvGrUVuBdABgfE97vHvfVDCOXU2Hxz',
  '1j3w_1PAEtuOo6-zCysT7Gcv3uJ4F2Iz1',
  '13SPzWBtvMEMPBMRpXYTH__W6doyAZh-1',
  '1-BtDIvezhVyZDqyWU6oV7W5xNQHbWcWY',
  '1FkBOwTDAc1B33xZKxWpV4L0QHJf6ZfQ',
  '1Ya7QRSUtaigvMH62a9Hc2MKtKWUh9EmZ',
  '1NtSlKjWQV447spJ2OpzjdAztaDiEDx1v',
  '1nOAy41z2ztL5mS8Zng7AyyKNEJ0vvzab',
  '1ip-iVhbWtgn54W_NwQsb_L30xRaL3XxB',
  '1bky9yC1xR9rvu_kp65zd2FzQITWIacDl',
  '1U6spfMYTmmjtZED09-bKWkT2kLFwxT5W',
  '1-fjAzH_jNqpl1SkAmLPoLyc4-Xguc7sB',
  '1f5TfGAnfgiDoK_2icWsFDwkLmEAHlPa9',
  '1vf8rQoYJsOXbfZ8X9TiuAaXBNX32drHr',
  '1fQeBNjnIR4iJJKxVZ9G5P3Q9G8bKcZzQ',
  '1Mii3XQcy6v18jLWm101kWLuuunXthUFt',
  '1DLyglFWB_614gCXWSKRIRW5CMCzBJGC3',
  '16bvZhPGeD9UWR0J3M7cBQ5G8K3fKzZzQ',
  '1FpgOi6YlPWWoUG3BkxVrIKPOwEsn5vIg',
  '15qPh7Ioa5_T00kH3tCDbAEe1hbmtFHRa',
  '1kyA-DTYPYhEk0AlS7UqL7gURF09ujVB9',
  '1aLCS0jAPMUSZJgtPo0GphLmH4i11kp2z',
  '14lEmf8VuGxYot8ipOWataH-Y8OQz_xDN',
  '1zBLJIjdF8QbXiZuhlXDGzMXiYfKtOWMi',
  '1SNABFUcM1WYm1Lv7bXnBkixaTofgG-ZB',
  '1AtwuJa1Xi2E-mYX8lMhWexcigQosdcUt',
  '1G8oVmzuWixE2nbLQBfaFh5H4EN8JAIOm',
  '1558p59Qs4bnwgpTecXFNq8Ab8csDfRB2',
  '18nHvr4ff0o5iRVGgvziPHUIqfNvwK5A2',
  '1_ONB3TuSlKYoohrg88b6afphw6aKwK8M',
  '1fsOqmIxmB514L9tClf8CklydZ4WIzFj7',
  '18N72Z3v-tJQTgW1ut7K4MkT3lgdGmJy8',
];

(async () => {
  // The products that still have old images
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const stillOld = prods.filter(p => (p.name||'').toLowerCase().includes('urban gear') && 
    (!p.image || p.image.includes('66c2b30f002d') || p.image.includes('08e7645abb64') || p.image.includes('4a1be5596974') || p.image.includes('d82e8b611427')));
  
  console.log('Products potentially needing update:');
  stillOld.forEach(p => console.log('  ', p.name, '->', p.image));
  
  // Download ALL Drive images and let's see which ones we have
  // We already have the diary images from the other folder
  // For the tech folder, we need the correct file IDs
  // Let me just verify what images exist and find any that are still missing
  
  // Actually the simplest fix: find products whose image file doesn't exist on disk
  const needFix = prods.filter(p => {
    if (!(p.name||'').toLowerCase().includes('urban gear')) return false;
    if (!p.image) return true;
    const fullPath = path.join(process.cwd(), p.image);
    return !fs.existsSync(fullPath);
  });
  
  console.log('\nProducts with missing image files:', needFix.length);
  needFix.forEach(p => console.log('  ', p.name, '->', p.image));
})();
