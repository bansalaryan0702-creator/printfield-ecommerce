const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});
const s3BucketName = process.env.AWS_S3_BUCKET || '';

async function run() {
  const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/products.json' }));
  const str = await getRes.Body.transformToString();
  const prods = JSON.parse(str);
  
  const filtered = prods.filter(p => {
    let hasStock = false;
    if (p.image && typeof p.image === 'string' && p.image.includes('unsplash.com')) hasStock = true;
    if (p.images) {
      let imgs = p.images;
      if (typeof imgs === 'string') {
        try { imgs = JSON.parse(imgs); } catch(e){}
      }
      if (Array.isArray(imgs)) {
        for(const img of imgs) {
          if (img && typeof img === 'string' && img.includes('unsplash.com')) hasStock = true;
        }
      }
    }
    return !hasStock;
  });
  
  console.log(`Original: ${prods.length}, Filtered: ${filtered.length}, Deleted: ${prods.length - filtered.length}`);
  
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketName,
    Key: 'database/products.json',
    Body: JSON.stringify(filtered),
    ContentType: 'application/json'
  }));
  
  // Also update db.json
  const dbRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/db.json' }));
  const dbStr = await dbRes.Body.transformToString();
  const dbData = JSON.parse(dbStr);
  dbData.products = filtered;
  dbData.catalogueItems = filtered.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    sellingPrice: p.price,
    category: p.category,
    subCategory: p.subCategory,
    imageUrl: p.image,
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images
  }));
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketName,
    Key: 'database/db.json',
    Body: JSON.stringify(dbData, null, 2),
    ContentType: 'application/json'
  }));
  
  console.log('Done!');
}
run().catch(console.error);
