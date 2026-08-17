import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(__dirname, '../data/products.json');
const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const COLOR_WORDS = [
  'gold', 'silver', 'bronze', 'black', 'white', 'blue', 'red', 'green',
  'rose gold', 'copper', 'chrome', 'wooden', 'piano', 'brown', 'pink',
  'yellow', 'cream', 'platinum', 'antique', 'matte', 'glossy', 'marble',
  'natural', 'dark', 'light'
];

function stripColorFromName(name: string): string {
  let base = name.replace(/\s+Trophy$/i, '').trim();
  for (const color of COLOR_WORDS) {
    const regex = new RegExp(`\\b${color}\\b`, 'gi');
    base = base.replace(regex, '').replace(/\s+/g, ' ').trim();
  }
  return base.replace(/[\s-]+$/, '').trim();
}

const COLOR_HEX_MAP: Record<string, string> = {
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'black': '#000000',
  'white': '#FFFFFF',
  'blue': '#0066CC',
  'red': '#CC0000',
  'green': '#008000',
  'rose gold': '#B76E79',
  'copper': '#B87333',
  'chrome': '#DBE4EB',
  'brown': '#8B4513',
  'pink': '#FFC0CB',
  'yellow': '#FFD700',
  'cream': '#FFFDD0',
  'platinum': '#E5E4E2',
  'antique': '#C8A882',
  'matte': '#808080',
  'glossy': '#C0C0C0',
  'marble': '#E8E0D8',
  'natural': '#D2B48C',
  'dark': '#333333',
  'light': '#E8E8E8',
  'piano': '#1A1A1A',
  'wooden': '#8B6914'
};

function extractColorFromName(name: string): string | null {
  const lower = name.toLowerCase();
  for (const color of COLOR_WORDS) {
    if (lower.includes(color)) return color;
  }
  return null;
}

// Group trophies by base model
const groups: Record<string, any[]> = {};
const trophyProducts = products.filter((p: any) => {
  const cat = (p.category || '').toLowerCase();
  return cat === 'trophies' || cat === 'trophy';
});

const nonTrophy = products.filter((p: any) => {
  const cat = (p.category || '').toLowerCase();
  return cat !== 'trophies' && cat !== 'trophy';
});

console.log(`Total products: ${products.length}`);
console.log(`Trophy products: ${trophyProducts.length}`);
console.log(`Non-trophy products: ${nonTrophy.length}`);

for (const p of trophyProducts) {
  const base = stripColorFromName(p.name);
  if (!groups[base]) groups[base] = [];
  groups[base].push(p);
}

const mergedTrophies: any[] = [];
let mergedCount = 0;
let keptCount = 0;

for (const [baseName, variants] of Object.entries(groups)) {
  if (variants.length === 1) {
    // Single product, keep as-is
    mergedTrophies.push(variants[0]);
    keptCount++;
    continue;
  }

  // Multiple variants - merge into one
  const primary = { ...variants[0] };
  const colors: any[] = [];
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const v of variants) {
    const colorName = extractColorFromName(v.name) || v.name;
    const hex = COLOR_HEX_MAP[colorName] || '#808080';
    colors.push({
      name: colorName.charAt(0).toUpperCase() + colorName.slice(1),
      hex,
      image: v.image || (v.images && v.images[0]) || ''
    });

    if (v.price < minPrice) minPrice = v.price;
    if (v.price > maxPrice) maxPrice = v.price;
  }

  // Deduplicate colors by name
  const seenColors = new Set<string>();
  const uniqueColors = colors.filter(c => {
    const key = c.name.toLowerCase();
    if (seenColors.has(key)) return false;
    seenColors.add(key);
    return true;
  });

  primary.colors = uniqueColors;
  
  // If prices differ, use the lowest as base price
  if (minPrice !== maxPrice) {
    primary.price = minPrice;
  }

  // Clean up name - remove color from the merged product name
  primary.name = baseName.replace(/\s+Trophy$/i, '').trim() + ' Trophy';
  
  // Update description to mention available colors
  const colorNames = uniqueColors.map(c => c.name).join(', ');
  primary.description = `${primary.name} - Premium quality trophy available in ${colorNames}.`;
  primary.cardDescription = `High-quality trophy for awards and recognition. Available in ${colorNames}.`;

  // Regenerate slug
  primary.slug = primary.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  mergedTrophies.push(primary);
  mergedCount++;
  console.log(`Merged: "${baseName}" (${variants.length} variants) → colors: [${uniqueColors.map(c => c.name).join(', ')}]`);
}

const finalProducts = [...nonTrophy, ...mergedTrophies];
console.log(`\nFinal: ${finalProducts.length} products (${mergedCount} merged groups, ${keptCount} single trophies)`);

// Reorder: trophies first (sorted by name), then others
const sortedTrophies = mergedTrophies.sort((a: any, b: any) => a.name.localeCompare(b.name));
const final = [...nonTrophy, ...sortedTrophies];

fs.writeFileSync(DATA_PATH, JSON.stringify(final, null, 2));
console.log(`\nSaved to ${DATA_PATH}`);
console.log(`Products reduced by ${products.length - final.length} (from ${products.length} to ${final.length})`);
