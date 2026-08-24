import { ErrorBoundary } from "../components/ErrorBoundary";
import { apiFetch, apiClient } from '../lib/api';
import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import { cleanAndDeduplicateImages, isProductImage, getFallbackImage, getOptimizedImage } from "@/src/lib/imageUtils";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { SEO } from "@/src/components/SEO";
import { Product, PopularProducts } from "@/src/data/products";
import { Button } from "@/src/components/ui/button";
import { ProductCard } from "@/src/components/ui/ProductCard";
import {
  ArrowLeft,
  Check,
  Truck,
  Shield,
  UploadCloud,
  ShoppingCart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Sparkles,
  Search,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Scissors,
  MessageSquarePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useProducts } from "../hooks/useProducts";
import { AppContext } from "../context/AppContext";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { DesignEditor } from "../components/DesignEditor";
import { PoloTshirtPreview } from "../components/PoloTshirtPreview";

const Polo3DPreview = React.lazy(() => import("../components/Polo3DPreview").then(m => ({ default: m.Polo3DPreview })));

import { googleProvider, signInWithGoogle, getGoogleAccessToken } from '../lib/firebase';
import { getColorStyle, isColorCategory } from "@/src/utils/colorUtils";

type PlacementId =
  | "front-full"
  | "front-chest"
  | "back-full"
  | "sleeve-left"
  | "sleeve-right"
  | "front"
  | "back"
  | "generic";



interface Artwork {
  file: File;
  previewUrl: string;
  scale: number;
  fileName: string;
  isImage?: boolean;
  driveFileId?: string;
  mediaUrl?: string;
  dpi?: number;
  warningLevel?: 'not_printable' | 'poor' | 'fair' | 'good';
}

const APPAREL_PLACEMENTS: Record<
  string,
  { label: string; view: string; baseClass: string }
> = {
  "front-chest": {
    label: "Left Chest Logo",
    view: "front",
    baseClass: "w-[12%] aspect-square -translate-y-[85%] translate-x-[85%]",
  },
  "front-full": {
    label: "Full Chest",
    view: "front",
    baseClass: "w-1/3 aspect-square -translate-y-1/4",
  },
  "back-full": {
    label: "Back Print",
    view: "back",
    baseClass: "w-1/3 aspect-square -translate-y-1/4",
  },
  "sleeve-left": {
    label: "Left Sleeve",
    view: "left",
    baseClass: "w-[14%] aspect-square -translate-y-[10%] translate-x-[110%] skew-y-6 rotate-[-5deg]",
  },
  "sleeve-right": {
    label: "Right Sleeve",
    view: "right",
    baseClass: "w-[14%] aspect-square -translate-y-[10%] -translate-x-[110%] -skew-y-6 rotate-[5deg]",
  },
};

const BUSINESS_CARD_PLACEMENTS: Record<
  string,
  { label: string; view: string; baseClass: string }
> = {
  front: {
    label: "Front Design",
    view: "front",
    baseClass: "w-[80%] max-w-[400px] dynamic-aspect",
  },
  back: {
    label: "Back Design",
    view: "back",
    baseClass: "w-[80%] max-w-[400px] dynamic-aspect",
  },
};

const GENERIC_PLACEMENT = { label: "Front", view: "front", baseClass: "w-2/3 aspect-square" };

const ProductFormattedDescription: React.FC<{ description?: string; features?: string[] | string }> = ({ description, features }) => {
  if (!description && (!features || (Array.isArray(features) && features.length === 0))) {
    return null;
  }

  const rawDesc = description || "";

  const decodeEntities = (str: string) => {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const cleanedDesc = decodeEntities(rawDesc.trim());
  const rawLines = cleanedDesc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let introParagraph = "";
  let bulletItems: string[] = [];

  const commonKeys = ['Material:', 'Fabric Composition:', 'Composition:', 'Print Area:', 'Personalisation:', 'Style:', 'Fit:', 'Wash Care:', 'GSM:', 'Dimensions:', 'Weight:', 'Size:', 'Features:', 'Details:', 'Care Instructions:', 'Print Type:', 'Color:'];
  // manually construct the regex string to avoid JS replacement issues
  const pattern = commonKeys.map(k => k.replace(/[-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|');
  const splitRegex = new RegExp(`(?<=\\s|^)(${pattern})`);

  rawLines.forEach((line, index) => {
    const cleanLine = line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*\d+\.]\s*/, "").trim();
    if (!cleanLine) return;
    
    if (index === 0 && !/^[\u2022\u2023\u25E6\u2043\u2219\-\*]/.test(line)) {
      const sentences = cleanLine.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      const introSentences: string[] = [];
      sentences.forEach(s => {
        if (s.includes(':')) {
          bulletItems.push(s);
        } else {
          if (bulletItems.length === 0) {
            introSentences.push(s);
          } else {
            bulletItems.push(s);
          }
        }
      });
      introParagraph = introSentences.join(" ");
    } else {
      bulletItems.push(cleanLine);
    }
  });

  let processedBullets: string[] = [];
  bulletItems.forEach(bullet => {
    const parts = bullet.split(splitRegex);
    let currentBullet = "";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (commonKeys.includes(p)) {
        if (currentBullet.trim()) processedBullets.push(currentBullet.trim());
        currentBullet = p;
      } else {
        currentBullet += p;
      }
    }
    if (currentBullet.trim()) processedBullets.push(currentBullet.trim());
  });

  bulletItems = processedBullets;

  let featureList: string[] = [];
  if (Array.isArray(features)) {
    featureList = features.map(f => decodeEntities(String(f).trim())).filter(Boolean);
  } else if (typeof features === 'string' && features) {
    featureList = (features as string).split(',').map(f => decodeEntities(f.trim())).filter(Boolean);
  }

  const forbiddenFeatures = [
    "Premium quality fabric / materials",
    "High durability print",
    "Custom branding available",
    "Premium quality construction",
    "Custom branding included",
    "Highly durable design"
  ].map(s => s.toLowerCase());

  featureList = featureList.filter(f => {
    const lower = f.toLowerCase();
    return !forbiddenFeatures.some(forbidden => lower.includes(forbidden));
  });

  featureList.forEach(f => {
    const cleanF = f.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-\*\d+\.]\s*/, '').trim();
    if (cleanF && !bulletItems.some(b => b.toLowerCase().includes(cleanF.toLowerCase()) || cleanF.toLowerCase().includes(b.toLowerCase()))) {
      bulletItems.push(cleanF);
    }
  });

  const formatBulletContent = (item: string) => {
    const colonIndex = item.indexOf(':');
    if (colonIndex > 0 && colonIndex < 40) {
      const label = item.substring(0, colonIndex + 1);
      const rest = item.substring(colonIndex + 1);
      return (
        <span>
          <strong className="font-semibold text-gray-900">{label}</strong>
          {rest}
        </span>
      );
    }
    return <span>{item}</span>;
  };

  return (
    <div className="mb-6 space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100/90 shadow-2xs">
      {introParagraph && (
        <p className="text-gray-700 font-medium leading-relaxed text-xs sm:text-sm">
          {introParagraph}
        </p>
      )}

      {bulletItems.length > 0 && (
        <ul className="space-y-1.5 pt-1 pl-0.5">
          {bulletItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
              <div className="flex-1 leading-relaxed">{formatBulletContent(item)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  const { addToCart, token, user } = useContext(AppContext);
  const { products: allProducts } = useProducts();
  const [isAdding, setIsAdding] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [productInstructions, setProductInstructions] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{
    status: "idle" | "uploading" | "complete" | "error";
    percentage: number;
    currentFile: string;
    currentIndex: number;
    totalFiles: number;
  }>({
    status: "idle",
    percentage: 0,
    currentFile: "",
    currentIndex: 0,
    totalFiles: 0,
  });

  const suggestedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    const sameCategory = allProducts.filter(p => p.id !== product?.id && p.category === product?.category);
    if (sameCategory.length >= 4) return sameCategory.slice(0, 4);
    
    const otherProducts = allProducts.filter(p => p.id !== product?.id && !sameCategory.find(s => s.id === p.id));
    return [...sameCategory, ...otherProducts].slice(0, 4);
  }, [allProducts, product]);

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [initialCanvasState, setInitialCanvasState] = useState<any>(null);
  const [loadedDesignId, setLoadedDesignId] = useState<string | null>(null);
  const [activePlacement, setActivePlacement] =
    useState<PlacementId>("generic");
  const [artworks, setArtworks] = useState<Record<string, Artwork>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [productGalleryLightboxIndex, setProductGalleryLightboxIndex] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [hoveredColor, setHoveredColor] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, any>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [show3D, setShow3D] = useState(false);
  const [showStandardImages, setShowStandardImages] = useState(false);

  const handleImageLoaded = (imgUrl: string) => {
    if (!imgUrl) return;
    const optUrl = getOptimizedImage(imgUrl, 1000) || imgUrl;
    setLoadedImages(prev => ({ ...prev, [imgUrl]: true, [optUrl]: true }));
  };

  const validImages = useMemo(() => {
    if (!product) return [];
    
    let baseImages: string[] = [];
    const rawImages = (product as any).images;
    if (rawImages) {
      if (Array.isArray(rawImages)) {
        baseImages = rawImages.filter((img: any) => typeof img === 'string');
      } else if (typeof rawImages === 'string') {
        const trimmed = rawImages.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              baseImages = parsed.filter((img: any) => typeof img === 'string');
            }
          } catch (e) {}
        }
        if (baseImages.length === 0) {
          if (trimmed.includes('\n')) {
            baseImages = trimmed.split('\n').map((s: string) => s.trim()).filter(Boolean);
          } else if (trimmed.includes(',')) {
            baseImages = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else if (trimmed) {
            baseImages = [trimmed];
          }
        }
      }
    }

    const mainImg = product?.image && typeof product?.image === 'string' ? String(product?.image).trim() : null;
    const allImgs = mainImg ? [mainImg, ...baseImages] : baseImages;
    const cleaned = cleanAndDeduplicateImages(allImgs);
    let available = cleaned.length > 0 ? cleaned : allImgs.filter(Boolean);

    const filtered = available.filter(img => typeof img === 'string' && img.trim() !== '' && !brokenImages[img]);

    // Deduplicate variant images by color so we don't show 3 images of the same color
    let colorsList: any[] = (product as any).colors || [];
    if (colorsList.length === 0 && (product as any).variations) {
      const colorVar = (product as any).variations.find((v: any) => {
        const name = String(v.name || '').toLowerCase();
        return name.includes('color') || name.includes('colour');
      });
      if (colorVar && Array.isArray(colorVar.options)) {
        colorsList = colorVar.options;
      }
    }

    const representativeColorImages = new Set<string>();
    colorsList.forEach((c: any) => {
      if (typeof c === 'object' && c?.image) {
        representativeColorImages.add(c.image);
      } else {
        const cName = typeof c === 'string' ? c : (c?.name || '');
        if (cName) {
          const match = filtered.find(u => u.toLowerCase().includes(cName.toLowerCase().replace(/\s+/g, '')));
          if (match) representativeColorImages.add(match);
        }
      }
    });

    const variantImages = filtered.filter(u => u.toLowerCase().includes('/variant/'));
    let deduplicatedFiltered = filtered;
    if (variantImages.length > 0) {
      const deduplicated: string[] = [];
      filtered.forEach(img => {
        const isVariant = img.toLowerCase().includes('/variant/');
        if (isVariant) {
          if (representativeColorImages.size > 0) {
            if (representativeColorImages.has(img) && !deduplicated.includes(img)) {
              deduplicated.push(img);
            }
          } else {
            if (!deduplicated.includes(img)) {
              deduplicated.push(img);
            }
          }
        } else {
          if (!deduplicated.includes(img)) {
            deduplicated.push(img);
          }
        }
      });

      representativeColorImages.forEach(img => {
        if (!deduplicated.includes(img) && filtered.includes(img)) {
          deduplicated.push(img);
        }
      });

      if (deduplicated.length > 0) {
        deduplicatedFiltered = deduplicated;
      }
    }

    const isApparelProduct = ["Apparel", "Clothing & Bags", "Custom Apparel", "T-Shirts", "Corporate Uniforms"].includes(product?.category || "") || (product?.name && (String(product?.name || '').toLowerCase().includes("t-shirt") || String(product?.name || '').toLowerCase().includes("polo") || String(product?.name || '').toLowerCase().includes("hoodie") || String(product?.name || '').toLowerCase().includes("jacket") || String(product?.name || '').toLowerCase().includes("sweatshirt") || String(product?.name || '').toLowerCase().includes("wear")));
    if (isApparelProduct && deduplicatedFiltered.length >= 2) {
      deduplicatedFiltered = [...deduplicatedFiltered];
      const temp = deduplicatedFiltered[0];
      deduplicatedFiltered[0] = deduplicatedFiltered[1];
      deduplicatedFiltered[1] = temp;
    }

    if (deduplicatedFiltered.length === 0) {
      const fallback = getFallbackImage(product);
      if (fallback && !brokenImages[fallback]) {
        return [fallback];
      }
    }

    return deduplicatedFiltered;
  }, [product, brokenImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (productGalleryLightboxIndex === null || !validImages || validImages.length === 0) return;
      if (e.key === "ArrowRight") {
        setProductGalleryLightboxIndex(prev => {
          if (prev === null) return null;
          return (prev + 1) % validImages.length;
        });
      } else if (e.key === "ArrowLeft") {
        setProductGalleryLightboxIndex(prev => {
          if (prev === null) return null;
          return (prev - 1 + validImages.length) % validImages.length;
        });
      } else if (e.key === "Escape") {
        setProductGalleryLightboxIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [productGalleryLightboxIndex, validImages]);

  const getColorMatchingImage = useCallback((colorName: string | any) => {
    if (!colorName || !validImages || validImages.length === 0) return null;

    const cName = typeof colorName === 'string' ? colorName : (colorName?.name || '');
    if (typeof colorName === 'object' && colorName?.image) {
      if (validImages.includes(colorName.image) || isProductImage(colorName.image)) {
        return colorName.image;
      }
    }

    if (!cName) return null;
    const cleanColor = cName.toLowerCase().trim();
    const cleanColorNoSpaces = cleanColor.replace(/[\s\-_]+/g, '');

    // 1. Exact or sanitized match in image URLs/filenames
    const found = validImages.find(img => {
      const lowerImg = img.toLowerCase();
      const filename = lowerImg.split('/').pop() || '';
      const sanitizedFilename = filename.replace(/[\s\-_]+/g, '');
      return (
        filename.includes(cleanColor) || 
        sanitizedFilename.includes(cleanColorNoSpaces) ||
        lowerImg.includes(`/${cleanColor}/`) || 
        lowerImg.includes(`_${cleanColor}_`) ||
        lowerImg.includes(`-${cleanColor}-`)
      );
    });
    if (found) return found;

    // 2. Individual significant words in color name
    const words = cleanColor.split(/[\s\-_]+/).filter(w => w.length > 2 && w !== 'color' && w !== 'colour' && w !== 'tshirt' && w !== 'shirt' && w !== 'polo' && w !== 'hoodie');
    for (const word of words) {
      const match = validImages.find(img => {
        const lowerImg = img.toLowerCase();
        const filename = lowerImg.split('/').pop() || '';
        return filename.includes(word) || lowerImg.includes(`/${word}/`) || lowerImg.includes(`_${word}_`) || lowerImg.includes(`-${word}-`);
      });
      if (match) return match;
    }

    // 3. Positional fallback: If product has list of colors and equal/greater number of validImages, match index
    const allColorsList = (product?.colors && product?.colors.length > 0) 
      ? product?.colors 
      : (product?.variations ? (product?.variations.find((v: any) => isColorCategory(v.name, v.options))?.options || []) : []);
    
    if (allColorsList.length > 1 && validImages.length >= allColorsList.length) {
      const colorIdx = allColorsList.findIndex((c: any) => {
        const name = typeof c === 'string' ? c : (c?.name || '');
        return name.toLowerCase().trim() === cleanColor;
      });
      if (colorIdx >= 0 && colorIdx < validImages.length) {
        return validImages[colorIdx];
      }
    }

    return null;
  }, [validImages, product]);

  const rawDisplayImage = useMemo(() => {
    // 1. Hovered color state
    if (hoveredColor) {
      const hName = typeof hoveredColor === 'string' ? hoveredColor : (hoveredColor?.name || '');
      const hImg = typeof hoveredColor === 'object' ? hoveredColor?.image : null;
      if (hImg) return hImg;
      const match = getColorMatchingImage(hName || hoveredColor);
      if (match) return match;
    }

    // 2. Selected color state
    if (selectedColor) {
      const cName = typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '');
      const cImg = typeof selectedColor === 'object' ? selectedColor?.image : null;
      if (cImg) return cImg;
      const match = getColorMatchingImage(cName || selectedColor);
      if (match) return match;
    }

    // 3. User gallery thumbnail click
    if (selectedImage) {
      return selectedImage;
    }
    
    return product ? product?.image : null;
  }, [selectedColor, hoveredColor, selectedImage, product, getColorMatchingImage]);

  const displayImage = useMemo(() => {
    if (rawDisplayImage && isProductImage(rawDisplayImage) && !brokenImages[rawDisplayImage]) {
      return rawDisplayImage;
    }
    if (validImages.length > 0) {
      return validImages[0];
    }
    return getFallbackImage(product);
  }, [rawDisplayImage, brokenImages, validImages, product]);

  // Preload only the current display image + thumbnails on mount
  useEffect(() => {
    if (!validImages || validImages.length === 0) return;

    // Preload the current display image at full size
    if (displayImage) {
      const opt = getOptimizedImage(displayImage, 1000) || displayImage;
      const img = new Image();
      img.src = opt;
      img.onload = () => setLoadedImages(prev => ({ ...prev, [displayImage]: true, [opt]: true }));
    }

    // Preload thumbnails only (small size)
    validImages.forEach(imgUrl => {
      if (!imgUrl || imgUrl === displayImage) return;
      const thumb = getOptimizedImage(imgUrl, 150) || imgUrl;
      const img = new Image();
      img.src = thumb;
    });
  }, [validImages, displayImage, product]);

  // Preload adjacent images when hovering gallery thumbnails
  const preloadAdjacent = useCallback((index: number) => {
    if (!validImages || validImages.length === 0) return;
    [index - 1, index, index + 1].forEach(i => {
      if (i >= 0 && i < validImages.length) {
        const imgUrl = validImages[i];
        const opt = getOptimizedImage(imgUrl, 1000) || imgUrl;
        const img = new Image();
        img.src = opt;
        img.onload = () => setLoadedImages(prev => ({ ...prev, [imgUrl]: true, [opt]: true }));
      }
    });
  }, [validImages]);

  const active3DColor = useMemo(() => {
    const activeColor = hoveredColor || selectedColor;
    if (activeColor) {
      if (activeColor.hex && typeof activeColor.hex === 'string') return activeColor.hex;
      if (activeColor.name) {
        const style = getColorStyle(activeColor.name);
        if (style.background) return style.background;
      }
      if (typeof activeColor === 'string') {
        const style = getColorStyle(activeColor);
        if (style.background) return style.background;
      }
    }
    if (selectedVariations) {
      for (const varVal of Object.values(selectedVariations) as any[]) {
        if (varVal) {
          const vName = typeof varVal === 'string' ? varVal : (varVal.name || '');
          if (vName) {
            const style = getColorStyle(vName);
            if (style.background) return style.background;
          }
        }
      }
    }
    return '#ffffff';
  }, [selectedColor, hoveredColor, selectedVariations]);

  const hasNoValidProductImage = !displayImage || !!brokenImages[displayImage] || Boolean(product?.isDisabled);

  const handleImageError = (imgUrl: string) => {
    if (!imgUrl) return;
    setBrokenImages(prev => ({ ...prev, [imgUrl]: true }));
    if (selectedImage === imgUrl) {
      setSelectedImage(null);
    }
  };
  
  // Business Card states
  const [cardSides, setCardSides] = useState<"front" | "front-back">("front");
  const [cardQuantity, setCardQuantity] = useState<number>(100);
  
  // Generic Quantity state
  const [baseQuantity, setBaseQuantity] = useState<number>(1);
  const [minDynamicQty, setMinDynamicQty] = useState<number>(1);
  const [minDynamicPages, setMinDynamicPages] = useState<number>(1);
  
  // Brochure states
  const [brochureFold, setBrochureFold] = useState<string>("Tri Fold");
  const [brochureStyle, setBrochureStyle] = useState<string>("A5");
  const [brochureQty, setBrochureQty] = useState<number>(25);

  const [standeeSize, setStandeeSize] = useState<string>("2x5");
  const [standeeQty, setStandeeQty] = useState<number>(1);
  
  const [documentPages, setDocumentPages] = useState<number>(1);

  const [acrylicShape, setAcrylicShape] = useState<string>("Square/Rectangle");

  const [cardShape, setCardShape] = useState<string>("Standard Rectangle");

  const isBrochure = String(product?.name || '').toLowerCase().includes("brochure") || String(product?.name || '').toLowerCase().includes("pamphlet") || String(product?.name || '').toLowerCase().includes("flyer") || (String(product?.category || '').toLowerCase() === "marketing" && !String(product?.name || '').toLowerCase().includes("standee"));
  const isStandee = String(product?.name || '').toLowerCase().includes("standee");
  const isAcrylic = String(product?.name || '').toLowerCase().includes("acrylic");
  const isUnboundDocument = product?.name === 'Unbound Document Printing';
  const isCenterPinBinding = product?.name === 'Center Pin Binding';
  const isDocumentPrinting = isUnboundDocument || isCenterPinBinding;
  // ID cards have the same size and properties as Business Cards in this context
  const isActualBusinessCard = product?.category === "Business Cards";
  const isIdCard = String(product?.name || '').toLowerCase().includes("id card") || String(product?.category || '').toLowerCase().includes("id card") || String(product?.name || '').toLowerCase().includes("badge") || String(product?.name || '').toLowerCase().includes("pvc");
  const isVisitingCard = String(product?.name || '').toLowerCase().includes("visiting") || String(product?.name || '').toLowerCase().includes("business card") || String(product?.category || '').toLowerCase().includes("visiting") || String(product?.category || '').toLowerCase().includes("business card") || String(product?.name || '').toLowerCase().includes("shape cut");
  const isDieCutProduct = Boolean(String(product?.name || '').toLowerCase().includes("die cut") || String(product?.name || '').toLowerCase().includes("shape cut") || String(product?.category || '').toLowerCase().includes("shape cut") || cardShape.includes("Die Cut"));
  const isBusinessCard = isActualBusinessCard || isIdCard || isVisitingCard || isDieCutProduct;

  const pNameLower = String(product?.name || '').toLowerCase() || "";
  const pCatLower = String(product?.category || '').toLowerCase() || "";
  const isCustomShapeCard = Boolean(
    pNameLower.includes("u-shape") ||
    pNameLower.includes("u shape") ||
    pNameLower.includes("arch") ||
    pNameLower.includes("half moon") ||
    pNameLower.includes("leaf") ||
    pNameLower.includes("die cut") ||
    pNameLower.includes("shape cut") ||
    pNameLower.includes("custom shape") ||
    pNameLower.includes("cutout") ||
    pNameLower.includes("single round") ||
    pNameLower.includes("1 round") ||
    pNameLower.includes("2 round") ||
    pNameLower.includes("oval") ||
    pNameLower.includes("circle") ||
    pCatLower.includes("shape cut") ||
    (cardShape && cardShape !== "Standard Rectangle" && cardShape !== "Standard" && cardShape !== "Standard Business Card" && cardShape !== "Square")
  );

  useEffect(() => {
    if (product) {
      const pName = String(product?.name || "").toLowerCase();
      const pCat = String(product?.category || "").toLowerCase();
      if (pName.includes("u-shape") || pName.includes("u shape") || pName.includes("arch") || pName.includes("half moon")) {
        setCardShape("U-Shape");
      } else if (pName.includes("leaf")) {
        setCardShape("Leaf Cut");
      } else if (pName.includes("single round") || pName.includes("1 round")) {
        setCardShape("Single Round Corner");
      } else if (pName.includes("round corner") || pName.includes("rounded corner")) {
        setCardShape("Rounded Corners");
      } else if (pName.includes("circle") || pName.includes("round card")) {
        setCardShape("Circle");
      } else if (pName.includes("square")) {
        setCardShape("Square");
      } else if (pName.includes("oval")) {
        setCardShape("Oval Cut");
      } else if (pName.includes("die cut") || pName.includes("shape cut") || pName.includes("custom shape") || pName.includes("cutout") || pCat.includes("shape cut")) {
        setCardShape("Die Cut / Custom Shape");
      }
    }
  }, [product]);
  
  const minQtyDefault = isIdCard ? 1 : 100;
  const qtyMultipleDefault = isIdCard ? 1 : 100;
  
  const brochureQuantities = [25, 50, 100, 200, 500, 1000, 2000, 5000];

  const getActiveVariations = () => {
    if (!product || !Array.isArray(product?.variations)) return selectedVariations;
    const isBillBook = String(product?.name || '').toLowerCase().includes("bill book") || String(product?.category || '').toLowerCase().includes("bill book");
    
    let has2Duplicate = false;
    product?.variations.forEach((vc: any) => {
       const isPadOrType = String(vc.name || '').toLowerCase().includes("pad") || String(vc.name || '').toLowerCase().includes("type") || String(vc.name || '').toLowerCase().includes("duplicate");
       const sel = selectedVariations[vc.id];
       if (isPadOrType && sel && sel.name) {
          if (String(sel.name || '').toLowerCase().includes("+2 duplicate")) {
             has2Duplicate = true;
          }
       }
    });

    const active: Record<string, any> = {};
    product?.variations.forEach((vc: any) => {
       const is2ndDuplicateConfig = String(vc.name || '').toLowerCase().includes("2nd duplicate");
       if (isBillBook && is2ndDuplicateConfig && !has2Duplicate) {
          return; // skip
       }
       if (selectedVariations[vc.id]) {
          active[vc.id] = selectedVariations[vc.id];
       }
    });
    return active;
  };

  const calculatePrice = () => {
    if (!product) return 0;
    
    if (isDocumentPrinting) {
       const activeVars = getActiveVariations();
       const sizeOpt: any = Object.values(activeVars).find((o: any) => o.name === 'A3 ' || o.name === 'A3' || o.name === 'A4 ' || o.name === 'A4');
       const printTypeOpt: any = Object.values(activeVars).find((o: any) => String(o.name || '').toLowerCase().includes("multi-colour") || String(o.name || '').toLowerCase().includes("black & white"));

       const isA3 = sizeOpt?.name?.trim() === 'A3';
       const isColour = String(printTypeOpt.name || '').toLowerCase().includes('multi-colour');
       
       const discountScale = Math.min(Math.floor(documentPages / 5), 6);
       let discountPerPage = 0;
       if (isColour) {
         discountPerPage = discountScale * 2;
       } else {
         discountPerPage = discountScale * 0.5;
       }

       if (isUnboundDocument) {
           let pagePrice = 6;
           if (!isA3 && !isColour) pagePrice = 6;
           if (!isA3 && isColour) pagePrice = 28;
           if (isA3 && !isColour) pagePrice = 10;
           if (isA3 && isColour) pagePrice = 43;

           pagePrice -= discountPerPage;
           return pagePrice * documentPages * baseQuantity;
       } else {
           let basePrice = Number(product?.price);
           let pageVariationAddon = 0;
           let copyVariationAddon = 0;

           Object.entries(activeVars).forEach(([categoryId, opt]: [string, any]) => {
              const vc = product?.variations.find((v:any) => v.id === categoryId);
              if (vc && String(vc.name || '').toLowerCase().includes('cover')) {
                 copyVariationAddon += Number(opt.price || 0);
              } else {
                 pageVariationAddon += Number(opt.price || 0);
              }
           });
           
           let pagePrice = (basePrice + pageVariationAddon) / 4;
           pagePrice -= discountPerPage;
           if (pagePrice < 0) pagePrice = 0;

           let actualPages = Math.max(documentPages, 4);

           return (pagePrice * actualPages + copyVariationAddon) * baseQuantity;
       }
    }

    let basePrice = Number(product?.price);
    let variationAddon = 0;
    
    Object.values(getActiveVariations()).forEach((opt: any) => {
      if (opt && typeof opt.price !== 'undefined') {
        variationAddon += Number(opt.price);
      }
    });
    
    if (isStandee) {
      if (basePrice > 0) {
         const unitPrice = basePrice / (product?.minQty || 1);
         return Math.round((unitPrice + variationAddon) * standeeQty);
      }
      let sizePrice = 1750;
      if (standeeSize === "2.5x6") sizePrice = 1900;
      if (standeeSize === "3x6") sizePrice = 2150;
      if (standeeSize === "4x6") sizePrice = 2950;
      
      let discount = 0;
      if (standeeQty >= 2 && standeeQty <= 5) discount = 0.05;
      else if (standeeQty > 5 && standeeQty <= 10) discount = 0.10;
      else if (standeeQty > 10) discount = 0.15; // > 10 bulk orders
      
      let calculatedPrice = sizePrice * standeeQty * (1 - discount);
      return Math.round(calculatedPrice + variationAddon * standeeQty);
    }

    if (isBrochure) {
      if (basePrice > 0) {
         const multiplier = brochureQty / (product?.minQty || 1);
         return Math.round((basePrice + variationAddon) * multiplier);
      }
      
      let foldBase = 385; // A5 Tri/Bi
      if (brochureFold === "Z Fold") foldBase = 370;
      
      // Basic size adjustments
      // A5 and A6 use base pricing.
      if (brochureStyle === "DL") foldBase = 560; // DL specific pricing
      
      const qtySteps = [25, 50, 100, 200, 500, 1000, 2000, 5000];
      const discounts = [0, 0.11, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40];
      let stepIndex = qtySteps.indexOf(brochureQty);
      if (stepIndex === -1) stepIndex = 0;
      
      const setsOf25 = brochureQty / 25;
      const discount = discounts[stepIndex];
      let calculatedPrice = foldBase * setsOf25 * (1 - discount);
      return Math.round(calculatedPrice + variationAddon * setsOf25);
    }
    
    if (isBusinessCard) {
      if (basePrice > 0) {
         const multiplier = cardQuantity / (product?.minQty || 1);
         let calcPrice = basePrice * multiplier;
         if (cardSides === "front-back") calcPrice *= 1.2;
         return Math.round(calcPrice + variationAddon * multiplier);
      }

      const setsOf100 = Math.ceil(cardQuantity / 100);
      let calculatedPrice = 150 * setsOf100;
      
      if (cardSides === "front-back") {
        calculatedPrice *= 1.2;
      }
      return calculatedPrice + variationAddon * setsOf100;
    }
    
    const multiplier = baseQuantity / (product?.minQty || 1);
    return Math.round((basePrice + variationAddon) * multiplier);
  };

  const handleAddToCart = async (instructionsOverride?: string) => {
    if (!product) return;
    setIsAdding(true);

    try {
      let customizations: any = null;
      const artworkEntries = Object.entries(artworks);
      const totalFiles = artworkEntries.length;

      if (totalFiles > 0) {
        setUploadProgress({
          status: "uploading",
          percentage: 0,
          currentFile: (artworkEntries[0][1] as any).file.name,
          currentIndex: 0,
          totalFiles,
        });

        const uploadedCustomizations = [];
        let fileIndex = 0;
        for (const [placementId, artwork] of artworkEntries as [
          string,
          any,
        ][]) {
          let mediaUrl = "";

          if (artwork.mediaUrl) {
            // Already hosted online! Just link it.
            mediaUrl = artwork.mediaUrl;
          } else {
            const file = artwork.file;
            const chunkSize = 512 * 1024; // 512KB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const basePercent = (fileIndex / totalFiles) * 100;

            if (totalChunks <= 1) {
               const formData = new FormData();
               formData.append("file", file);
               
               const res = await apiClient.post("/api/upload", formData, {
                 onUploadProgress: (progressEvent) => {
                   const filePercent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
                   const overallPercent = Math.min(
                     99,
                     Math.round(basePercent + (filePercent / totalFiles))
                   );
                   setUploadProgress({
                     status: "uploading",
                     percentage: overallPercent,
                     currentFile: file.name,
                     currentIndex: fileIndex,
                     totalFiles,
                   });
                 }
               });
               
               const data = res.data;
               if (res.status !== 200 && res.status !== 201) {
                 throw new Error(data.error || "Failed to upload artwork");
               }
               mediaUrl = data.url;
            } else {
               const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
               for (let i = 0; i < totalChunks; i++) {
                 const start = i * chunkSize;
                 const end = Math.min(start + chunkSize, file.size);
                 const chunk = file.slice(start, end);
                 const formData = new FormData();
                 formData.append("chunk", chunk);
                 formData.append("uploadId", uploadId);
                 formData.append("chunkIndex", i.toString());
                 formData.append("totalChunks", totalChunks.toString());
                 formData.append("originalName", file.name);

                 const res = await apiClient.post("/api/upload/chunk", formData, {
                   onUploadProgress: (progressEvent) => {
                     const chunkLoadedPercent = progressEvent.loaded / (progressEvent.total || chunk.size);
                     const currentFilePercent = ((i + chunkLoadedPercent) / totalChunks) * 100;
                     const overallPercent = Math.min(
                       99,
                       Math.round(basePercent + (currentFilePercent / totalFiles))
                     );
                     setUploadProgress({
                       status: "uploading",
                       percentage: overallPercent,
                       currentFile: file.name,
                       currentIndex: fileIndex,
                       totalFiles,
                     });
                   }
                 });
                 
                 const data = res.data;
                 if (res.status !== 200 && res.status !== 201) {
                   throw new Error(data.error || "Failed to upload chunk");
                 }
                 if (data.complete) mediaUrl = data.url;
               }
            }
          }

          uploadedCustomizations.push({
            placement: placementId,
            mediaUrl,
            scale: artwork.scale,
            x: artwork.x,
            y: artwork.y,
          });
          
          fileIndex++;
        }

        customizations = uploadedCustomizations;

        // Set to 100% complete
        setUploadProgress({
          status: "complete",
          percentage: 100,
          currentFile: "",
          currentIndex: totalFiles,
          totalFiles,
        });
        
        // Let user see 100% complete for a moment
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const activeInstructions = (instructionsOverride !== undefined ? instructionsOverride : productInstructions || "").trim();
      if (activeInstructions) {
        if (!customizations) customizations = [];
        if (Array.isArray(customizations)) {
          customizations.push({
            placement: "Instructions / Queries",
            instructions: activeInstructions
          });
        }
      }

      let finalProduct: any = { ...product, selectedColor };
      if (activeInstructions) {
        finalProduct.instructions = activeInstructions;
      }
      finalProduct.price = calculatePrice();
      
      const activeVars = getActiveVariations();
      const variantParts: string[] = [];
      if (selectedColor) {
         const cName = typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '');
         
         const isAlsoVariation = product?.variations?.some((vc: any) => {
            const opt = activeVars[vc.id];
            return opt && opt.name === cName && isColorCategory(vc.name, vc.options);
         });

         if (cName && !isAlsoVariation) variantParts.push(`Color: ${cName}`);
      }
      if (product && Array.isArray(product?.variations)) {
        product?.variations.forEach((vc: any) => {
          const opt = activeVars[vc.id];
          if (opt && opt.name) {
            variantParts.push(`${vc.name}: ${opt.name}`);
          }
        });
      }
      if (isBusinessCard) {
         variantParts.push(`Sides: ${cardSides === 'front-back' ? 'Front & Back' : 'Front Only'}`);
         if (cardShape && cardShape !== "Standard Business Card" && cardShape !== "Standard") variantParts.push(`Shape: ${cardShape}`);
      } else if (isBrochure) {
         variantParts.push(`Style: ${brochureStyle}`);
         variantParts.push(`Fold: ${brochureFold}`);
      } else if (isStandee) {
         variantParts.push(`Size: ${standeeSize} ft`);
      } else if (isAcrylic) {
         variantParts.push(`Shape: ${acrylicShape}`);
      } else if (isDocumentPrinting) {
         variantParts.push(`Pages: ${documentPages}`);
      }
      
      // If it's apparel and they clicked a placement but didn't upload, or just generally for apparel
      if (isApparel) {
         const placementConfig = APPAREL_PLACEMENTS[activePlacement as PlacementId];
         if (placementConfig) {
            variantParts.push(`Placement: ${placementConfig.label}`);
         }
      }

      const variantSuffix = variantParts.length > 0
          ? ` [${variantParts.join(' | ')}]`
          : '';

      if (isBusinessCard) {
         finalProduct.name = `${product?.name} (${cardQuantity} cards)${variantSuffix}`;
      } else if (isBrochure) {
         finalProduct.name = `${product?.name} (${brochureQty} brochures)${variantSuffix}`;
      } else if (isStandee) {
         finalProduct.name = `${product?.name} (${standeeQty} standees)${variantSuffix}`;
      } else if (isAcrylic) {
         const suffixText = baseQuantity > 1 ? ` (${baseQuantity} pcs)` : '';
         finalProduct.name = `${product?.name}${suffixText}${variantSuffix}`;
      } else if (isDocumentPrinting) {
         finalProduct.name = `${product?.name} (${baseQuantity} Copies)${variantSuffix}`;
      } else {
         const suffixText = baseQuantity > 1 ? ` (${baseQuantity} pcs)` : '';
         finalProduct.name = `${product?.name}${suffixText}${variantSuffix}`;
      }

      addToCart(
        finalProduct,
        1,
        customizations ? JSON.stringify(customizations) : null,
      );
      
      if (totalFiles > 0) {
        setUploadProgress({
          status: "idle",
          percentage: 0,
          currentFile: "",
          currentIndex: 0,
          totalFiles: 0,
        });
      }
    } catch (e: any) {
      setUploadProgress({
        status: "error",
        percentage: 0,
        currentFile: "",
        currentIndex: 0,
        totalFiles: 0,
      });
      alert(e.response?.data?.error || e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const applyProductData = (foundData: Product) => {
    let found = { ...foundData };

    // Inject missing business card variations if they are completely empty
    const isActualBusinessCard = found?.category === "Business Cards";
    const isVisitingCard = String(found.name || '').toLowerCase().includes("visiting") || String(found.name || '').toLowerCase().includes("business card") || String(found.category || '').toLowerCase().includes("visiting") || String(found.category || '').toLowerCase().includes("business card");
    
    if ((isActualBusinessCard || isVisitingCard) && (!found.variations || found.variations.length === 0)) {
        found.variations = [
            {
                id: "paper-quality",
                name: "Paper Quality",
                options: [
                    { name: "Standard 300 GSM Art Card", price: 0 },
                    { name: "Premium 350 GSM Art Card", price: 100 },
                    { name: "Premium Textured", price: 200 },
                    { name: "Non-Tearable", price: 300 }
                ]
            },
            {
                id: "lamination",
                name: "Lamination",
                options: [
                    { name: "Matte", price: 0 },
                    { name: "Gloss", price: 0 },
                    { name: "Velvet", price: 150 },
                    { name: "None", price: 0 }
                ]
            },
            {
                id: "corners",
                name: "Corners",
                options: [
                    { name: "Standard", price: 0 },
                    { name: "Rounded", price: 50 }
                ]
            }
        ];
    }

    setProduct(found);
    const foundIsId = String(found.name || '').toLowerCase().includes("id card") || String(found.category || '').toLowerCase().includes("id card") || String(found.name || '').toLowerCase().includes("badge") || String(found.name || '').toLowerCase().includes("pvc");
    setBaseQuantity(found.minQty || 1);
    setCardQuantity(found.minQty || (foundIsId ? 1 : 100));
    setStandeeQty(found.minQty || 1);
    setBrochureQty(found.minQty || 25);
    const foundIsApparel = ["Apparel", "Clothing & Bags", "Custom Apparel", "T-Shirts", "Corporate Uniforms"].includes(found.category || "") || Boolean(found.name && String(found.name || '').toLowerCase().includes("t-shirt"));
    if (foundIsApparel) {
      setActivePlacement("front-full");
    } else if (found.category === "Business Cards" || foundIsId) {
      setActivePlacement("front");
    } else {
      setActivePlacement("generic");
    }
    const searchParams = new URLSearchParams(window.location.search);
    const paramColor = searchParams.get("color");
    if (found.colors && found.colors.length > 0) {
      if (paramColor) {
        const matched = found.colors.find((c: any) => {
          const cName = typeof c === 'string' ? c : (c?.name || '');
          return cName.toLowerCase() === paramColor.toLowerCase();
        });
        if (matched) {
          setSelectedColor(matched);
        } else {
          setSelectedColor(found.colors[0]);
        }
      } else {
        setSelectedColor(found.colors[0]);
      }
    }

    if (found.variations && found.variations.length > 0) {
      const initialSelected: Record<string, any> = {};
      found.variations.forEach((v: any) => {
        if (v.options && v.options.length > 0) {
          initialSelected[v.id] = v.options[0];
        }
      });

      if (!found.colors || found.colors.length === 0) {
        found.variations.forEach((v: any) => {
          if (isColorCategory(v.name, v.options) && initialSelected[v.id]) {
            const opt = initialSelected[v.id];
            const optName = typeof opt === 'string' ? opt : (opt?.name || '');
            const optImg = typeof opt === 'object' ? opt?.image : undefined;
            if (optName) {
              const colorStyle = getColorStyle(optName);
              setSelectedColor({
                name: optName,
                hex: colorStyle.background,
                image: optImg
              });
            }
          }
        });
      }

      // Apply constraints for Cotton Lanyards initially
      if (found.name === 'Cotton Lanyards (Single color printing)') {
        const lanyardVc = found.variations.find((v: any) => String(v.name || '').trim().toLowerCase() === 'lanyard colour');
        const printColourVc = found.variations.find((v: any) => {
          const name = String(v.name || '').trim().toLowerCase();
          return name === 'print colour' || name === 'print colors' || name === 'print colours';
        });
        
        if (lanyardVc && printColourVc && initialSelected[lanyardVc.id]) {
          const selVal = initialSelected[lanyardVc.id];
          const selectedLanyardColor = String(typeof selVal === 'string' ? selVal : (selVal?.name || '')).trim().toLowerCase();
          let allowedPrintColours: string[] = [];
          
          if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
            allowedPrintColours = ['white'];
          } else if (selectedLanyardColor === 'yellow') {
            allowedPrintColours = ['black', 'red'];
          } else if (selectedLanyardColor === 'red') {
            allowedPrintColours = ['white', 'black'];
          }
          
          if (allowedPrintColours.length > 0) {
             const defaultPrintColour = printColourVc.options.find((o: any) => {
               const oName = String(typeof o === 'string' ? o : (o?.name || '')).trim().toLowerCase();
               return allowedPrintColours.includes(oName);
             });
             if (defaultPrintColour) {
               initialSelected[printColourVc.id] = defaultPrintColour;
             }
          }
        }
      }

      if (found.name === 'Center Pin Binding') {
        setDocumentPages(4);
      } else {
        setDocumentPages(1);
      }

      setSelectedVariations(initialSelected);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    let isCancelled = false;

    async function fetchProduct() {
      if (!productId) return;
      setProductsLoading(true);

      const matchInAllProducts = allProducts && allProducts.find(p => p.id === productId || p.id.toLowerCase() === productId.toLowerCase() || p.slug === productId || (p.slug && p.slug.toLowerCase() === productId.toLowerCase()));

      if (matchInAllProducts && !isCancelled) {
        applyProductData(matchInAllProducts);
        setProductsLoading(false);
      }

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        const fetchPromise = apiFetch(`/api/products/${productId}`);

        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!isCancelled && response && response.ok) {
          const found = await response.json();
          if (found && found.id) {
            applyProductData(found);
          } else {
            setProduct(null);
          }
        } else if (!isCancelled) {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        if (!isCancelled && !matchInAllProducts) {
          setProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setProductsLoading(false);
        }
      }

      // Parse query params for pre-loaded designs
      const searchParams = new URLSearchParams(window.location.search);
      const queryDriveFileId = searchParams.get('driveFileId');
      const queryMediaUrl = searchParams.get('mediaUrl');
      const queryPlacement = searchParams.get('placement') as PlacementId || 'generic';
      const queryDesignId = searchParams.get('designId');

      if (queryDesignId && !isCancelled) {
        setLoadedDesignId(queryDesignId);
      }

      if (queryDriveFileId && queryMediaUrl && !isCancelled) {
        const initialArtwork: Record<string, Artwork> = {
          [queryPlacement]: {
            file: new File([], `loaded-design-${queryDriveFileId}.png`),
            previewUrl: queryMediaUrl,
            scale: 1,
            fileName: `Saved Design`,
            isImage: true,
            driveFileId: queryDriveFileId,
            mediaUrl: queryMediaUrl
          }
        };
        setArtworks(initialArtwork);
        if (queryPlacement) {
          setActivePlacement(queryPlacement);
        }
      }
    }

    fetchProduct();

    return () => {
      isCancelled = true;
    };
  }, [productId, allProducts]);

  useEffect(() => {
    async function loadSavedDesignState() {
      if (!loadedDesignId || !token) return;
      try {
        const res = await apiFetch('/api/users/me/designs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const found = data.designs?.find((d: any) => d.id === loadedDesignId);
          if (found && found.canvasState) {
            setInitialCanvasState(found.canvasState);
          }
        }
      } catch (err) {
        console.error("Failed to load saved design canvas state:", err);
      }
    }
    loadSavedDesignState();
  }, [loadedDesignId, token]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (productsLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading product details...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-gray-500">The product you are looking for does not exist or has been removed.</p>
          <Link to="/" className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 font-medium transition-colors">
            Return Home
          </Link>
        </div>
      </Layout>
    );
  }

  const isApparel = ["Apparel", "Clothing & Bags", "Custom Apparel", "T-Shirts", "Corporate Uniforms"].includes(product?.category) || (product?.name && (String(product?.name || '').toLowerCase().includes("t-shirt") || String(product?.name || '').toLowerCase().includes("polo") || String(product?.name || '').toLowerCase().includes("hoodie")));
  const isPolo = Boolean(product?.name && String(product?.name || '').toLowerCase().includes("polo"));
  const isMug = Boolean(String(product?.name || '').toLowerCase().includes("mug") || String(product?.category || '').toLowerCase().includes("mug"));
  const isCap = Boolean(String(product?.name || '').toLowerCase().includes("cap") || String(product?.category || '').toLowerCase().includes("cap"));


  // Determine current view based on active placement
  const placementConfig = isApparel
    ? APPAREL_PLACEMENTS[activePlacement]
    : isBusinessCard
      ? BUSINESS_CARD_PLACEMENTS[activePlacement]
      : GENERIC_PLACEMENT;
  const currentView = placementConfig?.view || "front";
  const isFlipped = currentView === "back";

  const currentArtwork = artworks[activePlacement];

  const productNameLower = String(product?.name || "").toLowerCase();
  const productFeaturesLower = Array.isArray(product?.features) ? (product?.features as any[]).map((f: any) => f?.toLowerCase?.() || "").join(" ") : (typeof (product?.features as any) === 'string' ? (product?.features as any).toLowerCase() : "");
  const productDescLower = String(product?.description || "").toLowerCase();
  const selectedVarValues = Object.values(selectedVariations).map((v: any) => typeof v === 'string' ? v.toLowerCase() : String(v?.name || '').toLowerCase()).join(" ");

  const cardShapeLower = cardShape.toLowerCase();

  const hasKeyword = (k: string) => productNameLower.includes(k) || productFeaturesLower.includes(k) || productDescLower.includes(k) || selectedVarValues.includes(k) || cardShapeLower.includes(k);

  const isDieCut = hasKeyword("die cut") || hasKeyword("die-cut") || hasKeyword("shape cut") || hasKeyword("shape-cut") || hasKeyword("custom shape") || hasKeyword("cutout") || hasKeyword("cut out") || hasKeyword("custom cut") || hasKeyword("shoe") || hasKeyword("shaped") || hasKeyword("u-shape") || cardShape === "Die Cut / Custom Shape";
  const isLeaf = hasKeyword("leaf");
  const isCircle = hasKeyword("circle") || hasKeyword("round card");
  const isOval = hasKeyword("oval");
  const isSquare = hasKeyword("square");
  const isHalfMoon = hasKeyword("half moon") || hasKeyword("arch");
  const isSingleRound = hasKeyword("single round") || hasKeyword("1 round");
  const isRoundedCorners = hasKeyword("rounded corner") || hasKeyword("round corner") || hasKeyword("rounded corners");
  const isPortrait = hasKeyword("portrait");

  let productRadiusClass = "rounded-md";
  let businessCardAspect = isPortrait ? "aspect-[1/1.75]" : "aspect-[1.75/1]";

  if (isSquare || isCircle) {
    businessCardAspect = "aspect-square";
  } else if (isOval) {
    businessCardAspect = isPortrait ? "aspect-[1/1.5]" : "aspect-[1.5/1]";
  } else if (isHalfMoon) {
    businessCardAspect = isPortrait ? "aspect-[1/1.2]" : "aspect-[1.2/1]";
  }

  if (isCircle) {
    productRadiusClass = "!rounded-full";
  } else if (isOval) {
    productRadiusClass = "!rounded-[50%]";
  } else if (isLeaf) {
    productRadiusClass = "!rounded-tl-[3.5rem] !rounded-br-[3.5rem] !rounded-tr-md !rounded-bl-md";
  } else if (isHalfMoon) {
    productRadiusClass = "!rounded-t-full !rounded-b-lg";
  } else if (isSingleRound) {
    productRadiusClass = "!rounded-tr-[3.5rem] !rounded-tl-lg !rounded-br-lg !rounded-bl-lg";
  } else if (isRoundedCorners) {
    productRadiusClass = "!rounded-2xl";
  } else if (isDieCut) {
    productRadiusClass = "rounded-2xl";
  }

  const handlePlacementSelect = (id: PlacementId) => {
    setActivePlacement(id);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let isImage = file.type.startsWith("image/");
      let url = isImage ? URL.createObjectURL(file) : null;
      
      let pageCount = null;
      if (String(file.name || '').toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          
          try {
             const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
             const page = await pdf.getPage(1);
             const scale = 300 / 72; // Render at exactly 300 DPI equivalent
             const viewport = page.getViewport({ scale });
             const canvas = document.createElement("canvas");
             canvas.width = viewport.width;
             canvas.height = viewport.height;
             const ctx = canvas.getContext("2d");
             if (ctx) {
               await page.render({ canvasContext: ctx, canvas, viewport }).promise;
               url = canvas.toDataURL("image/png");
               isImage = true; // treat as image for preview and DPI check
             }
          } catch(err) {
             console.error("Failed to generate PDF preview:", err);
          }
          
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          pageCount = pdfDoc.getPageCount();
          
          let pagesVar = product?.variations?.find((v: any) => String(v.name || '').toLowerCase() === 'pages' || String(v.name || '').toLowerCase() === 'no. of pages');
          if (pagesVar) {
             const minQ = Math.max(pageCount, product?.minQty || 1);
             const exactOption = pagesVar.options.find((o: any) => {
               const optNum = Number(o.name.replace(/[^0-9]/g, ''));
               return optNum === minQ;
             });
             const largerOption = pagesVar.options.find((o: any) => {
               const optNum = Number(o.name.replace(/[^0-9]/g, ''));
               return optNum >= minQ;
             });
             const matchingOption = exactOption || largerOption;
             if (matchingOption) {
               setSelectedVariations(prev => ({...prev, [pagesVar.id]: matchingOption}));
             }
          } else {
            if (isDocumentPrinting) {
              const minPg = Math.max(pageCount, product?.minQty || (isCenterPinBinding ? 4 : 1));
              setDocumentPages(minPg);
              setMinDynamicPages(minPg);
            } else {
              const minQ = Math.max(pageCount, product?.minQty || 1);
              setBaseQuantity(Math.max(baseQuantity, minQ));
              setCardQuantity(Math.max(cardQuantity, minQ));
              setBrochureQty(Math.max(brochureQty, minQ));
              setStandeeQty(Math.max(standeeQty, minQ));
              setMinDynamicQty(minQ);
            }
          }
        } catch (pdfErr) {
          console.error("Failed to read PDF page count in browser:", pdfErr);
        }
      }

      setArtworks((prev) => {
        const existing = (prev[activePlacement] as any) || {};
        return {
          ...prev,
          [activePlacement]: {
            ...existing,
            file,
            previewUrl: url || "",
            fileName: file.name,
            isImage,
            scale: existing.scale || 1,
            x: existing.x || 0,
            y: existing.y || 0,
          },
        };
      });

      if (isImage && url) {
        const img = new Image();
        img.onload = () => {
          const getEstimatedDimensionsInches = () => {
            const activeVars = Object.values(getActiveVariations());
            if (String(product?.name || '').toLowerCase().includes("a3") || activeVars.some((v:any) => v.name?.includes("A3"))) return { w: 11.69, h: 16.54 };
            if (String(product?.name || '').toLowerCase().includes("a4") || activeVars.some((v:any) => v.name?.includes("A4"))) return { w: 8.27, h: 11.69 };
            if (String(product?.name || '').toLowerCase().includes("a5") || activeVars.some((v:any) => v.name?.includes("A5"))) return { w: 5.83, h: 8.27 };
            if (isBusinessCard) return { w: 3.5, h: 2 };
            if (isStandee) {
               if (standeeSize === "2.5x6") return { w: 30, h: 72 };
               if (standeeSize === "3x6") return { w: 36, h: 72 };
               if (standeeSize === "4x6") return { w: 48, h: 72 };
               return { w: 24, h: 60 };
            }
            return { w: 8.27, h: 11.69 };
          };
          
          const dim = getEstimatedDimensionsInches();
          const dpiArea = Math.sqrt((img.width * img.height) / (dim.w * dim.h));
          
          let warningLevel: 'not_printable' | 'poor' | 'fair' | 'good' | undefined = undefined;
          if (dpiArea < 150) {
            warningLevel = 'not_printable';
          } else if (dpiArea < 200) {
            warningLevel = 'poor';
          } else if (dpiArea < 290) {
            warningLevel = 'fair';
          } else {
            warningLevel = 'good';
          }
          
          if (warningLevel) {
            setArtworks((prev) => {
               if (!prev[activePlacement]) return prev;
               return {
                 ...prev,
                 [activePlacement]: {
                   ...prev[activePlacement],
                   dpi: dpiArea,
                   warningLevel
                 }
               };
            });
          }
        };
        img.src = url;
      }
      setShowCustomizer(false); // Switch away from customizer view if uploading

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeArtwork = () => {
    if (currentArtwork?.previewUrl) {
      URL.revokeObjectURL(currentArtwork.previewUrl);
    }
    setArtworks((prev) => {
      const updated = { ...prev };
      delete updated[activePlacement];
      return updated;
    });
    
    setMinDynamicQty(1);
    setMinDynamicPages(1);
    
    if (product) {
      const isIdCard = String(product?.name || '').toLowerCase().includes("id card") || String(product?.category || '').toLowerCase().includes("id card") || String(product?.name || '').toLowerCase().includes("badge") || String(product?.name || '').toLowerCase().includes("pvc");
      setBaseQuantity(product?.minQty || 1);
      setCardQuantity(product?.minQty || (isIdCard ? 1 : 100));
      setStandeeQty(product?.minQty || 1);
      setBrochureQty(product?.minQty || 25);
      
      if (isCenterPinBinding) {
        setDocumentPages(Math.max(4, product?.minQty || 4));
      } else {
        setDocumentPages(product?.minQty || 1);
      }

      const pagesVar = product?.variations?.find((v: any) => String(v.name || '').toLowerCase() === 'pages' || String(v.name || '').toLowerCase() === 'no. of pages');
      if (pagesVar && pagesVar.options && pagesVar.options.length > 0) {
        setSelectedVariations(prev => ({...prev, [pagesVar.id]: pagesVar.options[0]}));
      }
    }
  };

  const setScale = (scale: number) => {
    setArtworks((prev) => ({
      ...prev,
      [activePlacement]: { ...prev[activePlacement], scale },
    }));
  };

  const handleUpdateArtwork = (placement: string, updates: Partial<Artwork>) => {
    setArtworks((prev) => ({
      ...prev,
      [placement]: { ...prev[placement], ...updates },
    }));
  };

  const handleSaveCustomDesign = async (file: File, canvasState?: any) => {
    const isImage = file.type.startsWith("image/");
    const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;
    
    // Show a loading/uploading state in uploadProgress so the user has immediate feedback
    setUploadProgress({
      status: "uploading",
      percentage: 20,
      currentFile: "Saving design to Cloud Storage...",
      currentIndex: 0,
      totalFiles: 1,
    });

    try {
      // 1. Upload the canvas design file to the server (which uploads it to Firebase Storage)
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress({
            status: "uploading",
            percentage: Math.min(95, 20 + Math.round(percent * 0.6)),
            currentFile: "Uploading design...",
            currentIndex: 0,
            totalFiles: 1,
          });
        }
      });
      
      if (res.status === 200 || res.status === 201) {
        const { url, driveFileId } = res.data;
        
        // 2. Set artworks state with the uploaded remote URL
        setArtworks((prev) => ({
          ...prev,
          [activePlacement]: {
            file,
            previewUrl: localPreviewUrl,
            scale: 1,
            fileName: file.name,
            isImage,
            driveFileId,
            mediaUrl: url
          },
        }));

        // 3. If logged in, save the design to their profile!
        if (token) {
          setUploadProgress(prev => ({ ...prev, currentFile: "Saving to your profile..." }));
          
          const designPayload: any = {
            name: `Custom ${product?.name} Design`,
            productId: product?.id,
            productName: product?.name,
            productImage: displayImage,
            mediaUrl: url,
            driveFileId,
            placement: activePlacement,
            canvasState: canvasState || null
          };

          if (loadedDesignId) {
            designPayload.id = loadedDesignId;
          }

          await apiClient.post("/api/users/me/designs", {
            design: designPayload
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }

        setUploadProgress({
          status: "complete",
          percentage: 100,
          currentFile: "Design saved successfully!",
          currentIndex: 1,
          totalFiles: 1,
        });

        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, status: "idle" }));
        }, 3000);

      } else {
        throw new Error(res.data.error || "Failed to upload design");
      }
    } catch (err: any) {
      console.error("Failed to automatically upload design:", err);
      // Fallback: save only locally in case of network issue
      setArtworks((prev) => ({
        ...prev,
        [activePlacement]: {
          file,
          previewUrl: localPreviewUrl,
          scale: 1,
          fileName: file.name,
          isImage
        },
      }));
      setUploadProgress({
        status: "error",
        percentage: 100,
        currentFile: err.message || "Failed to save design online. Stored locally.",
        currentIndex: 0,
        totalFiles: 1,
      });
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, status: "idle" }));
      }, 5000);
    }

    setShowCustomizer(false);
  };

  const activeArtworks = Object.entries(artworks).filter(([id]) => {
    if (isBusinessCard) {
      // If front-only selected, hide back artwork
      if (cardSides === "front" && id === "back") return false;
      const info = BUSINESS_CARD_PLACEMENTS[id];
      if (!info) return false;
      return info.view === currentView;
    }
    if (!isApparel) return true;
    const info = APPAREL_PLACEMENTS[id];
    if (!info) return false;
    return info.view === currentView;
  });

  return (
    <>
      <SEO 
        title={product?.metaTitle || `${product?.name || 'Product Details'} - Custom Printing | Printfield`}
        description={product?.metaDescription || product?.cardDescription || product?.description || 'Custom printing services with fast turnaround and high quality at Printfield.'}
        canonicalUrl={`/product/${product?.slug || product?.id || ''}`}
        ogImage={product?.image}
        schema={product ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product?.name,
          "image": [product?.image, ...(Array.isArray(product?.images) ? product?.images : [])].filter(Boolean),
          "description": product?.metaDescription || product?.cardDescription || product?.description || `Custom printed ${product?.name} with high-quality material and finish.`,
          "sku": product?.id,
          "brand": {
            "@type": "Brand",
            "name": "Printfield"
          },
          "offers": {
            "@type": "Offer",
            "price": product?.price || 0,
            "priceCurrency": "INR",
            "priceValidUntil": "2026-12-31",
            "validFrom": "2026-01-01",
            "url": typeof window !== 'undefined' ? window.location.origin + `/product/${product?.slug || product?.id}` : `https://www.printfieldonline.com/product/${product?.slug || product?.id}`,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product?.isDisabled ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "Printfield",
              "areaServed": ["Whitefield", "Brookefield", "Marathahalli", "ITPL", "Mahadevapura", "Bengaluru"]
            },
            "shippingDetails": {
              "@type": "OfferShippingDetails",
              "shippingRate": {
                "@type": "MonetaryAmount",
                "value": "0",
                "currency": "INR"
              },
              "shippingDestination": {
                "@type": "DefinedRegion",
                "addressCountry": "IN"
              },
              "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "handlingTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": 3,
                  "unitCode": "DAY"
                },
                "transitTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": 5,
                  "unitCode": "DAY"
                }
              }
            },
            "hasMerchantReturnPolicy": {
              "@type": "MerchantReturnPolicy",
              "applicableCountry": "IN",
              "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
              "merchantReturnDays": 7,
              "returnMethod": "https://schema.org/ReturnByMail",
              "returnFees": "https://schema.org/ReturnShippingFees"
            }
          }
        }) : undefined}
      />
      {showCustomizer && (
        <ErrorBoundary><DesignEditor
          product={product}
          activePlacement={activePlacement}
          selectedColor={selectedColor}
          onSave={handleSaveCustomDesign}
          onClose={() => setShowCustomizer(false)}
          initialCanvasState={initialCanvasState}
         /></ErrorBoundary>
      )}
      <Layout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 border-b border-gray-100 mb-8">
          <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to={`/category/${encodeURIComponent(product?.category || '')}`} className="hover:text-purple-600 transition-colors">{product?.category}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product?.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-20">
          {/* Product Image */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            <div
              ref={containerRef}
              className="w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-gray-100 relative shadow-sm"
            >
              <div className={`w-full relative transition-transform duration-700 ease-in-out ${
                (!isApparel && currentView === "left") ? "scale-[1.8] origin-[80%_40%]" :
                (!isApparel && currentView === "right") ? "scale-[1.8] origin-[20%_40%]" :
                (!isApparel && currentView === "back") ? "scale-x-[-1]" : ""
              }`}>
                <div className="w-full aspect-[4/3] max-h-[380px] sm:max-h-none relative bg-white overflow-hidden flex items-center justify-center">
                  
                   {/* Polo T-Shirt Live Preview */}
                   {isPolo && selectedColor && !show3D && !showStandardImages && (
                     <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
                        <PoloTshirtPreview
                          color={selectedColor}
                          productImages={validImages}
                          productColors={product?.colors || []}
                          className="w-full h-full"
                          designImage={artworks?.[activePlacement]?.previewUrl || null}
                          placement={activePlacement}
                        />
                     </div>
                   )}

                   {/* 3D Preview */}
                   {isPolo && show3D && !showStandardImages && (
                     <div className="absolute inset-0 z-30 bg-white">
                       <React.Suspense fallback={
                         <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                           <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
                           <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
                         </div>
                       }>
                         <Polo3DPreview
                            color={(() => {
                              if (!selectedColor) return '#2962a3';
                              if (typeof selectedColor === 'object') {
                                return selectedColor.hex || '#2962a3';
                              }
                              // If it's already a hex string
                              if (typeof selectedColor === 'string' && selectedColor.startsWith('#')) return selectedColor;
                              // Try to find hex from product colors by name
                              const found = (product?.colors || []).find((c: any) => c.name?.toLowerCase() === String(selectedColor).toLowerCase());
                              return found?.hex || '#2962a3';
                            })()}
                            className="w-full h-full"
                          />
                       </React.Suspense>
                     </div>
                   )}

                   {/* Base Transparent Mockup */}
                                    {!displayImage || brokenImages[displayImage] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-50 text-gray-400 relative z-10">
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-3 stroke-1 text-gray-300 animate-pulse" />
                      <p className="text-xs sm:text-sm font-medium text-gray-500 text-center">Preview not available for this product</p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-1 text-center">Our team is updating the product asset</p>
                    </div>
                   ) : (
                    <>
                      {!(loadedImages[displayImage] || loadedImages[getOptimizedImage(displayImage, 1000) || ""]) && (
                        <div className="absolute inset-0 z-20 bg-gray-50/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-gray-400">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin mb-2" />
                          <p className="text-xs font-medium text-gray-500">Loading preview...</p>
                        </div>
                      )}
                      <img referrerPolicy="no-referrer"
                        src={getOptimizedImage(displayImage, 1000) || undefined}
                        alt={product?.name}
                        onLoad={() => handleImageLoaded(displayImage)}
                        onError={() => handleImageError(displayImage)}
                        onClick={() => {
                          if (validImages.length > 0) {
                            const idx = validImages.indexOf(displayImage);
                            setProductGalleryLightboxIndex(idx >= 0 ? idx : 0);
                          }
                        }}
                        className={`w-full h-full object-contain absolute inset-0 transition-opacity duration-200 z-10 cursor-zoom-in hover:scale-[1.01] ${
                          (loadedImages[displayImage] || loadedImages[getOptimizedImage(displayImage, 1000) || ""])
                            ? "opacity-100"
                            : "opacity-80"
                        } ${currentView === "back" ? "scale-x-[-1]" : ""}`}
                        loading="eager"
                        fetchPriority="high"
                        width="1000"
                        height="1000"
                        />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
              {validImages && validImages.length > 0 ? (
                validImages.map((img, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => {
                      preloadAdjacent(i);
                      setSelectedImage(img);
                      if (product?.colors && product?.colors.length > 0) {
                        const matchedCol = product?.colors.find((c: any) => {
                          const cName = typeof c === 'string' ? c : (c?.name || '');
                          const cImg = typeof c === 'object' ? c?.image : null;
                          if (cImg === img) return true;
                          if (cName && getColorMatchingImage(cName) === img) return true;
                          return false;
                        });
                        if (matchedCol) setSelectedColor(matchedCol);
                      }
                    }}
                    onClick={() => {
                      setSelectedImage(img);
                      setShowStandardImages(true);
                      setShow3D(false);
                      if (product?.colors && product?.colors.length > 0) {
                        const matchedCol = product?.colors.find((c: any) => {
                          const cName = typeof c === 'string' ? c : (c?.name || '');
                          const cImg = typeof c === 'object' ? c?.image : null;
                          if (cImg === img) return true;
                          if (cName && getColorMatchingImage(cName) === img) return true;
                          return false;
                        });
                        if (matchedCol) setSelectedColor(matchedCol);
                      }
                    }}
                    className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer bg-white transition-all ${
                      displayImage === img 
                        ? "border-purple-600 ring-2 ring-purple-600/20 scale-102 shadow-xs" 
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={getOptimizedImage(img, 150) || undefined}
                      alt={`${product?.name} ${i + 1}`}
                      onError={() => handleImageError(img)}
                      className="w-full h-full object-contain p-1.5"
                      loading="lazy"
                      width="80"
                      height="80"
                     />
                  </div>
                ))
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-purple-600 cursor-pointer bg-white flex items-center justify-center"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                    <ImageIcon className="w-5 h-5 stroke-1 text-gray-300" />
                  </div>
                </div>
              )}
            </div>

            {/* 3D Preview Toggle for Polo */}
            {isPolo && selectedColor && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setShow3D(false); setShowStandardImages(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !show3D && !showStandardImages ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Photo
                </button>
                <button
                  onClick={() => { setShow3D(true); setShowStandardImages(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    show3D ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  3D View
                </button>
                <button
                  onClick={() => { setShowStandardImages(true); setShow3D(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    showStandardImages ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Images
                </button>
              </div>
            )}

          </div>

          {/* Product Info */}
          <div className="flex flex-col min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-purple-600 uppercase">
                {product?.category}
              </span>
              {product?.isBestseller && (
                <span className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                  BESTSELLER
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-4">
              {product?.name}
            </h1>
            <ProductFormattedDescription description={product?.description} features={product?.features} />

            <div className="flex items-baseline gap-2 mb-6 sm:mb-8 flex-wrap">
              <span className="text-xs sm:text-sm text-purple-700 font-semibold uppercase tracking-wider">
                Price
              </span>
              <span className="text-xl sm:text-2xl font-bold text-purple-950 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                Quote on Request
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {isBusinessCard ? `for ${cardQuantity} cards` : isBrochure ? `for ${brochureQty} brochures` : isStandee ? `for ${standeeQty} standees` : isDocumentPrinting ? `for ${documentPages} pages × ${baseQuantity} copies` : `for ${baseQuantity} pcs`}
              </span>
            </div>

            {isBusinessCard && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Quantity {product?.minQty ? `(Min: ${product?.minQty})` : ''} {product?.qtyMultiple ? `(Multiples of ${product?.qtyMultiple})` : `(Multiples of ${qtyMultipleDefault})`}
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={Math.max(product?.minQty || minQtyDefault, minDynamicQty)}
                    step={product?.qtyMultiple || qtyMultipleDefault}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    value={cardQuantity}
                    onChange={(e) => {
                       const val = Number(e.target.value);
                       setCardQuantity(val);
                    }}
                    onBlur={(e) => {
                       let val = Number(e.target.value);
                       const min = Math.max(product?.minQty || minQtyDefault, minDynamicQty);
                       const multiple = product?.qtyMultiple || qtyMultipleDefault;
                       if (val < min) val = min;
                       val = Math.round(val / multiple) * multiple;
                       if (val < min) val = val + multiple;
                       setCardQuantity(val);
                    }}
                   />
                  <span className="text-gray-500 font-medium">Cards</span>
                </div>
              </div>
            )}

            {isBusinessCard && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Printing Sides
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setCardSides("front");
                      handlePlacementSelect("front" as PlacementId);
                      // remove back artwork when switching to front-only
                      if (artworks["back"]) {
                        const newArtworks = { ...artworks };
                        delete newArtworks["back"];
                        setArtworks(newArtworks);
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${
                      cardSides === "front"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front Only
                  </button>
                  <button
                    onClick={() => {
                      setCardSides("front-back");
                    }}
                    className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${
                      cardSides === "front-back"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front & Back
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Print Side
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePlacementSelect("front" as PlacementId)}
                    className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                      activePlacement === "front"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front View
                  </button>
                  {cardSides === "front-back" && (
                    <button
                      onClick={() => handlePlacementSelect("back" as PlacementId)}
                      className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                        activePlacement === "back"
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Back View
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isBusinessCard && product?.colors && product?.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Color:{" "}
                  <span className="text-purple-600 font-medium ml-1">
                    {typeof selectedColor === 'string' ? selectedColor : (selectedColor?.name || '')}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  {product?.colors.map((color, colorIdx) => {
                    const colorName = typeof color === 'string' ? color : (color?.name || '');
                    const colorHex = typeof color === 'object' ? color?.hex : undefined;
                    const colorImage = typeof color === 'object' ? color?.image : undefined;
                    const isSelected = selectedColor?.name === colorName || (typeof selectedColor === 'string' && selectedColor === colorName);
                    const { background, borderNeeded } = getColorStyle(colorHex || colorName);
                    const colorLower = colorName.toLowerCase();
                    const isLightColor = borderNeeded || ['yellow', 'cream', 'white', 'gold', 'light', 'beige', 'natural'].some(k => colorLower.includes(k));

                    return (
                      <button
                        key={`${colorName}-${colorIdx}`}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color); 
                          // If in Standard Images view, switch to Photo to show new color's standard images
                          // If in 3D View or Photo View, stay in that mode and just update color
                          if (showStandardImages) {
                            setShowStandardImages(false);
                            setShow3D(false);
                          }
                          const matchImg = colorImage || getColorMatchingImage(colorName);
                          if (matchImg) {
                            setSelectedImage(matchImg);
                          } else {
                            setSelectedImage(null);
                          }

                          if (product?.variations && product?.variations.length > 0) {
                            product?.variations.forEach((v: any) => {
                              if (isColorCategory(v.name, v.options)) {
                                const matchingOpt = v.options.find((o: any) => {
                                  const oName = typeof o === 'string' ? o : (o?.name || '');
                                  return oName.toLowerCase().trim() === colorName.toLowerCase().trim();
                                });
                                if (matchingOpt) {
                                  setSelectedVariations(prev => ({ ...prev, [v.id]: matchingOpt }));
                                }
                              }
                            });
                          }
                        }}
                        onMouseEnter={() => setHoveredColor(color)}
                        onMouseLeave={() => setHoveredColor(null)}
                        className={`group relative flex items-center justify-center w-12 h-12 rounded-full focus:outline-none transition-all ${
                          isSelected
                            ? "ring-2 ring-offset-2 ring-purple-600 scale-110 shadow-md z-10"
                            : "hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100"
                        }`}
                        aria-label={`Select ${colorName} color`}
                      >
                        <span
                          className={`w-full h-full rounded-full block ${
                            borderNeeded ? "border border-gray-300" : "border border-black/10"
                          }`}
                          style={{ background }}
                        />
                        {isSelected && (
                          <span
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/5"
                          >
                            <Check className={`w-5 h-5 stroke-[2.5] ${isLightColor ? "text-gray-900" : "text-white"} drop-shadow-sm`} />
                          </span>
                        )}
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                          {colorName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {isApparel && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Print Position
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(APPAREL_PLACEMENTS).map(([id, info]) => (
                    <button
                      key={id}
                      onClick={() => handlePlacementSelect(id as PlacementId)}
                      className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                        activePlacement === id
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isBrochure && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Brochure Fold
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {["Bi Fold", "Tri Fold", "Z Fold"].map((f) => {
                      const isDL = brochureStyle === "DL";
                      const disabled = isDL && f !== "Tri Fold";
                      return (
                        <button
                          key={f}
                          disabled={disabled}
                          onClick={() => setBrochureFold(f)}
                          className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                            brochureFold === f
                              ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          } ${disabled ? "opacity-30 cursor-not-allowed hover:bg-transparent hover:border-gray-200" : ""}`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Style / Size
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {["A5", "A6", "DL"].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setBrochureStyle(s);
                          if (s === "DL") setBrochureFold("Tri Fold");
                        }}
                        className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                          brochureStyle === s
                            ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Quantity {product?.minQty ? `(Min: ${product?.minQty})` : ''} {product?.qtyMultiple ? `(Multiples of ${product?.qtyMultiple})` : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product?.minQty || 25, minDynamicQty)}
                      step={product?.qtyMultiple || 25}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={brochureQty}
                      onChange={(e) => {
                         const val = Number(e.target.value);
                         setBrochureQty(val);
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product?.minQty || 25, minDynamicQty);
                         const multiple = product?.qtyMultiple || 25;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setBrochureQty(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium">Brochures</span>
                  </div>
                </div>
              </div>
            )}

            {isStandee && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Size (ft)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["2x5", "2.5x6", "3x6", "4x6"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStandeeSize(s)}
                        className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                          standeeSize === s
                            ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Quantity {product?.minQty ? `(Min: ${product?.minQty})` : ''} {product?.qtyMultiple ? `(Multiples of ${product?.qtyMultiple})` : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product?.minQty || 1, minDynamicQty)}
                      step={product?.qtyMultiple || 1}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={standeeQty}
                      onChange={(e) => {
                         const val = Number(e.target.value);
                         setStandeeQty(val);
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product?.minQty || 1, minDynamicQty);
                         const multiple = product?.qtyMultiple || 1;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setStandeeQty(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium">Standees</span>
                  </div>
                  {standeeQty > 1 && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      {standeeQty >= 2 && standeeQty <= 5 ? "5% Bulk Discount Applied" :
                       standeeQty > 5 && standeeQty <= 10 ? "10% Bulk Discount Applied" :
                       standeeQty > 10 ? "15% High-Volume Discount Applied" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isAcrylic && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Shape
                  </h3>
                  <div className="flex flex-col gap-2">
                    {["Square/Rectangle", "Circle/Oval", "Full Arch", "Half Left Arch", "Half Right Arch"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAcrylicShape(s)}
                        className={`text-left w-full py-4 px-4 rounded-xl border-2 transition-all ${
                          acrylicShape === s
                            ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                            : "border-transparent bg-white hover:border-gray-300 text-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}



            {product?.variations && product?.variations.length > 0 && (
              <div className="mb-8 space-y-5">
                {product?.variations.map((variationCategory: any, catIdx: number) => {
                  const getOptName = (o: any) => typeof o === 'string' ? o : (o?.name || '');
                  const getOptImg = (o: any) => typeof o === 'object' ? o?.image : undefined;

                  const isBillBook = String(product?.name || '').toLowerCase().includes("bill book") || String(product?.category || '').toLowerCase().includes("bill book");
                  const is2ndDuplicateConfig = String(variationCategory.name || '').toLowerCase().includes("2nd duplicate");
                  
                  // If it's a bill book and it's 2nd duplicate, check pad type
                  if (isBillBook && is2ndDuplicateConfig) {
                     // Check if pad type is "+2 duplicate"
                     let has2Duplicate = false;
                     product?.variations.forEach((vc: any) => {
                        const isPadOrType = String(vc.name || '').toLowerCase().includes("pad") || String(vc.name || '').toLowerCase().includes("type") || String(vc.name || '').toLowerCase().includes("duplicate");
                        const sel = selectedVariations[vc.id];
                        const selName = getOptName(sel);
                        if (isPadOrType && selName) {
                           if (selName.toLowerCase().includes("+2 duplicate")) {
                              has2Duplicate = true;
                           }
                        }
                     });
                     if (!has2Duplicate) {
                        return null; // hide 2nd duplicate sheet
                     }
                  }

                  let filteredOptions = Array.isArray(variationCategory.options) ? variationCategory.options : [];
                  
                  if (product?.name === 'Cotton Lanyards (Single color printing)') {
                    const vcName = String(variationCategory.name || '').trim().toLowerCase();
                    if (vcName === 'print colour' || vcName === 'print colors' || vcName === 'print colours') {
                      const lanyardVc = product?.variations.find((v: any) => String(v.name || '').trim().toLowerCase() === 'lanyard colour');
                      if (lanyardVc) {
                        const selectedLanyardColor = getOptName(selectedVariations[lanyardVc.id]).trim().toLowerCase();
                        if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
                          filteredOptions = variationCategory.options.filter((o: any) => getOptName(o).trim().toLowerCase() === 'white');
                        } else if (selectedLanyardColor === 'yellow') {
                          filteredOptions = variationCategory.options.filter((o: any) => {
                            const name = getOptName(o).trim().toLowerCase();
                            return name === 'black' || name === 'red';
                          });
                        } else if (selectedLanyardColor === 'red') {
                          filteredOptions = variationCategory.options.filter((o: any) => {
                            const name = getOptName(o).trim().toLowerCase();
                            return name === 'white' || name === 'black';
                          });
                        }
                      }
                    }
                  }

                  const selectedOpt = selectedVariations[variationCategory.id];
                  const selectedOptName = getOptName(selectedOpt);
                  const isColorVar = isColorCategory(variationCategory.name, filteredOptions);

                  const handleOptSelect = (opt: any) => {
                    const optName = getOptName(opt);
                    const optImg = getOptImg(opt);
                    if (isColorVar && optName) {
                      const colorStyle = getColorStyle(optName);
                      const matchImg = optImg || getColorMatchingImage(optName);
                      setSelectedColor({
                        name: optName,
                        hex: colorStyle.background,
                        image: matchImg || undefined
                      });
                      if (matchImg) {
                        setSelectedImage(matchImg);
                      } else {
                        setSelectedImage(null);
                      }

                      if (product?.colors && product?.colors.length > 0) {
                        const matchCol = product?.colors.find((c: any) => {
                          const cName = typeof c === 'string' ? c : (c?.name || '');
                          return cName.toLowerCase().trim() === optName.toLowerCase().trim();
                        });
                        if (matchCol) {
                          setSelectedColor(matchCol);
                        }
                      }
                    }
                    setSelectedVariations(prev => {
                      const newState = { ...prev, [variationCategory.id]: opt };
                      
                      // Handle Cotton Lanyards dependency check when Lanyard Colour is updated
                      if (product?.name === 'Cotton Lanyards (Single color printing)' && String(variationCategory.name || '').trim().toLowerCase() === 'lanyard colour') {
                        const selectedLanyardColor = optName.trim().toLowerCase();
                        const printColourVc = product?.variations.find((v: any) => {
                          const name = String(v.name || '').trim().toLowerCase();
                          return name === 'print colour' || name === 'print colors' || name === 'print colours';
                        });
                        if (printColourVc) {
                          let allowedPrintColours: string[] = [];
                          if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
                            allowedPrintColours = ['white'];
                          } else if (selectedLanyardColor === 'yellow') {
                            allowedPrintColours = ['black', 'red'];
                          } else if (selectedLanyardColor === 'red') {
                            allowedPrintColours = ['white', 'black'];
                          }
                          
                          const currentPrintColour = getOptName(newState[printColourVc.id]).trim().toLowerCase();
                          if (allowedPrintColours.length > 0 && !allowedPrintColours.includes(currentPrintColour)) {
                            const firstAllowed = printColourVc.options.find((o: any) => allowedPrintColours.includes(getOptName(o).trim().toLowerCase()));
                            if (firstAllowed) {
                              newState[printColourVc.id] = firstAllowed;
                            }
                          }
                        }
                      }
                      
                      return newState;
                    });
                  };

                  const catKey = variationCategory.id ? `${variationCategory.id}-${catIdx}` : `var-cat-${variationCategory.name || catIdx}`;
                  if (isColorVar) {
                    const vcNameLower = String(variationCategory.name || '').trim().toLowerCase() || '';
                    const isMainColorConcept = vcNameLower === 'color' || vcNameLower === 'colour' || vcNameLower === 'colors' || vcNameLower === 'colours';
                    if (!isBusinessCard && isMainColorConcept && product?.colors && product?.colors.length > 0) {
                      return null;
                    }
                    return (
                      <div key={catKey} className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
                          {variationCategory.name}:{" "}
                          <span className="text-purple-600 font-medium ml-1">
                            {selectedOptName}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center pt-0.5">
                          {filteredOptions.map((opt: any, idx: number) => {
                            const optName = getOptName(opt);
                            const isSelected = selectedOptName === optName;
                            const { background, borderNeeded } = getColorStyle(optName);
                            const optLower = optName.toLowerCase();
                            const isLightColor = borderNeeded || ['yellow', 'cream', 'white', 'gold', 'light', 'beige', 'natural'].some(k => optLower.includes(k));

                            return (
                              <button
                                key={opt?.id ? `${opt.id}-${idx}` : `${optName || 'opt'}-${idx}`}
                                type="button"
                                onClick={() => handleOptSelect(opt)}
                                aria-label={`Select ${optName}`}
                                className={`group relative flex items-center justify-center w-10 h-10 rounded-full focus:outline-none transition-all ${
                                  isSelected
                                    ? "ring-2 ring-offset-2 ring-purple-600 scale-110 shadow-md z-10"
                                    : "hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100"
                                }`}
                              >
                                <span
                                  className={`w-full h-full rounded-full block ${
                                    borderNeeded ? "border border-gray-300" : "border border-black/10"
                                  }`}
                                  style={{ background }}
                                />
                                {isSelected && (
                                  <span
                                    className={`absolute inset-0 flex items-center justify-center ${
                                      isLightColor ? "text-gray-900" : "text-white"
                                    }`}
                                  >
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  </span>
                                )}
                                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                                  {optName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={catKey} className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                        {variationCategory.name}
                      </h3>
                      <div className="relative min-w-0">
                        <select
                          className="w-full min-w-0 max-w-full appearance-none bg-white border border-gray-300 hover:border-gray-400 px-3.5 py-2.5 sm:px-4 sm:py-3 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-xs sm:text-sm transition-all truncate"
                          value={selectedOptName}
                          onChange={(e) => {
                            const opt = variationCategory.options.find((o: any) => getOptName(o) === e.target.value);
                            if (opt) {
                              handleOptSelect(opt);
                            }
                          }}
                        >
                          {filteredOptions.map((opt: any, idx: number) => {
                            const optName = getOptName(opt);
                            return (
                              <option key={opt?.id ? `${opt.id}-${idx}` : `${optName || 'opt'}-${idx}`} value={optName}>
                                {optName}
                              </option>
                            );
                          })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <ChevronDown className="h-4 w-4"  />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isBusinessCard && !isBrochure && !isStandee && (
              <div className="mb-6 space-y-6">
                {isDocumentPrinting && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">No. of Pages</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={Math.max(isCenterPinBinding ? 4 : 1, minDynamicPages)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        value={documentPages}
                        onChange={(e) => {
                           setDocumentPages(Number(e.target.value));
                        }}
                        onBlur={(e) => {
                           let val = Number(e.target.value);
                           const minVal = Math.max(isCenterPinBinding ? 4 : 1, minDynamicPages);
                           if (val < minVal) val = minVal;
                           setDocumentPages(val);
                        }}
                       />
                      <span className="text-gray-500 font-medium whitespace-nowrap">Pages</span>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{isDocumentPrinting ? "No. of Copies" : "Quantity"} {product?.minQty ? `(Min: ${product?.minQty})` : ''} {product?.qtyMultiple ? `(Multiples of ${product?.qtyMultiple})` : ''}</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product?.minQty || 1, minDynamicQty)}
                      step={product?.qtyMultiple || 1}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={baseQuantity}
                      onChange={(e) => {
                         setBaseQuantity(Number(e.target.value));
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product?.minQty || 1, minDynamicQty);
                         const multiple = product?.qtyMultiple || 1;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setBaseQuantity(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium whitespace-nowrap">{isDocumentPrinting ? "Copies" : "Pieces"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto space-y-4 pt-4 border-t border-gray-100">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.ai,.psd"
               />
              
              {currentArtwork && (
                <div className="flex flex-col gap-3">
                  {/* Large visual preview for images */}
                  {currentArtwork.isImage && currentArtwork.previewUrl && (
                    <div className="relative group overflow-hidden rounded-xl border border-purple-200 bg-slate-50 p-2.5 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 self-start mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Active Design Preview ({activePlacement})
                      </p>
                      <div 
                        onClick={() => setLightboxImage(currentArtwork.previewUrl)}
                        className="relative w-full aspect-[2/1] bg-white rounded-lg overflow-hidden border border-gray-150 flex items-center justify-center cursor-zoom-in hover:border-purple-400 transition-colors group/img"
                      >
                        <img 
                          referrerPolicy="no-referrer" 
                          src={currentArtwork.previewUrl} 
                          alt="Uploaded design file preview" 
                          className="max-w-full max-h-full object-contain p-1.5 transition-transform duration-300 group-hover/img:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-purple-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/95 text-xs font-bold text-purple-700 px-3 py-1.5 rounded-lg shadow-md border border-purple-100 flex items-center gap-1">
                            Click to Zoom
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    {currentArtwork.isImage && currentArtwork.previewUrl ? (
                      <img referrerPolicy="no-referrer" src={currentArtwork.previewUrl || undefined} alt="Preview" className="w-10 h-10 object-cover rounded-md bg-white border border-purple-200"  />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-white border border-purple-200 text-purple-600 rounded-md">
                        <FileText className="w-5 h-5"  />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentArtwork.fileName}</p>
                      <p className="text-xs text-gray-500">Uploaded for {activePlacement}</p>
                    </div>
                    <button onClick={removeArtwork} className="p-2 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm hover:shadow">
                      <Trash2 className="w-4 h-4"  />
                    </button>
                  </div>
                  {currentArtwork.warningLevel === 'not_printable' && (
                    <div className="text-xs text-red-700 bg-red-100 p-2 rounded border border-red-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Not Printable:</strong> This artwork resolution is critically low ({Math.round(currentArtwork.dpi || 0)} DPI, below 150 DPI). It will look very pixelated when printed. We recommend 300 DPI or higher.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'poor' && (
                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded border border-orange-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Poor Print Quality:</strong> This artwork resolution is low ({Math.round(currentArtwork.dpi || 0)} DPI). It may look blurry when printed. We recommend 300 DPI or higher.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'fair' && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Satisfactory Print Quality:</strong> This artwork ({Math.round(currentArtwork.dpi || 0)} DPI) is acceptable but may not be perfectly crisp. For best results, use 300 DPI.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'good' && (
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-300 flex items-start gap-1.5">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Good Print Quality:</strong> This artwork resolution is great ({Math.round(currentArtwork.dpi || 0)} DPI) for a high-quality print.</span>
                    </div>
                  )}
                </div>
              )}

              {hasNoValidProductImage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                  <span>This product is currently disabled because preview images are unavailable.</span>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={() => {
                    if (hasNoValidProductImage) return;
                    setShowInstructionsModal(true);
                  }}
                  disabled={isAdding || hasNoValidProductImage}
                  className="w-full text-lg h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="mr-2 h-5 w-5"  />
                  {isAdding ? "Adding..." : hasNoValidProductImage ? "Product Disabled" : "Add to Cart"}
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleUploadClick}
                    disabled={hasNoValidProductImage}
                    className="text-base h-12 rounded-xl border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UploadCloud className="mr-2 h-4 w-4 text-gray-500"  />
                    {currentArtwork ? "Change Artwork" : "Upload Artwork"}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowCustomizer(true)}
                    disabled={hasNoValidProductImage}
                    className="text-base h-12 rounded-xl border-2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600"  />
                    Design Online <span className="text-[10px] bg-purple-600 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">Free</span>
                  </Button>
                </div>

                {isBusinessCard &&
                  activePlacement === "back" &&
                  artworks["front"] &&
                  !artworks["back"] && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setArtworks((prev) => ({
                          ...prev,
                          back: prev["front"],
                        }));
                      }}
                      className="w-full text-base h-12 rounded-xl border-2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm transition-all"
                    >
                      Reuse Front Art
                    </Button>
                  )}
              </div>
              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 mt-4 mb-2">
                <div className="flex flex-col items-center text-center p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-[11px] font-medium text-green-700">Quality Assured</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[11px] font-medium text-blue-700">Fast Turnaround</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 bg-purple-50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-[11px] font-medium text-purple-700">Secure Order</span>
                </div>
              </div>
              <p className="text-sm text-center text-gray-500 font-medium pt-2 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4"  /> 100% Satisfaction Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You Might Also Like
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Explore other popular items from our collection.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {suggestedProducts.map((product, idx) => (
              <ProductCard key={`${product?.id}-${idx}`} product={product}  />
            ))}
          </div>
        </div>
      )}

      {/* Product FAQ */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Frequently Asked Questions about {product?.name}
        </h2>
        <div className="space-y-3">
          {[
            { q: `What is the price of ${product?.name}?`, a: `The price for ${product?.name} is available on request. Contact us at +91 96063 71222 for bulk pricing and custom orders.` },
            { q: `Can I customize ${product?.name}?`, a: `Yes, all our products are fully customizable. You can add your logo, text, or custom design to ${product?.name}. We offer DTF printing, screen printing, and embroidery options.` },
            { q: `What is the minimum order quantity?`, a: `For most products, minimum order is 10 pieces. For bulk screen printing, minimum is 50 pieces. Contact us for specific requirements.` },
            { q: `Do you deliver to Whitefield and nearby areas?`, a: `Yes, we deliver to Whitefield, ITPL, Brookefield, Marathahalli, and all nearby areas in Bengaluru. Delivery is usually within 1-2 days for local orders.` },
          ].map((faq, idx) => (
            <details key={idx} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                {faq.q}
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Delivery & Support
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We ensure your products arrive on time and looking perfect.
            </p>
          </div>
        <div className="grid sm:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Truck className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">Custom Quotation</h4>
            <p className="text-sm text-gray-500">Wholesale pricing calculated upon request.</p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">No Upfront Payment</h4>
            <p className="text-sm text-gray-500">Submit specs & receive quotation by email.</p>
            <a
              href={`https://wa.me/919606371222?text=${encodeURIComponent(`Hi Printfield, I'm interested in: ${product?.name || 'a product'}. Please share details.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors mt-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp for Quick Quote
            </a>
          </div>
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <UploadCloud className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">Design Verification</h4>
            <p className="text-sm text-gray-500">Free digital proofing before production.</p>
          </div>
        </div>
      </div>
      </div>

      {uploadProgress.status !== "idle" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {uploadProgress.status === "uploading" && (
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <UploadCloud className="w-10 h-10 animate-bounce"  />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin"  />
              </div>
            )}
            
            {uploadProgress.status === "complete" && (
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Check className="w-10 h-10"  />
              </div>
            )}

            {uploadProgress.status === "error" && (
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-semibold">!</span>
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {uploadProgress.status === "uploading" && "Uploading Artwork..."}
              {uploadProgress.status === "complete" && "Upload Complete!"}
              {uploadProgress.status === "error" && "Upload Failed"}
            </h3>

            {uploadProgress.status === "uploading" && (
              <>
                <p className="text-sm text-gray-500 mb-4 truncate w-full px-4">
                  {uploadProgress.currentFile}
                </p>
                
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress.percentage}%` }}
                   />
                </div>
                
                <div className="flex justify-between w-full text-xs font-semibold text-gray-500 px-1">
                  <span>
                    File {uploadProgress.currentIndex + 1} of {uploadProgress.totalFiles}
                  </span>
                  <span className="text-purple-600 font-bold">
                    {uploadProgress.percentage}%
                  </span>
                </div>
              </>
            )}

            {uploadProgress.status === "complete" && (
              <p className="text-sm text-gray-500">
                Your artwork has been uploaded and added to your cart successfully!
              </p>
            )}

            {uploadProgress.status === "error" && (
              <>
                <p className="text-sm text-red-500 mb-6">
                  An error occurred while uploading your artwork. Please try again.
                </p>
                <button
                  onClick={() => setUploadProgress({ status: "idle", percentage: 0, currentFile: "", currentIndex: 0, totalFiles: 0 })}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 md:p-10 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-4xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-100/50 rounded-xl">
                <img
                  referrerPolicy="no-referrer"
                  src={lightboxImage}
                  alt="Full resolution artwork preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="py-3 px-4 flex items-center justify-between border-t border-slate-100 bg-white">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Design Artwork Inspection
                </span>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {productGalleryLightboxIndex !== null && validImages && validImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col justify-between bg-black/95 p-4 md:p-6 backdrop-blur-md select-none"
            onClick={() => setProductGalleryLightboxIndex(null)}
          >
            {/* Top Bar with Info and Close */}
            <div className="flex items-center justify-between w-full text-white z-10 px-2 py-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold truncate max-w-xs md:max-w-md text-gray-200">
                  {product?.name || "Product Gallery"}
                </h3>
                <p className="text-xs text-gray-400">
                  Image {productGalleryLightboxIndex + 1} of {validImages.length}
                </p>
              </div>
              <button
                onClick={() => setProductGalleryLightboxIndex(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Area with Navigation Arrows and Image */}
            <div className="relative flex-1 flex items-center justify-center w-full my-4" onClick={(e) => e.stopPropagation()}>
              {/* Prev Button */}
              <button
                onClick={() => setProductGalleryLightboxIndex((productGalleryLightboxIndex - 1 + validImages.length) % validImages.length)}
                className="absolute left-2 md:left-6 z-10 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all border border-white/10 hover:scale-105 active:scale-95 focus:outline-none"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Next Button */}
              <button
                onClick={() => setProductGalleryLightboxIndex((productGalleryLightboxIndex + 1) % validImages.length)}
                className="absolute right-2 md:right-6 z-10 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all border border-white/10 hover:scale-105 active:scale-95 focus:outline-none"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Display Image with Animation */}
              <div className="w-full h-full max-w-5xl max-h-[72vh] flex items-center justify-center p-2">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={productGalleryLightboxIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    referrerPolicy="no-referrer"
                    src={validImages[productGalleryLightboxIndex]}
                    alt={`${product?.name} preview ${productGalleryLightboxIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Section: Thumbnails and Hint */}
            <div className="w-full flex flex-col items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
              {/* Keyboard Arrows Hint */}
              <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-widest flex items-center gap-1">
                <span>Use</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">←</span>
                <span>/</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">→</span>
                <span>or Esc to navigate</span>
              </p>

              {/* Thumbnails list */}
              <div className="flex gap-2.5 overflow-x-auto max-w-full px-4 pb-2 scrollbar-thin scrollbar-thumb-white/20">
                {validImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setProductGalleryLightboxIndex(i)}
                    className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 bg-neutral-900 transition-all ${
                      i === productGalleryLightboxIndex
                        ? "border-purple-500 ring-2 ring-purple-500/30 scale-105"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional Product Instructions & Queries Modal */}
      <AnimatePresence>
        {showInstructionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-md w-full p-6 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Product Instructions or Queries</h3>
                  <p className="text-xs text-purple-600 font-semibold">Optional notes for our printing team</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Do you have any specific requests, print requirements, color preferences, or queries for <strong className="text-gray-900">{product?.name}</strong>?
              </p>

              {/* Text Area */}
              <div className="mb-3">
                <textarea
                  rows={3}
                  value={productInstructions}
                  onChange={(e) => setProductInstructions(e.target.value)}
                  placeholder="e.g. Please align logo to center, double check color code, or call before printing..."
                  className="w-full text-xs sm:text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Align logo to center",
                    "Call / WhatsApp before printing",
                    "Double check color matching",
                    "High resolution print requested"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProductInstructions(prev => {
                          if (!prev.trim()) return chip;
                          if (prev.includes(chip)) return prev;
                          return `${prev.trim()}, ${chip}`;
                        });
                      }}
                      className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100 transition-colors font-medium text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInstructionsModal(false);
                    handleAddToCart("");
                  }}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {productInstructions.trim() ? "Skip Notes & Continue" : "Skip & Continue"}
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const inst = productInstructions.trim();
                    setShowInstructionsModal(false);
                    handleAddToCart(inst);
                  }}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                >
                  {productInstructions.trim() ? "Add with Instructions" : "Continue to Cart"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
    </>
  );
}
