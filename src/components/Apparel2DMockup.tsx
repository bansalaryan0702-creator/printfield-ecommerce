import React, { useMemo } from "react";
import { getColorStyle } from "../utils/colorUtils";

function resolveHexColor(colorInput: any): string {
  if (!colorInput) return "#ffffff";
  if (typeof colorInput === "object") {
    if (colorInput.hex && typeof colorInput.hex === "string" && colorInput.hex.startsWith("#")) {
      return colorInput.hex;
    }
    if (colorInput.name) {
      colorInput = colorInput.name;
    } else {
      return "#ffffff";
    }
  }
  const str = String(colorInput).trim();
  if (str.startsWith("#") || str.startsWith("rgb")) return str;

  const style = getColorStyle(str);
  if (style.background) {
    if (style.background.startsWith("#") || style.background.startsWith("rgb")) {
      return style.background;
    }
    const match = style.background.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
    if (match) return match[0];
  }
  return "#ffffff";
}

import { motion } from "motion/react";
import { DraggableArtwork } from "./DraggableArtwork";

interface Artwork {
  file?: File;
  previewUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  dimensions?: { width: number; height: number };
  scale?: number;
  x?: number;
  y?: number;
  [key: string]: any;
}

export type PlacementId = string;

interface Apparel2DMockupProps {
  color: any;
  artworks: Record<string, Artwork | any>;
  activePlacement: PlacementId;
  onSelectPlacement?: (id: any) => void;
  onUpdateArtwork?: (placement: string, updates: any) => void;
  isPolo?: boolean;
  currentView: "front" | "back" | "left" | "right" | string;
  onViewChange: (view: "front" | "back" | "left" | "right") => void;
  productImage?: string | null;
  productImages?: string[];
}

// Beautiful Dynamic Vector Polo Mockup SVG Component
const PoloMockupSVG: React.FC<{
  view: "front" | "back" | "left" | "right" | string;
  color: string;
}> = ({ view, color }) => {
  const hex = color || "#ffffff";
  
  // Color helper functions
  const getDarker = (percent: number) => {
    try {
      let h = hex.replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      const num = parseInt(h, 16);
      let r = (num >> 16) + percent;
      let g = ((num >> 8) & 0x00FF) + percent;
      let b = (num & 0x0000FF) + percent;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch(e) {
      return hex;
    }
  };

  const bodyColor = hex;
  const shadowColor = "rgba(0,0,0,0.12)";
  const seamColor = "rgba(0,0,0,0.18)";
  const highlightColor = "rgba(255,255,255,0.25)";
  
  const shadow1 = getDarker(-25);
  const shadow2 = getDarker(-15);
  const shadow3 = getDarker(-8);

  if (view === "back") {
    return (
      <svg className="w-full h-full object-contain" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow under shirt */}
        <ellipse cx="200" cy="370" rx="140" ry="18" fill="rgba(0,0,0,0.06)" />
        
        {/* Main Body Path */}
        <path
          d="M100,100 L125,75 L155,75 Q200,85 245,75 L275,75 L300,100 L285,160 L270,150 L272,340 C272,350 262,355 250,355 L150,355 C138,355 128,350 128,340 L130,150 L115,160 Z"
          fill={bodyColor}
          stroke={shadow3}
          strokeWidth="1.5"
        />
        
        {/* Sleeve hems */}
        <path d="M100,100 L115,160 M300,100 L285,160" stroke={seamColor} strokeWidth="1" strokeDasharray="3 2" />
        
        {/* Back Collar Crease and folding flap */}
        <path d="M125,75 Q200,85 275,75" stroke={shadow2} strokeWidth="2" />
        <path d="M125,75 Q200,95 275,75 C250,110 150,110 125,75 Z" fill={shadow2} stroke={shadow1} strokeWidth="1" />
        
        {/* Horizontal Yoke line across upper back */}
        <path d="M115,115 C160,118 240,118 285,115" stroke={seamColor} strokeWidth="1" strokeDasharray="4 2" />
        
        {/* Creases and Shading on the back */}
        <path d="M135,160 Q170,220 160,320" stroke={shadowColor} strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M265,160 Q230,220 240,320" stroke={shadowColor} strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M200,120 V330" stroke={shadowColor} strokeWidth="1" fill="none" opacity="0.2" />
      </svg>
    );
  }

  if (view === "left") {
    // Zoomed close-up of wearer's Left Sleeve (Viewer's Left when facing sleeve directly)
    return (
      <svg className="w-full h-full object-contain" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="200" cy="370" rx="110" ry="12" fill="rgba(0,0,0,0.06)" />
        
        {/* Side Body slice */}
        <path d="M80,50 Q160,100 160,350 L200,350 Q200,100 110,50 Z" fill={shadow3} opacity="0.3" />
        
        {/* Sleeve Body */}
        <path
          d="M140,70 Q240,65 290,110 L250,260 Q180,240 140,210 Z"
          fill={bodyColor}
          stroke={shadow2}
          strokeWidth="1.5"
        />
        
        {/* Shoulder seam curve */}
        <path d="M140,70 Q180,120 140,210" stroke={seamColor} strokeWidth="1.5" fill="none" />
        
        {/* Sleeve cuff band (ribbed) */}
        <path
          d="M250,260 Q180,240 140,210 L145,190 Q182,220 252,240 Z"
          fill={shadow3}
          stroke={shadow2}
          strokeWidth="1"
        />
        
        {/* Fold crease highlights and shadows */}
        <path d="M150,85 Q210,140 240,220" stroke={shadowColor} strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M165,80 Q225,135 255,215" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    );
  }

  if (view === "right") {
    // Zoomed close-up of wearer's Right Sleeve (Viewer's Right side of front)
    return (
      <svg className="w-full h-full object-contain" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="200" cy="370" rx="110" ry="12" fill="rgba(0,0,0,0.06)" />
        
        {/* Side Body slice */}
        <path d="M320,50 Q240,100 240,350 L200,350 Q200,100 290,50 Z" fill={shadow3} opacity="0.3" />
        
        {/* Sleeve Body */}
        <path
          d="M260,70 Q160,65 110,110 L150,260 Q220,240 260,210 Z"
          fill={bodyColor}
          stroke={shadow2}
          strokeWidth="1.5"
        />
        
        {/* Shoulder seam curve */}
        <path d="M260,70 Q220,120 260,210" stroke={seamColor} strokeWidth="1.5" fill="none" />
        
        {/* Sleeve cuff band (ribbed) */}
        <path
          d="M150,260 Q220,240 260,210 L255,190 Q218,220 148,240 Z"
          fill={shadow3}
          stroke={shadow2}
          strokeWidth="1"
        />
        
        {/* Fold crease highlights and shadows */}
        <path d="M250,85 Q190,140 160,220" stroke={shadowColor} strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M235,80 Q175,135 145,215" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    );
  }

  // Default: FRONT VIEW with beautiful collar, placket, pocket, and details
  return (
    <svg className="w-full h-full object-contain" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft shadow under shirt */}
      <ellipse cx="200" cy="375" rx="145" ry="16" fill="rgba(0,0,0,0.07)" />
      
      {/* Main Shirt Body Path */}
      <path
        d="M100,100 L125,75 L155,75 Q200,85 245,75 L275,75 L300,100 L285,160 L270,150 L272,340 C272,352 262,358 250,358 L150,358 C138,358 128,352 128,340 L130,150 L115,160 Z"
        fill={bodyColor}
        stroke={shadow2}
        strokeWidth="1.5"
      />
      
      {/* Sleeves details / ribbed cuffs */}
      <path
        d="M100,100 L115,160 L123,153 L110,104 Z"
        fill={shadow3}
        stroke={shadow2}
        strokeWidth="0.5"
      />
      <path
        d="M300,100 L285,160 L277,153 L290,104 Z"
        fill={shadow3}
        stroke={shadow2}
        strokeWidth="0.5"
      />
      
      {/* Seam Stitching lines */}
      <path d="M128,150 L128,340 M272,150 L272,340" stroke={seamColor} strokeWidth="1" strokeDasharray="3 3" />
      <path d="M128,340 Q200,345 272,340" stroke={seamColor} strokeWidth="1.2" strokeDasharray="3 3" />
      
      {/* Ribbed Collar & Placket base */}
      {/* Inner collar band (dark fold) */}
      <path d="M155,75 Q200,100 245,75 Q200,88 155,75 Z" fill={shadow1} />
      
      {/* Placket (Vertical bar under collar) */}
      <rect x="187" y="90" width="26" height="85" fill={shadow3} stroke={shadow2} strokeWidth="1" rx="2" />
      <line x1="200" y1="90" x2="200" y2="175" stroke={seamColor} strokeWidth="1" strokeDasharray="2 2" />
      
      {/* Buttons on the placket */}
      <circle cx="200" cy="110" r="3.5" fill="#f8fafc" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      <circle cx="200" cy="110" r="1.5" fill="#94a3b8" />
      <circle cx="200" cy="135" r="3.5" fill="#f8fafc" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      <circle cx="200" cy="135" r="1.5" fill="#94a3b8" />
      <circle cx="200" cy="160" r="3.5" fill="#f8fafc" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      <circle cx="200" cy="160" r="1.5" fill="#94a3b8" />
      
      {/* Folding Collars (Left & Right Flaps) */}
      {/* Left collar */}
      <path
        d="M125,75 C135,75 160,95 187,110 C182,100 162,75 155,75 Z"
        fill={shadow2}
        stroke={shadow1}
        strokeWidth="1"
      />
      {/* Right collar */}
      <path
        d="M275,75 C265,75 240,95 213,110 C218,100 238,75 245,75 Z"
        fill={shadow2}
        stroke={shadow1}
        strokeWidth="1"
      />

      {/* Pocket on Left Chest (Wearer's Left = Viewer's Right) */}
      <path
        d="M222,145 L247,145 L247,175 C247,180 242,185 234.5,188 C227,185 222,180 222,175 Z"
        fill={bodyColor}
        stroke={shadow3}
        strokeWidth="1"
      />
      <line x1="222" y1="151" x2="247" y2="151" stroke={seamColor} strokeWidth="0.8" strokeDasharray="3 2" />

      {/* Creases & Shadows for folds */}
      <path d="M140,165 Q165,220 155,310" stroke={shadowColor} strokeWidth="2.5" fill="none" opacity="0.45" />
      <path d="M260,165 Q235,220 245,310" stroke={shadowColor} strokeWidth="2.5" fill="none" opacity="0.45" />
      <path d="M185,185 Q200,220 195,280" stroke={shadowColor} strokeWidth="1.5" fill="none" opacity="0.3" />
      
      {/* Crease Highlights */}
      <path d="M148,162 Q173,218 163,308" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M252,162 Q227,218 237,308" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.3" />
    </svg>
  );
};

// Localized High-Quality Mockup Images for perfect rendering and reliability
const POLO_DRIVE_IMAGES = {
  front: "/polo_front.png",
  back: "/polo_back.png",
  left: "/polo_left.png",
  right: "/polo_right.png",
};

const PoloMockupPhoto: React.FC<{
  view: "front" | "back" | "left" | "right" | string;
  color: string;
  productImage?: string | null;
  productImages?: string[];
}> = ({ view, color, productImage, productImages }) => {
  const imageUrl = useMemo(() => {
    // Priority: If user explicitly selected a product image (productImage), use it for front view
    if (view === "front" && productImage) {
      return productImage;
    }

    const imgs = productImages && productImages.length > 0
      ? productImages
      : productImage ? [productImage] : [];

    if (imgs.length > 0) {
      // 1. Try to find by view name keyword in URL
      const lowerView = view.toLowerCase();
      const matched = imgs.find(img => {
        if (!img || typeof img !== 'string') return false;
        const filename = img.toLowerCase().split('/').pop() || '';
        
        if (lowerView === "front") {
          return filename.includes("front") || filename.includes("chest") || filename.includes("main") || filename.includes("face") || filename.includes("f_");
        }
        if (lowerView === "back") {
          return filename.includes("back") || filename.includes("rear") || filename.includes("b_");
        }
        if (lowerView === "left") {
          return filename.includes("left") || filename.includes("sleeve_left") || filename.includes("l_sleeve") || filename.includes("lsleeve") || filename.includes("left_sleeve") || filename.includes("left-sleeve");
        }
        if (lowerView === "right") {
          return filename.includes("right") || filename.includes("sleeve_right") || filename.includes("r_sleeve") || filename.includes("rsleeve") || filename.includes("right_sleeve") || filename.includes("right-sleeve");
        }
        return false;
      });

      if (matched) return matched;

      // 2. Fallback to index-based mapping
      if (view === "front" && productImage) return productImage;
      if (view === "front" && imgs[0]) return imgs[0];
      if (view === "back") {
        if (imgs[1]) return imgs[1];
        if (imgs[0]) return imgs[0];
      }
      if (view === "left") {
        if (imgs[2]) return imgs[2];
        const anySleeve = imgs.find(img => img.toLowerCase().includes("sleeve") || img.toLowerCase().includes("s_"));
        if (anySleeve) return anySleeve;
        if (imgs[0]) return imgs[0];
      }
      if (view === "right") {
        if (imgs[3]) return imgs[3];
        if (imgs[2]) return imgs[2];
        const anySleeve = imgs.find(img => img.toLowerCase().includes("sleeve") || img.toLowerCase().includes("s_"));
        if (anySleeve) return anySleeve;
        if (imgs[0]) return imgs[0];
      }
    }

    if (productImage) return productImage;

    switch (view) {
      case "back":
        return POLO_DRIVE_IMAGES.back;
      case "left":
        return POLO_DRIVE_IMAGES.left;
      case "right":
        return POLO_DRIVE_IMAGES.right;
      case "front":
      default:
        return POLO_DRIVE_IMAGES.front;
    }
  }, [view, productImage, productImages]);

  const hex = color || "#ffffff";
  const isWhite = hex.toLowerCase() === "#ffffff" || hex.toLowerCase() === "#fff" || hex.toLowerCase() === "#fafafa" || hex.toLowerCase() === "#fdfdfd";
  const isTemplateImage = Object.values(POLO_DRIVE_IMAGES).includes(imageUrl);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          referrerPolicy="no-referrer"
          src={imageUrl}
          alt={`Polo Mockup Photo ${view}`}
          className="w-full h-full object-contain z-10 select-none pointer-events-none transition-all duration-300"
          crossOrigin="anonymous"
        />

        {/* Dynamic color blending overlay to dye the polo shirt to match the selected variation */}
        {!isWhite && isTemplateImage && (
          <div
            className="absolute inset-0 pointer-events-none z-20 transition-all duration-300"
            style={{
              backgroundColor: hex,
              mixBlendMode: "multiply",
              opacity: 0.85,
              WebkitMaskImage: `url(${imageUrl})`,
              maskImage: `url(${imageUrl})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        )}
      </div>
    </div>
  );
};

export const Apparel2DMockup: React.FC<Apparel2DMockupProps> = ({
  color,
  artworks,
  activePlacement,
  onSelectPlacement,
  onUpdateArtwork,
  isPolo = false,
  currentView,
  onViewChange,
  productImage,
  productImages,
}) => {
  const hexColor = useMemo(() => resolveHexColor(color) || "#18181b", [color]);
  const showPhotoMockup = isPolo || !!productImage;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-50 to-slate-100 p-4 rounded-3xl select-none">
      {/* View Selector Controls inside Mockup */}
      <div className="absolute top-3 left-3 z-30 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-full border border-gray-200/60 shadow-sm gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewChange("front");
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            currentView === "front"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Front
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewChange("back");
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            currentView === "back"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewChange("left");
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            currentView === "left"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Left Sleeve
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewChange("right");
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            currentView === "right"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
          }`}
        >
          Right Sleeve
        </button>
      </div>

      {/* Main 2D T-Shirt Mockup Canvas */}
      <div className="relative w-full h-full max-w-[640px] aspect-[16/9] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
        
        {/* Aspect-square wrapper containing both SVG and artwork overlays */}
        <div className={`relative h-[95%] flex items-center justify-center ${showPhotoMockup ? "w-full" : "aspect-square"}`}>
          
          {/* Conditional rendering: Photographic Mockup for Polos/Custom images, Vector SVG for others */}
          {showPhotoMockup ? (
            <PoloMockupPhoto
              view={currentView}
              color={hexColor}
              productImage={productImage}
              productImages={productImages}
            />
          ) : (
            <PoloMockupSVG view={currentView} color={hexColor} />
          )}


          {/* Artwork Placement Overlays over Drive Mockup */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* FRONT VIEW PLACEMENTS */}
            {currentView === "front" && (
              <>
                {/* Left Chest Logo / Pocket Area (Wearer's Left = Viewer's Right) */}
                {artworks["front-chest"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="58.6%"
                    defaultTop="41.6%"
                    xOffset={artworks["front-chest"].x}
                    yOffset={artworks["front-chest"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("front-chest", offsets)}
                    style={{
                      width: `${Math.round(10 * (artworks["front-chest"].scale || 1))}%`,
                    }}
                    onClick={() => onSelectPlacement?.("front-chest")}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "front-chest"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["front-chest"].previewUrl}
                      alt="Left Chest Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}

                {/* Center Full Chest Logo */}
                {artworks["front-full"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="50%"
                    defaultTop="48.7%"
                    xOffset={artworks["front-full"].x}
                    yOffset={artworks["front-full"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("front-full", offsets)}
                    style={{
                      width: `${Math.round(20 * (artworks["front-full"].scale || 1))}%`,
                    }}
                    onClick={() => onSelectPlacement?.("front-full")}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "front-full"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["front-full"].previewUrl}
                      alt="Full Chest Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}

                {/* Sleeve Left Indicator on Front View */}
                {artworks["sleeve-left"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="71.5%"
                    defaultTop="32.5%"
                    xOffset={artworks["sleeve-left"].x}
                    yOffset={artworks["sleeve-left"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-left", offsets)}
                    style={{
                      transform: "translate(-50%, -50%) rotate(10deg)",
                      width: `${Math.round(8 * (artworks["sleeve-left"].scale || 1))}%`,
                    }}
                    onClick={() => {
                      onViewChange("left");
                      onSelectPlacement?.("sleeve-left");
                    }}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "sleeve-left"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["sleeve-left"].previewUrl}
                      alt="Left Sleeve Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}

                {/* Sleeve Right Indicator on Front View */}
                {artworks["sleeve-right"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="28.5%"
                    defaultTop="32.5%"
                    xOffset={artworks["sleeve-right"].x}
                    yOffset={artworks["sleeve-right"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-right", offsets)}
                    style={{
                      transform: "translate(-50%, -50%) rotate(-10deg)",
                      width: `${Math.round(8 * (artworks["sleeve-right"].scale || 1))}%`,
                    }}
                    onClick={() => {
                      onViewChange("right");
                      onSelectPlacement?.("sleeve-right");
                    }}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "sleeve-right"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["sleeve-right"].previewUrl}
                      alt="Right Sleeve Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}
              </>
            )}

            {/* BACK VIEW PLACEMENTS */}
            {currentView === "back" && (
              <>
                {artworks["back-full"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="50%"
                    defaultTop="47.5%"
                    xOffset={artworks["back-full"].x}
                    yOffset={artworks["back-full"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("back-full", offsets)}
                    style={{
                      width: `${Math.round(20 * (artworks["back-full"].scale || 1))}%`,
                    }}
                    onClick={() => onSelectPlacement?.("back-full")}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "back-full"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["back-full"].previewUrl}
                      alt="Back Full Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}
              </>
            )}

            {/* LEFT SLEEVE VIEW PLACEMENTS */}
            {currentView === "left" && (
              <>
                {artworks["sleeve-left"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="53.8%"
                    defaultTop="41.3%"
                    xOffset={artworks["sleeve-left"].x}
                    yOffset={artworks["sleeve-left"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-left", offsets)}
                    style={{
                      width: `${Math.round(16 * (artworks["sleeve-left"].scale || 1))}%`,
                    }}
                    onClick={() => onSelectPlacement?.("sleeve-left")}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "sleeve-left"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["sleeve-left"].previewUrl}
                      alt="Left Sleeve Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}
              </>
            )}

            {/* RIGHT SLEEVE VIEW PLACEMENTS */}
            {currentView === "right" && (
              <>
                {artworks["sleeve-right"]?.previewUrl && (
                  <DraggableArtwork
                    defaultLeft="46.2%"
                    defaultTop="41.3%"
                    xOffset={artworks["sleeve-right"].x}
                    yOffset={artworks["sleeve-right"].y}
                    onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-right", offsets)}
                    style={{
                      width: `${Math.round(16 * (artworks["sleeve-right"].scale || 1))}%`,
                    }}
                    onClick={() => onSelectPlacement?.("sleeve-right")}
                    className={`pointer-events-auto aspect-square transition-all ${
                      activePlacement === "sleeve-right"
                        ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                        : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                    }`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={artworks["sleeve-right"].previewUrl}
                      alt="Right Sleeve Logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </DraggableArtwork>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
