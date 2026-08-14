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

// Known file IDs and names from the Drive folder
const FILES = [
  { name: 'Urban Gear Senate', id: '13hfAuBjs_D9yVUz_qyK-PLl7Kp8dQNJf' },
  { name: 'Urban Gear Black', id: '11pGOIVTonCODG7sjUvE-tSStBCCXyQDi' },
  { name: 'Urban Gear Athena', id: '1iOBTKsGfCIjyiWgfSORhFueNTJcARuJU' },
  { name: 'Urban Gear Bambu', id: '1fuXmGLSTdk4XBzWQODyQKdUtHRldMlcy' },
  { name: 'Urban Gear Basic', id: '1IaL7ZXUGPeOw4WyiINWCcFIyLDlB7Ozg' },
  { name: 'Urban Gear Capri-Rpet', id: '10dscpTmC31uEuTKFQpbS-I2aIE4YaOC1' },
  { name: 'Urban Gear Capri', id: '1CqU5qt6wNqDicj5mewiVWL4xpC690cmw' },
  { name: 'Urban Gear Champ', id: '16KTpPs2e4sPceWc9zH1GXwMINEcb4XVm' },
  { name: 'Urban Gear Classic', id: '1T2bHE5JRlD1KGOPG9Yes0ces07m87E7K' },
  { name: 'Urban Gear Croco', id: '1IZ8N6REL4u9jnrXcYXQWjvE_PU7GaxsS' },
  { name: 'Urban Gear Dual', id: '1YrpJcriS2i1jcalVCEBMzs2MaeMB64NB' },
  { name: 'Urban Gear Eco Kraft 2.0', id: '1vHr-1UuQUhJXJKqTnoRcOXkwrrkQrxlZ' },
  { name: 'Urban Gear Eco Notes', id: '1G3o7aF827cFmgo3me86E3Do-yB39oqFs' },
  { name: 'Urban Gear Elegant', id: '17ufvGrUVuBdABgfE97vHvfVDCOXU2Hxz' },
  { name: 'Urban Gear Element Jute', id: '1j3w_1PAEtuOo6-zCysT7Gcv3uJ4F2Iz1' },
  { name: 'Urban Gear Element', id: '13SPzWBtvMEMPBMRpXYTH__W6doyAZh-1' },
  { name: 'Urban Gear Flip', id: '1-BtDIvezhVyZDqyWU6oV7W5xNQHbWcWY' },
  { name: 'Urban Gear Fusion', id: '1FkBOwTDAc1B33xZKxWpV4L0QHJf6ZfQ' },
  { name: 'Urban Gear Hardy Premium', id: '1Ya7QRSUtaigvMH62a9Hc2MKtKWUh9EmZ' },
  { name: 'Urban Gear Korki Notes', id: '1NtSlKjWQV447spJ2OpzjdAztaDiEDx1v' },
  { name: 'Urban Gear Korsa 2.0', id: '1nOAy41z2ztL5mS8Zng7AyyKNEJ0vvzab' },
  { name: 'Urban Gear Kraft-Spiral', id: '1ip-iVhbWtgn54W_NwQsb_L30xRaL3XxB' },
  { name: 'Urban Gear Kriss', id: '1bky9yC1xR9rvu_kp65zd2FzQITWIacDl' },
  { name: 'Urban Gear Lumber Notes', id: '1U6spfMYTmmjtZED09-bKWkT2kLFwxT5W' },
  { name: 'Urban Gear Milky Spiral', id: '1-fjAzH_jNqpl1SkAmLPoLyc4-Xguc7sB' },
  { name: 'Urban Gear Milky', id: '1f5TfGAnfgiDoK_2icWsFDwkLmEAHlPa9' },
  { name: 'Urban Gear Mystic', id: '1vf8rQoYJsOXbfZ8X9TiuAaXBNX32drHr' },
  { name: 'Urban Gear Optima', id: '1fQeBNjnIR4iJJKxVZ9G5P3Q9G8bKcZzQ' },
  { name: 'Urban Gear Polygon', id: '1Mii3XQcy6v18jLWm101kWLuuunXthUFt' },
  { name: 'Urban Gear Primo', id: '1DLyglFWB_614gCXWSKRIRW5CMCzBJGC3' },
  { name: 'Urban Gear Primus', id: '16bvZhPGeD9UWR0J3M7cBQ5G8K3fKzZzQ' },
  { name: 'Urban Gear Regal', id: '1FpgOi6YlPWWoUG3BkxVrIKPOwEsn5vIg' },
  { name: 'Urban Gear Roca', id: '15qPh7Ioa5_T00kH3tCDbAEe1hbmtFHRa' },
  { name: 'Urban Gear Rpet-Spiral', id: '1kyA-DTYPYhEk0AlS7UqL7gURF09ujVB9' },
  { name: 'Urban Gear Slant', id: '1aLCS0jAPMUSZJgtPo0GphLmH4i11kp2z' },
  { name: 'Urban Gear Softy', id: '14lEmf8VuGxYot8ipOWataH-Y8OQz_xDN' },
  { name: 'Urban Gear Strap-Cork', id: '1zBLJIjdF8QbXiZuhlXDGzMXiYfKtOWMi' },
  { name: 'Urban Gear Stripe', id: '1SNABFUcM1WYm1Lv7bXnBkixaTofgG-ZB' },
  { name: 'Urban Gear Sugar', id: '1AtwuJa1Xi2E-mYX8lMhWexcigQosdcUt' },
  { name: 'Urban Gear Traveller 2.0', id: '1G8oVmzuWixE2nbLQBfaFh5H4EN8JAIOm' },
  { name: 'Urban Gear Traveller', id: '1558p59Qs4bnwgpTecXFNq8Ab8csDfRB2' },
  { name: 'Urban Gear Vetor', id: '18nHvr4ff0o5iRVGgvziPHUIqfNvwK5A2' },
  { name: 'Urban Gear Vogue', id: '1_ONB3TuSlKYoohrg88b6afphw6aKwK8M' },
  { name: 'Urban Gear Wrinkle', id: '1fsOqmIxmB514L9tClf8CklydZ4WIzFj7' },
  { name: 'Urban Gear Zigy pro', id: '18N72Z3v-tJQTgW1ut7K4MkT3lgdGmJy8' },
];

(async () => {
  const prods = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  let updated = 0;
  
  for (const file of FILES) {
    const imgName = file.name.replace(/^Urban Gear\s+/i, '').replace(/[-_]/g, ' ').toLowerCase().trim();
    
    // Find matching product
    const match = prods.find(p => {
      const pname = (p.name || '').toLowerCase().replace('urban gear', '').replace(/[.\-_*]/g, ' ').replace(/\s+/g, ' ').trim();
      return pname === imgName || pname.includes(imgName) || imgName.includes(pname);
    });
    
    if (!match) {
      console.log(`? No match for "${file.name}"`);
      continue;
    }
    
    try {
      const url = `https://drive.google.com/uc?export=download&id=${file.id}`;
      console.log(`Downloading: ${file.name} -> "${match.name}"`);
      const buffer = await download(url);
      if (buffer.length < 5000) { console.log('  Too small, skipping'); continue; }
      
      const localPath = await optimizeAndSave(buffer, match.id + '-drive-diary');
      match.image = localPath;
      if (!Array.isArray(match.images)) match.images = [localPath];
      else match.images[0] = localPath;
      updated++;
      console.log(`  ✓ ${(buffer.length/1024).toFixed(0)} KB -> ${localPath}`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
  }
  
  console.log(`\nUpdated ${updated} products`);
  fs.writeFileSync('./data/products.json', JSON.stringify(prods, null, 2));
  await s3.send(new PutObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json', Body: JSON.stringify(prods, null, 2), ContentType: 'application/json' }));
  console.log('Saved to local and S3');
})();
