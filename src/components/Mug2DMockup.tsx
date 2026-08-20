import React from "react";
import { DraggableArtwork } from "./DraggableArtwork";

export interface Mug2DMockupProps {
  productImage: string;
  color?: string;
  artworks: Record<string, any>;
  activePlacement: string;
  onSelectPlacement?: (placementId: string) => void;
  onUpdateArtwork?: (placementId: string, updates: any) => void;
}

export function Mug2DMockup({
  productImage,
  color,
  artworks,
  activePlacement,
  onSelectPlacement,
  onUpdateArtwork,
}: Mug2DMockupProps) {
  const artwork = artworks[activePlacement] || artworks['front'] || Object.values(artworks)[0];

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#EBEBEB] overflow-hidden rounded-2xl">
      <div className="relative w-[80%] h-[80%] max-w-[500px] flex items-center justify-center">
        <img
          src={productImage || ""}
          alt="Mug Mockup"
          className="w-full h-full object-contain pointer-events-none"
          style={{ mixBlendMode: "multiply" }}
        />
        
        {artwork && artwork.previewUrl && (
          <div className="absolute inset-0 top-[20%] bottom-[20%] left-[25%] right-[25%] flex items-center justify-center pointer-events-auto overflow-hidden rounded-[20%]">
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
