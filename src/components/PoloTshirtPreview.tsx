import React, { useMemo } from 'react';

interface PoloTshirtPreviewProps {
  color: string;
  className?: string;
  designImage?: string | null;
}

function adjustColor(hex: string, amount: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + amount));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function lighten(hex: string, pct: number): string {
  const amt = Math.round(255 * (pct / 100));
  return adjustColor(hex, amt);
}

function darken(hex: string, pct: number): string {
  const amt = Math.round(255 * (pct / 100));
  return adjustColor(hex, -amt);
}

export function PoloTshirtPreview({ color, className = '', designImage = null }: PoloTshirtPreviewProps) {
  const hex = useMemo(() => {
    if (!color) return '#2d5a27';
    if (color.startsWith('#')) return color;
    const map: Record<string, string> = {
      'black': '#1a1a1a', 'white': '#f5f5f0', 'navy blue': '#1a2744', 'navy': '#1a2744',
      'royal blue': '#2962a3', 'red': '#c62828', 'maroon': '#6b1d1d', 'green': '#2d5a27',
      'grey': '#6b6b6b', 'gray': '#6b6b6b', 'orange': '#d84315', 'yellow': '#f9a825',
      'pink': '#d81b60', 'purple': '#6a1b9a', 'brown': '#5d4037', 'beige': '#d7ccc8',
      'olive green': '#556b2f', 'forest green': '#1b5e20', 'teal': '#00695c',
      'mustard': '#c8a415', 'coral': '#e64a19', 'lavender': '#9575cd',
      'chocolate': '#4e342e', 'cream': '#fff8e1', 'wine': '#722f37',
      'royal blue with white tipping': '#2962a3', 'black with white tipping': '#1a1a1a',
    };
    const key = color.toLowerCase().trim();
    return map[key] || '#6b6b6b';
  }, [color]);

  const mainFill = hex;
  const shadowFill = darken(hex, 18);
  const deepShadow = darken(hex, 32);
  const highlightFill = lighten(hex, 14);
  const foldShadow = darken(hex, 10);
  const seamColor = darken(hex, 22);
  const collarInner = darken(hex, 8);
  const buttonColor = lighten(hex, 30);

  const filterId = useMemo(() => `polo-fabric-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 500 600"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-[520px]"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}
      >
        <defs>
          {/* Fabric texture filter */}
          <filter id={`${filterId}-fabric`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
            <feComponentTransfer in="textured">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
          </filter>

          {/* Subtle shadow for depth */}
          <filter id={`${filterId}-shadow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="3" result="shadow" />
            <feFlood floodColor="#000" floodOpacity="0.15" />
            <feComposite in2="shadow" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for collar fold */}
          <linearGradient id={`${filterId}-collarGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={highlightFill} />
            <stop offset="40%" stopColor={mainFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </linearGradient>

          {/* Gradient for body */}
          <linearGradient id={`${filterId}-bodyGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={highlightFill} />
            <stop offset="50%" stopColor={mainFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </linearGradient>

          {/* Placket shadow gradient */}
          <linearGradient id={`${filterId}-placketGrad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={shadowFill} />
            <stop offset="30%" stopColor={mainFill} />
            <stop offset="70%" stopColor={mainFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </linearGradient>

          {/* Sleeve gradient */}
          <linearGradient id={`${filterId}-sleeveLeftGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={highlightFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </linearGradient>
          <linearGradient id={`${filterId}-sleeveRightGrad`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={highlightFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </linearGradient>

          {/* Subtle light reflection */}
          <radialGradient id={`${filterId}-light`} cx="0.35" cy="0.25" r="0.6">
            <stop offset="0%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Clip for body */}
          <clipPath id={`${filterId}-bodyClip`}>
            <path d="M155,135 L155,520 Q155,540 175,545 L325,545 Q345,540 345,520 L345,135 Q345,120 335,115 L285,100 Q270,96 260,110 L250,130 L240,110 Q230,96 215,100 L165,115 Q155,120 155,135 Z" />
          </clipPath>
        </defs>

        {/* === BACK SHADOW (behind the shirt) === */}
        <ellipse cx="250" cy="555" rx="95" ry="12" fill="rgba(0,0,0,0.06)" />

        {/* === LEFT SLEEVE === */}
        <path
          d="M155,135 L95,155 Q75,162 70,180 L65,240 Q63,255 75,260 L105,265 Q115,267 120,255 L135,200 Q140,185 148,175 L155,165"
          fill={`url(#${filterId}-sleeveLeftGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Sleeve cuff band */}
        <path
          d="M65,240 Q63,255 75,260 L105,265 Q115,267 120,255 L122,248 Q100,252 80,248 L65,240Z"
          fill={shadowFill}
          opacity="0.6"
        />
        {/* Shoulder seam */}
        <path d="M155,135 L135,145" stroke={seamColor} strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* Sleeve crease */}
        <path d="M100,190 Q120,210 110,245" stroke={foldShadow} strokeWidth="0.6" fill="none" opacity="0.4" />

        {/* === RIGHT SLEEVE === */}
        <path
          d="M345,135 L405,155 Q425,162 430,180 L435,240 Q437,255 425,260 L395,265 Q385,267 380,255 L365,200 Q360,185 352,175 L345,165"
          fill={`url(#${filterId}-sleeveRightGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Sleeve cuff band */}
        <path
          d="M435,240 Q437,255 425,260 L395,265 Q385,267 380,255 L378,248 Q400,252 420,248 L435,240Z"
          fill={shadowFill}
          opacity="0.6"
        />
        {/* Shoulder seam */}
        <path d="M345,135 L365,145" stroke={seamColor} strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* Sleeve crease */}
        <path d="M400,190 Q380,210 390,245" stroke={foldShadow} strokeWidth="0.6" fill="none" opacity="0.4" />

        {/* === MAIN BODY === */}
        <path
          d="M155,135 L155,520 Q155,540 175,545 L325,545 Q345,540 345,520 L345,135 Q345,120 335,115 L285,100 Q270,96 260,110 L250,130 L240,110 Q230,96 215,100 L165,115 Q155,120 155,135 Z"
          fill={`url(#${filterId}-bodyGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Light reflection on body */}
        <path
          d="M155,135 L155,520 Q155,540 175,545 L325,545 Q345,540 345,520 L345,135 Q345,120 335,115 L285,100 Q270,96 260,110 L250,130 L240,110 Q230,96 215,100 L165,115 Q155,120 155,135 Z"
          fill={`url(#${filterId}-light)`}
        />

        {/* === BODY FOLD CREASES === */}
        <path d="M200,200 Q210,300 205,420" stroke={foldShadow} strokeWidth="0.7" fill="none" opacity="0.3" />
        <path d="M300,200 Q290,300 295,420" stroke={foldShadow} strokeWidth="0.7" fill="none" opacity="0.3" />
        <path d="M250,180 Q248,280 250,380" stroke={foldShadow} strokeWidth="0.5" fill="none" opacity="0.2" />

        {/* === HEM STITCHING === */}
        <path d="M160,530 Q250,538 340,530" stroke={seamColor} strokeWidth="0.6" fill="none" opacity="0.4" strokeDasharray="4,3" />
        {/* Bottom hem fold */}
        <path d="M158,535 Q250,545 342,535" stroke={deepShadow} strokeWidth="1" fill="none" opacity="0.15" />

        {/* === COLLAR === */}
        {/* Left collar flap */}
        <path
          d="M215,100 Q220,75 240,65 Q255,60 260,80 L260,110 Q250,115 240,110 L215,100Z"
          fill={`url(#${filterId}-collarGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Right collar flap */}
        <path
          d="M285,100 Q280,75 260,65 Q245,60 240,80 L240,110 Q250,115 260,110 L285,100Z"
          fill={`url(#${filterId}-collarGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Collar inner shadow */}
        <path
          d="M230,85 Q250,72 270,85 L260,105 Q250,98 240,105 Z"
          fill={collarInner}
          opacity="0.4"
        />
        {/* Collar fold line */}
        <path d="M225,90 Q250,78 275,90" stroke={seamColor} strokeWidth="0.6" fill="none" opacity="0.5" />
        {/* Collar tip shadows */}
        <path d="M218,100 Q220,95 225,92" stroke={deepShadow} strokeWidth="0.8" fill="none" opacity="0.3" />
        <path d="M282,100 Q280,95 275,92" stroke={deepShadow} strokeWidth="0.8" fill="none" opacity="0.3" />

        {/* === PLACKET === */}
        <path
          d="M240,110 L238,200 Q238,205 242,208 L250,210 L258,208 Q262,205 262,200 L260,110"
          fill={`url(#${filterId}-placketGrad)`}
          filter={`url(#${filterId}-fabric)`}
        />
        {/* Placket center line */}
        <line x1="250" y1="115" x2="250" y2="205" stroke={seamColor} strokeWidth="0.6" opacity="0.5" />
        {/* Placket edge shadows */}
        <line x1="240" y1="112" x2="238" y2="200" stroke={deepShadow} strokeWidth="0.8" opacity="0.25" />
        <line x1="260" y1="112" x2="262" y2="200" stroke={deepShadow} strokeWidth="0.8" opacity="0.25" />

        {/* === BUTTONS === */}
        <circle cx="250" cy="128" r="3.5" fill={buttonColor} stroke={shadowFill} strokeWidth="0.5" />
        <circle cx="250" cy="128" r="1.2" fill={deepShadow} opacity="0.4" />
        <circle cx="250" cy="153" r="3.5" fill={buttonColor} stroke={shadowFill} strokeWidth="0.5" />
        <circle cx="250" cy="153" r="1.2" fill={deepShadow} opacity="0.4" />
        <circle cx="250" cy="178" r="3.5" fill={buttonColor} stroke={shadowFill} strokeWidth="0.5" />
        <circle cx="250" cy="178" r="1.2" fill={deepShadow} opacity="0.4" />

        {/* === LEFT CHEST POCKET (subtle) === */}
        <rect x="170" y="200" width="40" height="45" rx="2" fill="none" stroke={seamColor} strokeWidth="0.5" opacity="0.25" />
        {/* Pocket top hem */}
        <line x1="170" y1="200" x2="210" y2="200" stroke={seamColor} strokeWidth="0.7" opacity="0.3" />

        {/* === CUSTOM DESIGN OVERLAY === */}
        {designImage && (
          <image
            href={designImage}
            x="175"
            y="180"
            width="150"
            height="150"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.9"
            style={{ mixBlendMode: 'multiply' }}
          />
        )}
      </svg>
    </div>
  );
}

export default PoloTshirtPreview;
