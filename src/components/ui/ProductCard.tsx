import { getOptimizedImage } from "@/src/lib/imageUtils";
import { Link } from "react-router-dom";
import { Product } from "@/src/data/products";
import { useState, useMemo, useEffect } from "react";
import { getFeaturedImage, getFallbackImage } from "@/src/lib/imageUtils";
import { getColorStyle, isColorCategory } from "@/src/utils/colorUtils";

interface ProductCardProps {
  product: Product;
  key?: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [hoveredColorImage, setHoveredColorImage] = useState<string | null>(null);
  const [hoveredColorName, setHoveredColorName] = useState<string | null>(null);

  const rawImage = getFeaturedImage(product);
  const fallbackImage = getFallbackImage(product);
  const baseImage = imageError ? fallbackImage : (getOptimizedImage(rawImage, 400) || fallbackImage);
  const activeDisplayImage = hoveredColorImage 
    ? (getOptimizedImage(hoveredColorImage, 400) || hoveredColorImage) 
    : baseImage;

  if (product.isDisabled) {
    return null;
  }

  const availableColors = useMemo(() => {
    const list: { name: string; hex?: string; image?: string }[] = [];
    const seen = new Set<string>();

    if (product.colors && product.colors.length > 0) {
      for (const col of product.colors) {
        if (col.name && !seen.has(String(col.name || '').toLowerCase())) {
          seen.add(String(col.name || '').toLowerCase());
          list.push({ name: col.name, hex: col.hex, image: col.image });
        }
      }
    }

    if (product.variations && product.variations.length > 0) {
      for (const v of product.variations) {
        const opts = Array.isArray(v.options) ? v.options : [];
        if (isColorCategory(v.name, opts)) {
          for (const opt of opts) {
            const optName = typeof opt === 'string' ? opt : opt?.name;
            const optImg = typeof opt === 'object' ? (opt as any)?.image : undefined;
            if (optName && !seen.has(optName.toLowerCase())) {
              seen.add(optName.toLowerCase());
              list.push({ name: optName, image: optImg });
            }
          }
        }
      }
    }

    return list;
  }, [product]);

  // Preload color swatch images in background for instant hover responsiveness
  useEffect(() => {
    if (!availableColors || availableColors.length === 0) return;
    availableColors.slice(0, 8).forEach(col => {
      if (col.image) {
        const opt = getOptimizedImage(col.image, 400) || col.image;
        if (opt) {
          const img = new Image();
          img.src = opt;
        }
      }
    });
  }, [availableColors]);

  return (
    <Link 
      to={`/product/${product.slug || product.id}${hoveredColorName ? `?color=${encodeURIComponent(hoveredColorName)}` : ''}`} 
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
        {product.isBestseller && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm z-20">
            Bestseller
          </div>
        )}

        {/* Featured Main Image or Active Color Preview */}
        <img 
          referrerPolicy="no-referrer" loading="lazy" 
          src={activeDisplayImage} 
          alt={hoveredColorName ? `${product.name} - ${hoveredColorName}` : product.name}
          onError={() => {
            if (hoveredColorImage) {
              setHoveredColorImage(null);
            } else {
              setImageError(true);
            }
          }}
          className={`h-full w-full object-contain bg-white object-center group-hover:scale-105 transition-transform duration-300`}
          width="400"
          height="300"
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
          {product.category}
        </div>
        <h3 className="font-semibold text-gray-900 leading-tight mb-2 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
          {product.cardDescription || product.description}
        </p>

        {/* Color Options Preview */}
        {availableColors.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableColors.slice(0, 8).map((col, idx) => {
                const { background, borderNeeded } = getColorStyle(col.hex || col.name);
                const isHovered = hoveredColorName === col.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoveredColorName(col.name);
                      setHoveredColorImage(col.image || null);
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoveredColorName(null);
                      setHoveredColorImage(null);
                    }}
                    onClick={(e) => {
                      setHoveredColorName(col.name);
                      if (col.image) setHoveredColorImage(col.image);
                    }}
                    className={`relative w-4 h-4 rounded-full inline-block flex-shrink-0 transition-transform duration-200 cursor-pointer ${
                      isHovered ? "scale-125 ring-2 ring-purple-600 z-10" : "hover:scale-110"
                    } ${
                      borderNeeded ? "border border-gray-300" : "border border-black/10 shadow-xs"
                    }`}
                    style={{ background }}
                    title={col.name}
                  />
                );
              })}
              {availableColors.length > 8 && (
                <span className="text-[10px] text-gray-400 font-semibold ml-0.5">
                  +{availableColors.length - 8}
                </span>
              )}
            </div>
            {hoveredColorName ? (
              <span className="text-[11px] font-medium text-purple-700 h-4 leading-4">
                Color: {hoveredColorName}
              </span>
            ) : (
              <div className="h-4" />
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex flex-col">
            <span className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Pricing</span>
            <span className="text-sm font-bold text-gray-900">Quote on Request</span>
          </div>
          <span className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-full text-sm font-medium transition-colors">
            Customize
          </span>
        </div>
      </div>
    </Link>
  );
}
