import fs from 'fs';
import path from 'path';

const productsPath = path.join(process.cwd(), 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

const LOCATION_PHRASES = [
  'Whitefield, Bangalore 560066',
  'Whitefield, Bengaluru',
  'near Whitefield, Bangalore',
  'Whitefield Bangalore',
  'Bengaluru 560066',
];

const DELIVERY_PHRASES = [
  'Fast Whitefield delivery',
  'Quick Bangalore delivery',
  'Same-day Whitefield delivery',
  'Free Whitefield delivery',
  'Express Bengaluru delivery',
];

const CTAS = [
  'Shop now!',
  'Order today!',
  'Get a free quote!',
  'Buy online now!',
  'Order now!',
  'Shop at Printfield!',
  'Place your order!',
  'Buy now!',
];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  // Try to cut at last space before max
  const cut = str.substring(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max - 20) return cut.substring(0, lastSpace) + '.';
  return cut.substring(0, max - 3).trim() + '...';
}

function getUseCase(category: string, subCategory?: string): string {
  const cat = (category || '').toLowerCase();
  const sub = (subCategory || '').toLowerCase();
  if (cat === 'trophies') return 'awards';
  if (cat.includes('signage')) return 'events';
  if (cat === 'corporate gifts') {
    if (sub.includes('tech')) return 'corporate gifts';
    if (sub.includes('dair')) return 'office gifts';
    return 'corporate gifts';
  }
  if (cat === 'apparel') return 'team wear';
  if (cat === 'drinkware') return 'gifts';
  if (cat === 'business stationery') return 'branding';
  if (cat === 'personalised gifts') return 'gifting';
  if (cat === 'menu covers') return 'restaurants';
  return 'branding';
}

function getMaterialShort(name: string, category: string): string {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (c === 'trophies') {
    if (n.includes('wood')) return 'premium wood';
    if (n.includes('crystal') || n.includes('glass')) return 'crystal';
    if (n.includes('metal') || n.includes('brass') || n.includes('silver') || n.includes('gold')) return 'metal';
    if (n.includes('acrylic') || n.includes('fiber')) return 'acrylic';
    if (n.includes('marble')) return 'marble';
    return 'quality material';
  }
  if (c === 'apparel') {
    if (n.includes('polo')) return 'cotton pique';
    if (n.includes('hoodie')) return 'fleece cotton';
    if (n.includes('cap')) return 'cotton twill';
    return 'premium fabric';
  }
  if (c === 'drinkware') {
    if (n.includes('bamboo')) return 'eco bamboo';
    if (n.includes('steel')) return 'stainless steel';
    if (n.includes('tritan')) return 'Tritan plastic';
    return 'quality material';
  }
  return 'quality material';
}

function extractSize(name: string): string {
  const match = name.match(/(\d+(?:\.\d+)?(?:\s*(?:inch|ml|oz|cm|")))/i);
  return match ? match[1].trim() : '';
}

// ===== TITLE GENERATION =====
function generateTitle(product: any, index: number): string {
  const name = product.name || 'Custom Product';
  const category = product.category || '';
  const subCategory = product.subCategory || '';
  const cat = category.toLowerCase();
  const size = extractSize(name);
  const sizeStr = size ? ` ${size}` : '';

  // Make unique by appending product-specific detail
  const modelMatch = name.match(/([A-Z]{2,}\d{2,})/);
  const model = modelMatch ? modelMatch[1] : '';

  const templateIndex = index % 8;

  if (cat === 'trophies') {
    const suffix = model ? ` ${model}` : '';
    const templates = [
      `Custom${suffix ? '' : ' '} ${name}${sizeStr} Trophy - Awards | Printfield`,
      `Buy ${name}${sizeStr} Trophy Online | Printfield`,
      `${name} Trophy${sizeStr} - Engraving | Printfield`,
      `${name}${sizeStr} Trophy - Corporate Awards | Printfield`,
      `Premium ${name}${sizeStr} Trophy | Printfield`,
      `Order ${name}${sizeStr} Trophy | Printfield`,
      `${name} Trophy${sizeStr} - Recognition | Printfield`,
      `Custom ${name} Trophy Bangalore | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat.includes('signage')) {
    const templates = [
      `Custom ${name} - Signage | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Printing | Printfield`,
      `Order ${name} - Fast Delivery | Printfield`,
      `${name} - Events & Promotions | Printfield`,
      `${name} - Whitefield | Printfield`,
      `Premium ${name} Printing | Printfield`,
      `Buy ${name} - Signage | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat === 'corporate gifts') {
    const sub = subCategory.toLowerCase();
    const type = sub.includes('tech') ? 'Tech Gift' : sub.includes('dair') ? 'Diary' : 'Corporate Gift';
    const templates = [
      `Custom ${name} - ${type} | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Branded ${type} | Printfield`,
      `Order ${name} - ${type} | Printfield`,
      `${name} - ${type} Bangalore | Printfield`,
      `Custom ${name} | Printfield`,
      `${name} - Employee Gift | Printfield`,
      `Buy ${name} - Whitefield | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat === 'apparel') {
    const templates = [
      `Custom ${name} - Apparel | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Printing | Printfield`,
      `Order ${name} - Branded Apparel | Printfield`,
      `${name} - Custom Printing | Printfield`,
      `Buy ${name} Bangalore | Printfield`,
      `${name} - Team Wear | Printfield`,
      `Custom ${name} Whitefield | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat === 'drinkware') {
    const templates = [
      `Custom ${name} - Drinkware | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Branded Drinkware | Printfield`,
      `Order ${name} - Custom Print | Printfield`,
      `${name} - Corporate Gift | Printfield`,
      `Buy ${name} Bangalore | Printfield`,
      `${name} - Premium Mug | Printfield`,
      `Custom ${name} Whitefield | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat === 'business stationery') {
    const templates = [
      `Custom ${name} - Stationery | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Business Printing | Printfield`,
      `Order ${name} - Corporate | Printfield`,
      `${name} - Custom Print | Printfield`,
      `Buy ${name} - Office | Printfield`,
      `${name} - Stationery | Printfield`,
      `Custom ${name} Whitefield | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  if (cat === 'personalised gifts') {
    const templates = [
      `Custom ${name} - Gift | Printfield`,
      `Buy ${name} Online | Printfield`,
      `${name} - Printed Gift | Printfield`,
      `Order ${name} - Personalised | Printfield`,
      `${name} - Custom Gift | Printfield`,
      `Buy ${name} Whitefield | Printfield`,
      `${name} - Unique Gift | Printfield`,
      `Custom ${name} Printing | Printfield`,
    ];
    return truncate(pick(templates, templateIndex), 60);
  }

  const templates = [
    `Custom ${name} | Printfield`,
    `Buy ${name} Online | Printfield`,
    `${name} - Printing | Printfield`,
    `Order ${name} - Fast Delivery | Printfield`,
    `${name} - Custom Print | Printfield`,
    `Buy ${name} Whitefield | Printfield`,
    `${name} - Quality Print | Printfield`,
    `Custom ${name} at Printfield`,
  ];
  return truncate(pick(templates, templateIndex), 60);
}

// ===== DESCRIPTION GENERATION =====
function generateDescription(product: any, index: number): string {
  const name = product.name || 'Custom Product';
  const category = product.category || '';
  const cat = category.toLowerCase();
  const material = getMaterialShort(name, category);
  const useCase = getUseCase(category, product.subCategory);
  const size = extractSize(name);
  const sizeStr = size ? ` ${size}` : '';
  const cta = pick(CTAS, index);

  // 35% get location, 40% get delivery
  const getsLocation = (index % 100) < 35;
  const getsDelivery = (index % 100) < 40;

  const loc = getsLocation ? ` ${pick(LOCATION_PHRASES, index)}` : '';
  const del = getsDelivery ? ` ${pick(DELIVERY_PHRASES, index)}` : '';

  // Build description: keep it short so CTA always fits
  // Target: ~120 chars body + ~15 chars CTA = ~135 total
  let body: string;

  if (cat === 'trophies') {
    const templates = [
      `Buy ${name}${sizeStr} trophy${loc}. Premium ${material} for ${useCase}. Engraving`,
      `Order ${name}${sizeStr} trophy${loc}. Elegant ${material} award. Bulk pricing`,
      `Shop ${name}${sizeStr} trophy${loc}. Quality ${material}. Free engraving`,
      `${name}${sizeStr} trophy${loc}. Premium ${material} for ${useCase}`,
      `Custom ${name}${sizeStr} trophy${loc}. ${material.charAt(0).toUpperCase() + material.slice(1)} award`,
      `${name} - ${material} trophy${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else if (cat.includes('signage')) {
    const templates = [
      `Buy ${name}${loc}. Premium signage for ${useCase}. Durable`,
      `Order ${name}${loc}. High-quality print. Weather-resistant`,
      `Shop ${name}${loc}. Durable signage. Custom sizes`,
      `${name}${loc}. Quality sign for ${useCase}. Fast`,
      `Custom ${name}${loc}. Premium sign. Professional`,
      `${name} - signage${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else if (cat === 'corporate gifts') {
    const templates = [
      `Buy ${name}${loc}. Premium gift for ${useCase}. Branding`,
      `Order ${name}${loc}. Corporate gift. Bulk discounts`,
      `Shop ${name}${loc}. Gift for ${useCase}. Logo print`,
      `${name}${loc}. Corporate gift. Fast delivery`,
      `Custom ${name}${loc}. Gift for ${useCase}. Min 10 pcs`,
      `${name} - gift${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else if (cat === 'apparel') {
    const templates = [
      `Buy ${name}${loc}. Premium ${material} for ${useCase}. Print`,
      `Order ${name}${loc}. Comfortable ${material}. All sizes`,
      `Shop ${name}${loc}. Quality ${material}. Logo print`,
      `${name}${loc}. Premium ${material}. Bulk pricing`,
      `Custom ${name}${loc}. ${material.charAt(0).toUpperCase() + material.slice(1)}. Fast`,
      `${name} - ${material}${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else if (cat === 'drinkware') {
    const templates = [
      `Buy ${name}${loc}. Premium drinkware. Custom branding`,
      `Order ${name}${loc}. Quality drinkware. Logo print`,
      `Shop ${name}${loc}. Durable drinkware. Bulk orders`,
      `${name}${loc}. Premium drinkware for ${useCase}`,
      `Custom ${name}${loc}. Quality mug. Fast delivery`,
      `${name} - drinkware${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else if (cat === 'business stationery') {
    const templates = [
      `Buy ${name}${loc}. Premium stationery. Custom print`,
      `Order ${name}${loc}. High-quality print. Fast`,
      `Shop ${name}${loc}. Professional stationery`,
      `${name}${loc}. Quality stationery. Bulk pricing`,
      `Custom ${name}${loc}. Stationery. Quick delivery`,
      `${name} - stationery${loc} for ${useCase}`,
    ];
    body = pick(templates, templateIndex(index));
  } else {
    const templates = [
      `Buy ${name}${loc}. Premium quality. Custom printing`,
      `Order ${name}${loc}. High-quality. Fast delivery`,
      `Shop ${name}${loc}. Custom printing. Bulk orders`,
      `${name}${loc}. Quality product for ${useCase}`,
      `Custom ${name}${loc}. Premium. Quick turnaround`,
      `${name} - quality product${loc}`,
    ];
    body = pick(templates, templateIndex(index));
  }

  // Add delivery phrase if assigned
  let fullDesc = body;
  if (getsDelivery && del && !fullDesc.includes('delivery') && !fullDesc.includes('shipping')) {
    fullDesc += `. ${del}`;
  }

  // Always append CTA - truncate body first if needed to make room
  const ctaWithDot = `. ${cta}`;
  const maxBodyLen = 155 - ctaWithDot.length;
  if (fullDesc.length > maxBodyLen) {
    fullDesc = fullDesc.substring(0, maxBodyLen).replace(/[.\s]+$/, '');
  }
  fullDesc += ctaWithDot;

  return fullDesc;
}

function templateIndex(index: number): number {
  return index % 6;
}

// ===== MAIN =====
for (let i = 0; i < products.length; i++) {
  products[i].metaTitle = generateTitle(products[i], i);
  products[i].metaDescription = generateDescription(products[i], i);
}

// Deduplicate titles by appending product ID suffix if needed
const seenTitles = new Map<string, number>();
for (const product of products) {
  const t = product.metaTitle;
  if (seenTitles.has(t)) {
    const count = seenTitles.get(t)!;
    seenTitles.set(t, count + 1);
    // Append category hint to make unique
    const catHint = (product.category || '').substring(0, 3);
    product.metaTitle = truncate(t.replace(' | Printfield', ` ${catHint} | Printfield`), 60);
  } else {
    seenTitles.set(t, 1);
  }
}

// Stats
const titleSet = new Set(products.map((p: any) => p.metaTitle));
const titlesOver60 = products.filter((p: any) => p.metaTitle.length > 60).length;
const descsOver160 = products.filter((p: any) => p.metaDescription.length > 160).length;
const withLocation = products.filter((p: any) => /whitefield|560066|Bengaluru/i.test(p.metaDescription)).length;
const withCTA = products.filter((p: any) => /shop now|order today|get a free quote|buy online now|order now|shop at printfield|place your order|buy now/i.test(p.metaDescription)).length;
const withDelivery = products.filter((p: any) => /delivery|shipping/i.test(p.metaDescription)).length;

console.log(`Total products: ${products.length}`);
console.log(`Unique titles: ${titleSet.size}/${products.length}`);
console.log(`Titles > 60 chars: ${titlesOver60}`);
console.log(`Descriptions > 160 chars: ${descsOver160}`);
console.log(`With location keyword: ${withLocation} (${Math.round(withLocation/products.length*100)}%)`);
console.log(`With CTA: ${withCTA} (${Math.round(withCTA/products.length*100)}%)`);
console.log(`With delivery mention: ${withDelivery} (${Math.round(withDelivery/products.length*100)}%)`);

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
console.log('Saved to data/products.json');
