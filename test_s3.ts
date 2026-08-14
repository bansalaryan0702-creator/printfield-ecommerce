import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

async function run() {
  try {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: 'printfielddigital', Key: 'database/products.json' }));
    const str = await res.Body.transformToString();
    const parsed = JSON.parse(str);
    console.log("products.json length:", parsed.length);
  } catch (e) { console.error("Error products.json:", e.message); }
  
  try {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: 'printfielddigital', Key: 'database/db.json' }));
    const str = await res.Body.transformToString();
    const parsed = JSON.parse(str);
    console.log("db.json products length:", parsed.products ? parsed.products.length : 'none');
    console.log("db.json catalogueItems length:", parsed.catalogueItems ? parsed.catalogueItems.length : 'none');
  } catch (e) { console.error("Error db.json:", e.message); }
}
run();
