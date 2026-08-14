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
      uniqueUrls.push(url);
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
  const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=800&auto=format&fit=crop"; // Premium branding mockup with stationery

  if (!product) return DEFAULT_FALLBACK;

  const name = String(product.name || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const subCategory = String(product.subCategory || '').toLowerCase();

  // 1. Match by product name keywords
  if (name.includes('power') || name.includes('display') || name.includes('charger') || name.includes('bank') || name.includes('gear') || name.includes('tech') || name.includes('gadget') || name.includes('electronic') || name.includes('device') || name.includes('usb') || name.includes('battery')) {
    return "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop"; // Sleek tech power bank & gadget mockup
  }
  if (name.includes('frame') || name.includes('photo frame') || name.includes('wall frame') || name.includes('wall art') || name.includes('canvas print')) {
    return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop"; // Modern minimalist wall photo frame mockup
  }
  if (name.includes('notebook') || name.includes('diary') || name.includes('planner') || name.includes('booklet') || name.includes('brochure') || name.includes('pamphlet') || name.includes('catalog') || name.includes('stationery')) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop"; // Premium stacked notebooks/booklets mockup
  }
  if (name.includes('mug') || name.includes('cup') || name.includes('tumbler') || name.includes('bottle') || name.includes('flask') || name.includes('drinkware')) {
    return "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop"; // Premium ceramic cup/mug mockup
  }
  if (name.includes('t-shirt') || name.includes('polo') || name.includes('hoodie') || name.includes('shirt') || name.includes('cap') || name.includes('hat') || name.includes('apparel')) {
    return "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"; // Clean apparel/hoodie mockup
  }
  if (name.includes('box') || name.includes('bag') || name.includes('carton') || name.includes('packaging') || name.includes('mailer') || name.includes('pouch')) {
    return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop"; // Cardboard packaging boxes
  }
  if (name.includes('card') || name.includes('visiting card') || name.includes('business card')) {
    return "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop"; // Premium business card mockup
  }
  if (name.includes('gift') || name.includes('personalized') || name.includes('personalised') || name.includes('corporate')) {
    return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop"; // Beautiful gift package
  }
  if (name.includes('trophy') || name.includes('award') || name.includes('medal')) {
    return "https://images.unsplash.com/photo-1578269174936-2709b5a5e023?q=80&w=800&auto=format&fit=crop"; // Golden awards/trophies
  }
  if (name.includes('sign') || name.includes('banner') || name.includes('standee') || name.includes('poster')) {
    return "https://images.unsplash.com/photo-1572945281869-7023f82f338a?q=80&w=800&auto=format&fit=crop"; // Clean banner/signage mockup
  }

  // 2. Match by category / subCategory keywords
  if (category.includes('corporate') || category.includes('gift') || subCategory.includes('gift')) {
    return "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('card') || subCategory.includes('card')) {
    return "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('apparel') || subCategory.includes('apparel')) {
    return "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('drinkware') || subCategory.includes('drinkware')) {
    return "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('packaging') || subCategory.includes('packaging')) {
    return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('stationery') || subCategory.includes('stationery') || category.includes('office') || subCategory.includes('office')) {
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('trophy') || subCategory.includes('trophy') || category.includes('award') || subCategory.includes('award')) {
    return "https://images.unsplash.com/photo-1578269174936-2709b5a5e023?q=80&w=800&auto=format&fit=crop";
  }
  if (category.includes('sign') || subCategory.includes('sign') || category.includes('banner') || subCategory.includes('banner')) {
    return "https://images.unsplash.com/photo-1572945281869-7023f82f338a?q=80&w=800&auto=format&fit=crop";
  }

  return DEFAULT_FALLBACK;
}

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=800&auto=format&fit=crop";

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
    return validCandidates[0];
  }
  return fallback;
}


export function getOptimizedImage(url: string | null | undefined, width: number): string | null | undefined {
  if (!url) return url;
  if (url.includes('printo-s3.dietpixels.net') && !url.includes('w=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}`;
  }
  // Remove slow supabase image optimization for now, fallback to original
  /*
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const sep = url.includes('?') ? '&' : '?';
    const optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    let finalUrl = optimizedUrl;
    if (!optimizedUrl.includes('width=')) {
      finalUrl = `${finalUrl}${sep}width=${width}`;
    }
    if (!finalUrl.includes('resize=')) {
      finalUrl = `${finalUrl}&resize=contain`;
    }
    return finalUrl;
  }
  */
  return url;
}
