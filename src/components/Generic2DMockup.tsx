import React, { useState } from "react";
import { DraggableArtwork } from "./DraggableArtwork";
import { Check, Edit2 } from "lucide-react";

export interface Generic2DMockupProps {
  productImage: string;
  color?: string;
  artworks: Record<string, any>;
  activePlacement: string;
  onSelectPlacement?: (placementId: string) => void;
  onUpdateArtwork?: (placementId: string, updates: any) => void;
}

export function Generic2DMockup({
  productImage,
  color,
  artworks,
  activePlacement,
  onSelectPlacement,
  onUpdateArtwork,
}: Generic2DMockupProps) {
  // Use a generic blending style or just an overlay if color is provided
  // But usually generic products don't change color cleanly without a mask, 
  // so we'll just overlay the artwork on top of the product image.
  
  const artwork = artworks[activePlacement] || artworks['front'] || Object.values(artworks)[0];

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#EBEBEB] overflow-hidden rounded-2xl">
      {/* Container to bound the artwork */}
      <div className="relative max-w-full max-h-full aspect-square flex items-center justify-center">
        {/* Product Image */}
        <img
          src={productImage}
          alt="Product Mockup"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            mixBlendMode: "multiply", // Try to blend if there's a white background
          }}
        />

        {/* Artwork Overlay */}
        {artwork && artwork.previewUrl && (
          <div className="absolute inset-0 top-[10%] bottom-[10%] left-[10%] right-[10%] flex items-center justify-center pointer-events-auto">
            {onUpdateArtwork ? (
              <DraggableArtwork
                artwork={artwork}
                onChange={(updates) => onUpdateArtwork(activePlacement || 'front', updates)}
                isActive={true}
                onClick={() => onSelectPlacement?.(activePlacement || 'front')}
              />
            ) : (
              <div 
                className="absolute"
                style={{
                  left: `${artwork.x || 50}%`,
                  top: `${artwork.y || 50}%`,
                  transform: `translate(-50%, -50%) rotate(${artwork.rotation || 0}deg) scale(${artwork.scale || 1})`,
                  width: `${(artwork.width || 50)}%`
                }}
              >
                <img src={artwork.previewUrl} alt="Artwork" className="w-full h-auto drop-shadow-md" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
