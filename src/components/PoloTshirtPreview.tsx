import React, { useMemo } from 'react';
import { getOptimizedImage } from '@/src/lib/imageUtils';

interface PoloTshirtPreviewProps {
  color: any;
  productImages: string[];
  productColors: any[];
  className?: string;
  designImage?: string | null;
  placement?: string;
}

// Placement positions as percentage-based coordinates on the polo image
const PLACEMENT_POSITIONS: Record<string, { top: string; left: string; width: string; height: string; transform?: string }> = {
  'front-chest': {
    top: '28%', left: '18%', width: '22%', height: '25%',
  },
  'front-full': {
    top: '25%', left: '22%', width: '56%', height: '50%',
  },
  'back-full': {
    top: '25%', left: '22%', width: '56%', height: '50%',
  },
  'sleeve-left': {
    top: '18%', left: '-5%', width: '22%', height: '20%',
    transform: 'rotate(-10deg)',
  },
  'sleeve-right': {
    top: '18%', left: '83%', width: '22%', height: '20%',
    transform: 'rotate(10deg)',
  },
  'front': {
    top: '25%', left: '22%', width: '56%', height: '50%',
  },
  'back': {
    top: '25%', left: '22%', width: '56%', height: '50%',
  },
  'generic': {
    top: '25%', left: '22%', width: '56%', height: '50%',
  },
};

export function PoloTshirtPreview({ color, productImages, productColors, className = '', designImage = null, placement = 'front-full' }: PoloTshirtPreviewProps) {
  // Find the best image for the selected color
  const colorImage = useMemo(() => {
    if (!color || !productColors) return null;

    const colorName = typeof color === 'string' ? color : (color?.name || '');
    const colorHex = typeof color === 'object' ? color?.hex : null;

    // 1. Look for a matching color variant image
    for (const c of productColors) {
      const cName = typeof c === 'string' ? c : (c?.name || '');
      const cHex = typeof c === 'object' ? c?.hex : null;
      const cImg = typeof c === 'object' ? c?.image : null;

      if (cImg && cImg.length > 10) {
        // Exact name match
        if (colorName && cName.toLowerCase() === colorName.toLowerCase()) {
          return cImg;
        }
        // Hex match
        if (colorHex && cHex && colorHex.toLowerCase() === cHex.toLowerCase()) {
          return cImg;
        }
      }
    }

    // 2. First color with an image
    for (const c of productColors) {
      const cImg = typeof c === 'object' ? c?.image : null;
      if (cImg && cImg.length > 10) return cImg;
    }

    // 3. Fallback to product images
    if (productImages && productImages.length > 0) {
      return productImages[0];
    }
    return null;
  }, [color, productColors, productImages]);

  const optimizedImage = useMemo(() => {
    if (!colorImage) return null;
    return getOptimizedImage(colorImage, 1000) || colorImage;
  }, [colorImage]);

  if (!optimizedImage) return null;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Real product photo */}
      <img
        referrerPolicy="no-referrer"
        src={optimizedImage}
        alt="Polo T-Shirt Preview"
        className="w-full h-full object-contain"
        loading="lazy"
        width="1000"
        height="1000"
      />

      {/* Design overlay */}
      {designImage && (
        <div
          className="absolute"
          style={{
            top: PLACEMENT_POSITIONS[placement]?.top || '25%',
            left: PLACEMENT_POSITIONS[placement]?.left || '22%',
            width: PLACEMENT_POSITIONS[placement]?.width || '56%',
            height: PLACEMENT_POSITIONS[placement]?.height || '50%',
            transform: PLACEMENT_POSITIONS[placement]?.transform || 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={designImage}
            alt="Your Design"
            className="max-w-full max-h-full object-contain"
            style={{ mixBlendMode: 'multiply', opacity: 0.9 }}
          />
        </div>
      )}
    </div>
  );
}

export default PoloTshirtPreview;
