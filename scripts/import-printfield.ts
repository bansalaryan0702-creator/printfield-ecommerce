import https from 'https';
import fs from 'fs';
import path from 'path';

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoem92a3F4bGRvdGJ3cHVtcXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzc4OTYsImV4cCI6MjA4NjY1Mzg5Nn0.cgiEcjuTs-PTWfR2h5tT16Fwm7TXHH1kGs0nhEPpUyM';

function fetchTable(table: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const url = 'https://ghzovkqxldotbwpumqzh.supabase.co/rest/v1/' + table + '?select=*';
    const req = https.request(url, {
      headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

async function main() {
  console.log('Fetching live product catalog from Printfield Online database...');
  const categories = await fetchTable('shop_categories');
  const subCategories = await fetchTable('shop_sub_categories');
  const products = await fetchTable('shop_products');
  const variationTypes = await fetchTable('variation_types');
  const variationValues = await fetchTable('variation_values');
  const productPricing = await fetchTable('product_pricing');
  const productVarTypes = await fetchTable('product_variation_types');
  const productDimensions = await fetchTable('product_dimensions');
  const productVariants = await fetchTable('product_variants');

  const catMap: Record<string, string> = Object.fromEntries(categories.map((c: any) => [c.id, c.name]));
  const subCatMap: Record<string, string> = Object.fromEntries(subCategories.map((s: any) => [s.id, s.name]));
  const varTypeMap: Record<string, string> = Object.fromEntries(variationTypes.map((v: any) => [v.id, v.name]));
  
  const varValGroup: Record<string, any[]> = {};
  variationValues.forEach((v: any) => {
    if (!varValGroup[v.variation_type_id]) varValGroup[v.variation_type_id] = [];
    varValGroup[v.variation_type_id].push(v);
  });

  const formattedProducts: any[] = [];

  for (const p of products) {
    if (p.is_deleted) continue;

    const catName = catMap[p.category_id] || 'General Printing';
    const subCatName = subCatMap[p.sub_category_id] || undefined;

    const pPricing = productPricing.filter((pr: any) => pr.product_id === p.id && !pr.is_deleted);
    let price = 0;
    let minQty = 1;
    if (pPricing.length > 0) {
      const validPrices = pPricing.filter((pr: any) => pr.price_inr > 0).map((pr: any) => pr.price_inr);
      if (validPrices.length > 0) price = Math.min(...validPrices);
      const moqs = pPricing.map((pr: any) => pr.moq_quantity).filter((q: any) => q && q > 0);
      if (moqs.length > 0) minQty = Math.min(...moqs);
    }

    const gallery = Array.isArray(p.gallery_image_urls) ? p.gallery_image_urls.filter(Boolean) : [];
    const mainImg = p.featured_image_url || gallery[0] || 'https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=800&auto=format&fit=crop';

    const pVariants = productVariants.filter((v: any) => v.product_id === p.id && !v.is_deleted);
    const colorsList: any[] = [];
    const variations: any[] = [];

    if (pVariants.length > 0) {
      // Map colors and variations directly from active variants of this product
      const colorsMap = new Map();
      const variationsMap = new Map();

      for (const v of pVariants) {
        const comb = v.variation_combination || {};
        for (const [typeId, valId] of Object.entries(comb)) {
          const vtName = (varTypeMap[typeId] || '').trim();
          if (vtName) {
            const val = variationValues.find((vv: any) => vv.id === valId);
            if (val) {
              const optName = (val.label || val.value || val.name || '').trim();
              if (optName) {
                if (vtName.toLowerCase().includes('color')) {
                  const existing = colorsMap.get(optName.toLowerCase());
                  const imageUrl = v.variant_image_url || (existing ? existing.image : null);
                  colorsMap.set(optName.toLowerCase(), {
                    name: optName,
                    hex: val.color_hex || '#000000',
                    image: imageUrl
                  });
                } else {
                  if (!variationsMap.has(typeId)) {
                    variationsMap.set(typeId, {
                      id: vtName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      name: vtName,
                      options: new Set()
                    });
                  }
                  variationsMap.get(typeId).options.add(optName);
                }
              }
            }
          }
        }
      }

      // Convert maps to formatted array structures
      for (const c of colorsMap.values()) {
        colorsList.push({
          name: c.name,
          hex: c.hex,
          image: c.image || mainImg
        });
      }

      for (const vItem of variationsMap.values()) {
        variations.push({
          id: vItem.id,
          name: vItem.name,
          options: Array.from(vItem.options).map((o) => ({ name: o, price: 0 }))
        });
      }

    } else {
      // Fallback: Use product variation type configurations if there are no specific active variants
      const pVarTypeEntries = productVarTypes.filter((pv: any) => pv.product_id === p.id);
      const fallbackColors = [];
      const fallbackVariations = [];

      for (const pv of pVarTypeEntries) {
        const vtName = (varTypeMap[pv.variation_type_id] || '').trim();
        const vals = varValGroup[pv.variation_type_id] || [];
        if (vtName && vals.length > 0) {
          if (vtName.toLowerCase().includes('color')) {
            vals.forEach((val) => {
              fallbackColors.push({
                name: (val.label || val.value || val.name || '').trim(),
                hex: val.color_hex || '#000000',
                image: mainImg
              });
            });
          } else {
            fallbackVariations.push({
              id: vtName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: vtName,
              options: vals.map((val) => ({ name: (val.label || val.value || val.name || '').trim(), price: 0 }))
            });
          }
        }
      }

      // Deduplicate fallback colors list
      const seenColorNames = new Set();
      for (const c of fallbackColors) {
        const norm = c.name.toLowerCase();
        if (norm && !seenColorNames.has(norm)) {
          seenColorNames.add(norm);
          colorsList.push(c);
        }
      }

      // Deduplicate fallback variation options
      for (const v of fallbackVariations) {
        const uniqueOpts = [];
        const seenOpts = new Set();
        for (const o of v.options) {
          const norm = o.name.toLowerCase();
          if (norm && !seenOpts.has(norm)) {
            seenOpts.add(norm);
            uniqueOpts.push(o);
          }
        }
        v.options = uniqueOpts;
        variations.push(v);
      }
    }

    // Size Dimensions from table
    const dims = productDimensions.filter((d: any) => d.product_id === p.id && !d.is_deleted);
    if (dims.length > 0) {
      const dimOpts = [];
      const seenDimOpts = new Set();
      for (const d of dims) {
        const label = (d.label || '').trim();
        const norm = label.toLowerCase();
        if (norm && !seenDimOpts.has(norm)) {
          seenDimOpts.add(norm);
          dimOpts.push({ name: label, price: 0 });
        }
      }
      if (dimOpts.length > 0) {
        const hasSizeVar = variations.some(v => v.name.toLowerCase().includes('size') || v.name.toLowerCase().includes('dimension'));
        if (!hasSizeVar) {
          variations.push({
            id: 'size-dimensions',
            name: 'Size / Dimensions',
            options: dimOpts
          });
        }
      }
    }

    const cleanDesc = cleanHtml(p.description);
    const shortDesc = p.short_description || (cleanDesc ? cleanDesc.slice(0, 150) + '...' : p.name);

    const features = [];
    if (cleanDesc) {
      const lines = cleanDesc.split('\n').map(l => l.trim()).filter(Boolean);
      for (const l of lines) {
        if (l.startsWith('•') || l.startsWith('-') || l.includes(':')) {
          const cleanLine = l.replace(/^[•\-]\s*/, '').trim();
          if (cleanLine.length > 5 && cleanLine.length < 100) {
            features.push(cleanLine);
          }
        }
      }
    }
    if (features.length === 0) {
      features.push('High definition custom printing', 'Premium durable substrate', 'Fast turn-around time');
    }

    const variantImageUrls = pVariants.map((v) => v.variant_image_url).filter(Boolean);
    const allImages = Array.from(new Set([mainImg, ...variantImageUrls, ...gallery]));

    formattedProducts.push({
      id: p.slug || ('printfield-' + p.id),
      name: p.name,
      category: catName,
      subCategory: subCatName,
      price: price > 0 ? price : 299,
      minQty: minQty,
      qtyMultiple: 1,
      image: mainImg,
      images: allImages,
      description: cleanDesc || shortDesc,
      cardDescription: shortDesc,
      features: features.slice(0, 6),
      colors: colorsList.length > 0 ? colorsList : undefined,
      variations: variations.length > 0 ? variations : undefined,
      isBestseller: p.is_featured || false
    });
  }

  console.log(`Successfully processed ${formattedProducts.length} authentic products from Printfield Online.`);

  const categoriesList = categories.map((c: any) => ({
    id: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: c.name,
    icon: c.name.toLowerCase().includes('apparel') ? 'shirt' :
          c.name.toLowerCase().includes('card') ? 'contact' :
          c.name.toLowerCase().includes('gift') || c.name.toLowerCase().includes('drink') ? 'gift' :
          c.name.toLowerCase().includes('sign') || c.name.toLowerCase().includes('banner') ? 'signpost' :
          c.name.toLowerCase().includes('promotional') ? 'megaphone' : 'package',
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=600&auto=format&fit=crop'
  }));

  const fileContent = `export interface ProductColor {
  name: string;
  hex: string;
  image: string;
  mockupImage?: string;
}

export interface ProductVariationOption {
  name: string;
  price: number;
}

export interface ProductVariation {
  id: string;
  name: string;
  options: ProductVariationOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  isBestseller?: boolean;
  minQty?: number;
  qtyMultiple?: number;
  image: string;
  images?: string[];
  description: string;
  cardDescription?: string;
  isDisabled?: boolean;
  features: string[];
  colors?: ProductColor[];
  variations?: ProductVariation[];
}

export const Categories = ${JSON.stringify(categoriesList, null, 2)};

export const PopularProducts: Product[] = ${JSON.stringify(formattedProducts, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), 'src/data/products.ts'), fileContent);
  console.log(`Updated src/data/products.ts with ${formattedProducts.length} Printfield products.`);
}

main().catch(err => {
  console.error('Error importing products:', err);
  process.exit(1);
});
