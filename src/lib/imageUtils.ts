export function isProductImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase().trim();
  
  // Exclude banner GIF, loader gifs, and svg icons
  if (
    u.endsWith('.gif') ||
    u.includes('loader.gif') ||
    u.includes('1767607948') ||
    u.includes('how-innovation-works') ||
    u.includes('matt-ridley')
  ) {
    return false;
  }
  
  // Exclude ONLY very obvious junk, not words that could be product types (like logo, icon, banner, avatar)
  const isGarbage = 
    u.includes('facebook') ||
    u.includes('twitter') ||
    u.includes('instagram') ||
    u.includes('linkedin') ||
    u.includes('youtube') ||
    u.includes('visa') ||
    u.includes('mastercard') ||
    u.includes('amex') ||
    u.includes('trustpilot');
    
  return !isGarbage;
}

export function getImageSignature(url: string): string {
  if (!url) return '';
  let clean = url.split('?')[0].trim();
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}
  clean = clean.toLowerCase();

  const parts = clean.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '').trim();

  const numbers = clean.match(/\d{6,}/g) || [];
  const slug = nameWithoutExt.replace(/[\s_%+\-]+/g, '-').trim();

  if (numbers.length > 0) {
    return `sig-num-${numbers.sort().join('-')}-${slug}`;
  }

  if (slug && !['1', '2', '3', '4', '5', 'image', 'img', 'photo', 'product'].includes(slug)) {
    return `sig-slug-${slug}`;
  }

  const pathWithoutDomain = parts.slice(3).join('/');
  return `sig-path-${pathWithoutDomain}`;
}

export function cleanAndDeduplicateImages(urls: (string | null | undefined)[]): string[] {
  const seenSignatures = new Set<string>();
  const seenExactUrls = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const url = rawUrl.trim();
    if (!url || !isProductImage(url)) continue;

    let exactKey = url.split('?')[0].trim();
    try {
      exactKey = decodeURIComponent(exactKey);
    } catch (e) {}
    exactKey = exactKey.toLowerCase();

    if (seenExactUrls.has(exactKey)) continue;

    // For uploaded local files (/uploads/...), preserve exact files without signature deduplication
    if (url.includes('/uploads/') || url.startsWith('data:')) {
      seenExactUrls.add(exactKey);
      uniqueUrls.push(toS3Url(url));
      continue;
    }

    const sig = getImageSignature(url);
    if (sig && seenSignatures.has(sig)) continue;

    if (sig) seenSignatures.add(sig);
    seenExactUrls.add(exactKey);
    uniqueUrls.push(url);
  }

  return uniqueUrls;
}

export function getFallbackImage(product?: { name?: string | null; category?: string | null; subCategory?: string | null } | null): string {
  const label = product?.name || product?.category || 'Product';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23f3f4f6" width="400" height="400"/><text fill="%239ca3af" font-family="system-ui,sans-serif" font-size="16" font-weight="600" text-anchor="middle" x="200" y="190">${encodeURIComponent(label.slice(0, 30))}</text><text fill="%23d1d5db" font-family="system-ui,sans-serif" font-size="40" text-anchor="middle" x="200" y="230">&#x1f4f7;</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

export function getFeaturedImage(product: { image?: string | null; images?: any; name?: string | null; category?: string | null; subCategory?: string | null } | null | undefined): string {
  const fallback = getFallbackImage(product);
  if (!product) return fallback;

  let gallery: string[] = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) gallery = parsed.filter(img => typeof img === 'string');
      } catch (e) {
        if (product.images.trim()) gallery = [product.images.trim()];
      }
    } else if (Array.isArray(product.images)) {
      gallery = product.images.filter(img => typeof img === 'string');
    }
  }

  const pAny = product as any;
  const main = (
    (typeof pAny?.image === 'string' && pAny.image) ||
    (typeof pAny?.featured_image_url === 'string' && pAny.featured_image_url) ||
    (typeof pAny?.image_url === 'string' && pAny.image_url) ||
    (typeof pAny?.imageUrl === 'string' && pAny.imageUrl) ||
    (typeof pAny?.featuredImage === 'string' && pAny.featuredImage) ||
    ''
  ).trim();

  // Collect all available image URLs for this product
  const allCandidates = [main, ...gallery]
    .map(u => (typeof u === 'string' ? u.trim() : ''))
    .filter(u => u.length > 5 && (u.startsWith('http') || u.startsWith('/')));

  if (allCandidates.length === 0) return fallback;

  // Filter candidates that pass isProductImage
  let validCandidates = allCandidates.filter(u => isProductImage(u));
  validCandidates = cleanAndDeduplicateImages(validCandidates);
  
  const isApparel = ["Apparel", "Clothing & Bags", "Custom Apparel", "T-Shirts", "Corporate Uniforms"].includes(product.category || "") || (product.name && (String(product.name || '').toLowerCase().includes("t-shirt") || String(product.name || '').toLowerCase().includes("polo") || String(product.name || '').toLowerCase().includes("hoodie")));
  if (isApparel && validCandidates.length >= 2) {
    const temp = validCandidates[0];
    validCandidates[0] = validCandidates[1];
    validCandidates[1] = temp;
  }

  if (validCandidates.length > 0) {
    return toS3Url(validCandidates[0]);
  }
  return toS3Url(fallback);
}


export const S3_BASE_URL = 'https://printfielddigital.s3.ap-south-1.amazonaws.com';

export function toS3Url(path: string | null | undefined): string {
  if (!path) return path || '';
  if (path.startsWith('/uploads/')) return `${S3_BASE_URL}${path}`;
  return path;
}

export function getOptimizedImage(url: string | null | undefined, width: number): string | null | undefined {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return toS3Url(url);
  if (url.includes('printo-s3.dietpixels.net') && !url.includes('w=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}`;
  }
  return url;
}
