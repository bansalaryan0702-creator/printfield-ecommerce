import fs from 'fs';
import path from 'path';

const productsPath = path.join(process.cwd(), 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

let updated = 0;
let skipped = 0;

for (const product of products) {
  if (!product.slug || product.slug.trim() === '') {
    product.slug = generateSlug(product.name);
    updated++;
  } else {
    skipped++;
  }
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
console.log(`Done. Updated: ${updated}, Already had slug: ${skipped}, Total: ${products.length}`);
