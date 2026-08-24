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
  return adjustColor(hex, Math.round(255 * (pct / 100)));
}

function darken(hex: string, pct: number): string {
  return adjustColor(hex, -Math.round(255 * (pct / 100)));
}

export function PoloTshirtPreview({ color, className = '', designImage = null }: PoloTshirtPreviewProps) {
  const hex = useMemo(() => {
    if (!color) return '#2d5a27';
    if (color.startsWith('#')) return color;
    const map: Record<string, string> = {
      'black': '#1a1a1a', 'white': '#f0f0ea', 'navy blue': '#1a2744', 'navy': '#1a2744',
      'royal blue': '#2962a3', 'red': '#c62828', 'maroon': '#6b1d1d', 'green': '#2d5a27',
      'grey': '#6b6b6b', 'gray': '#6b6b6b', 'orange': '#d84315', 'yellow': '#f9a825',
      'pink': '#d81b60', 'purple': '#6a1b9a', 'brown': '#5d4037', 'beige': '#d7ccc8',
      'olive green': '#556b2f', 'forest green': '#1b5e20', 'teal': '#00695c',
      'mustard': '#c8a415', 'coral': '#e64a19', 'lavender': '#9575cd',
      'chocolate': '#4e342e', 'cream': '#fff8e1', 'wine': '#722f37',
    };
    const key = color.toLowerCase().trim();
    return map[key] || '#6b6b6b';
  }, [color]);

  const m = useMemo(() => ({
    main: hex,
    dark: darken(hex, 15),
    deep: darken(hex, 28),
    light: lighten(hex, 12),
    fold: darken(hex, 10),
    seam: darken(hex, 20),
    collarInner: darken(hex, 6),
    btn: lighten(hex, 25),
    btnHole: darken(hex, 30),
    cuff: darken(hex, 12),
    hemLine: darken(hex, 8),
  }), [hex]);

  const id = useMemo(() => `p${Math.random().toString(36).slice(2,7)}`, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[500px]" style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.10))' }}>
        <defs>
          <filter id={`${id}-tex`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="5" result="n" />
            <feColorMatrix type="saturate" values="0" in="n" result="gn" />
            <feBlend in="SourceGraphic" in2="gn" mode="multiply" />
          </filter>
          <linearGradient id={`${id}-body`} x1="0.3" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={m.light} />
            <stop offset="45%" stopColor={m.main} />
            <stop offset="100%" stopColor={m.dark} />
          </linearGradient>
          <linearGradient id={`${id}-sleeveL`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={m.light} />
            <stop offset="100%" stopColor={m.dark} />
          </linearGradient>
          <linearGradient id={`${id}-sleeveR`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={m.light} />
            <stop offset="100%" stopColor={m.dark} />
          </linearGradient>
          <linearGradient id={`${id}-collar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={m.light} />
            <stop offset="60%" stopColor={m.main} />
            <stop offset="100%" stopColor={m.dark} />
          </linearGradient>
          <radialGradient id={`${id}-sheen`} cx="0.38" cy="0.3" r="0.55">
            <stop offset="0%" stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <rect x="100" y="58" width="200" height="380" rx="8" />
          </clipPath>
        </defs>

        {/* Floor shadow */}
        <ellipse cx="200" cy="468" rx="80" ry="8" fill="rgba(0,0,0,0.05)" />

        {/* === LEFT SLEEVE === */}
        {/* Sleeve body - natural droop from shoulder */}
        <path
          d="M118,108 L72,118 C58,122 48,138 50,160 L56,198 C58,210 68,216 78,212 L112,196 C118,194 122,186 120,178"
          fill={`url(#${id}-sleeveL)`}
          filter={`url(#${id}-tex)`}
        />
        {/* Cuff band */}
        <path
          d="M56,192 C58,204 66,212 76,210 L110,196 C116,194 118,188 116,182"
          fill={m.cuff}
          opacity="0.5"
        />
        {/* Shoulder seam */}
        <path d="M118,108 C115,112 112,116 110,118" stroke={m.seam} strokeWidth="0.7" fill="none" opacity="0.4" />
        {/* Sleeve fold */}
        <path d="M72,145 C82,160 78,185 68,200" stroke={m.fold} strokeWidth="0.5" fill="none" opacity="0.3" />

        {/* === RIGHT SLEEVE === */}
        <path
          d="M282,108 L328,118 C342,122 352,138 350,160 L344,198 C342,210 332,216 322,212 L288,196 C282,194 278,186 280,178"
          fill={`url(#${id}-sleeveR)`}
          filter={`url(#${id}-tex)`}
        />
        {/* Cuff band */}
        <path
          d="M344,192 C342,204 334,212 324,210 L290,196 C284,194 282,188 284,182"
          fill={m.cuff}
          opacity="0.5"
        />
        {/* Shoulder seam */}
        <path d="M282,108 C285,112 288,116 290,118" stroke={m.seam} strokeWidth="0.7" fill="none" opacity="0.4" />
        {/* Sleeve fold */}
        <path d="M328,145 C318,160 322,185 332,200" stroke={m.fold} strokeWidth="0.5" fill="none" opacity="0.3" />

        {/* === MAIN BODY === */}
        <path
          d="M120,108 L120,430 C120,445 130,455 145,458 L255,458 C270,455 280,445 280,430 L280,108 C280,98 270,90 258,88 L218,80 C210,78 204,86 200,96 L196,86 C192,78 186,78 178,80 L142,88 C130,90 120,98 120,108 Z"
          fill={`url(#${id}-body)`}
          filter={`url(#${id}-tex)`}
          clipPath={`url(#${id}-clip)`}
        />
        {/* Sheen */}
        <path
          d="M120,108 L120,430 C120,445 130,455 145,458 L255,458 C270,455 280,445 280,430 L280,108 C280,98 270,90 258,88 L218,80 C210,78 204,86 200,96 L196,86 C192,78 186,78 178,80 L142,88 C130,90 120,98 120,108 Z"
          fill={`url(#${id}-sheen)`}
        />

        {/* Body fold creases */}
        <path d="M165,160 C168,240 166,330 167,420" stroke={m.fold} strokeWidth="0.5" fill="none" opacity="0.2" />
        <path d="M235,160 C232,240 234,330 233,420" stroke={m.fold} strokeWidth="0.5" fill="none" opacity="0.2" />
        <path d="M200,140 C199,220 200,320 200,400" stroke={m.fold} strokeWidth="0.4" fill="none" opacity="0.15" />

        {/* Bottom hem line */}
        <path d="M125,445 C200,452 275,445 275,445" stroke={m.hemLine} strokeWidth="0.6" fill="none" opacity="0.3" />
        {/* Hem fold shadow */}
        <path d="M125,450 C200,457 275,450 275,450" stroke={m.deep} strokeWidth="0.8" fill="none" opacity="0.1" />

        {/* === COLLAR === */}
        {/* Left collar leaf */}
        <path
          d="M178,80 C175,62 182,48 196,44 C204,42 200,55 200,68 L200,86 C194,84 186,82 178,80Z"
          fill={`url(#${id}-collar)`}
          filter={`url(#${id}-tex)`}
        />
        {/* Right collar leaf */}
        <path
          d="M222,80 C225,62 218,48 204,44 C196,42 200,55 200,68 L200,86 C206,84 214,82 222,80Z"
          fill={`url(#${id}-collar)`}
          filter={`url(#${id}-tex)`}
        />
        {/* Collar shadow underneath */}
        <path
          d="M185,72 C195,62 205,62 215,72 L208,82 C204,78 196,78 192,82 Z"
          fill={m.collarInner}
          opacity="0.35"
        />
        {/* Collar fold edge */}
        <path d="M182,76 C192,66 208,66 218,76" stroke={m.seam} strokeWidth="0.5" fill="none" opacity="0.4" />

        {/* === PLACKET === */}
        <path
          d="M193,86 L191,180 Q191,186 196,188 L200,190 L204,188 Q209,186 209,180 L207,86"
          fill={m.dark}
          opacity="0.25"
        />
        {/* Placket center line */}
        <line x1="200" y1="90" x2="200" y2="184" stroke={m.seam} strokeWidth="0.5" opacity="0.4" />

        {/* === BUTTONS === */}
        <circle cx="200" cy="104" r="3" fill={m.btn} stroke={m.dark} strokeWidth="0.4" />
        <circle cx="200" cy="104" r="1" fill={m.btnHole} opacity="0.5" />
        <circle cx="200" cy="130" r="3" fill={m.btn} stroke={m.dark} strokeWidth="0.4" />
        <circle cx="200" cy="130" r="1" fill={m.btnHole} opacity="0.5" />
        <circle cx="200" cy="156" r="3" fill={m.btn} stroke={m.dark} strokeWidth="0.4" />
        <circle cx="200" cy="156" r="1" fill={m.btnHole} opacity="0.5" />

        {/* === LEFT CHEST POCKET === */}
        <rect x="138" y="195" width="32" height="38" rx="1.5" fill="none" stroke={m.seam} strokeWidth="0.4" opacity="0.22" />
        <line x1="138" y1="195" x2="170" y2="195" stroke={m.seam} strokeWidth="0.5" opacity="0.25" />

        {/* === CUSTOM DESIGN === */}
        {designImage && (
          <image
            href={designImage}
            x="145"
            y="195"
            width="110"
            height="110"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.85"
            style={{ mixBlendMode: 'multiply' } as React.CSSProperties}
          />
        )}
      </svg>
    </div>
  );
}

export default PoloTshirtPreview;
