const { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
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
  const deletedFile = fs.readFileSync('./data/deleted_products.json', 'utf8');
  const deletedIds = JSON.parse(deletedFile);
  console.log(`Found ${deletedIds.length} deleted product IDs.`);
  
  const allKeysToDelete = new Set();
  
  for (const rawId of deletedIds) {
    if (!rawId) continue;
    
    const decodedId = decodeURIComponent(rawId);
    const prefixes = [
      `catalog-images/products/${rawId}/`,
      `catalog-images/products/${decodedId}/`,
      `products/${rawId}/`,
      `products/${decodedId}/`,
      `uploads/${rawId}/`,
      `uploads/${decodedId}/`
    ];

    for (const prefix of prefixes) {
      try {
        const listRes = await s3Client.send(new ListObjectsV2Command({
          Bucket: s3BucketName,
          Prefix: prefix
        }));
        if (listRes.Contents) {
          listRes.Contents.forEach(item => {
            if (item.Key) allKeysToDelete.add(item.Key);
          });
        }
      } catch (listErr) {
        // console.warn(`S3 prefix scan error for ${prefix}:`, listErr.message);
      }
    }
  }

  if (allKeysToDelete.size > 0) {
    console.log(`Permanently deleting ${allKeysToDelete.size} S3 objects for deleted products...`);
    for (const key of allKeysToDelete) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: key
        }));
      } catch (delErr) {
        console.warn(`Failed to delete S3 key ${key}:`, delErr);
      }
    }
    console.log('Finished deleting associated S3 images/files.');
  } else {
    console.log('No S3 objects found for these deleted products.');
  }

  // Also remove these products from db.json and products.json just in case they are still there
  console.log('Filtering remaining products...');
  
  const getRes = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: 'database/products.json' }));
  const str = await getRes.Body.transformToString();
  const prods = JSON.parse(str);
  
  const deletedSet = new Set(deletedIds.map(id => id.toLowerCase()));
  
  const filtered = prods.filter(p => !deletedSet.has(p.id.toLowerCase()));
  
  console.log(`Original: ${prods.length}, Filtered: ${filtered.length}, Remnants removed: ${prods.length - filtered.length}`);
  
  if (filtered.length < prods.length) {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3BucketName,
      Key: 'database/products.json',
      Body: JSON.stringify(filtered),
      ContentType: 'application/json'
    }));
    
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
  }
}
run().then(() => console.log('Done!')).catch(console.error);
