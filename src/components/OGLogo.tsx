import React from 'react';

interface OGLogoProps {
  size?: number | string;
  className?: string;
  showOuterRing?: boolean;
  theme?: 'dark' | 'light';
  animated?: boolean;
}

export const OGLogo: React.FC<OGLogoProps> = ({
  size = 36,
  className = '',
  showOuterRing = true,
  theme = 'dark',
  animated = false
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${animated ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          {/* Gradient for 'O' - Indigo to Royal Violet */}
          <linearGradient id="ogGradientO" x1="40" y1="60" x2="115" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Gradient for 'G' - Bright Cyan to Sky Turquoise */}
          <linearGradient id="ogGradientG" x1="85" y1="60" x2="160" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Soft outer glow */}
          <filter id="ogGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Circular Rim */}
        {showOuterRing && (
          <circle
            cx="100"
            cy="100"
            r="94"
            fill={theme === 'dark' ? '#0d0d1a' : '#f8fafc'}
            stroke={theme === 'dark' ? '#334155' : '#cbd5e1'}
            strokeWidth="3.5"
            className="transition-colors duration-200"
          />
        )}

        {/* Inner thin decorative guide circle */}
        {showOuterRing && (
          <circle
            cx="100"
            cy="100"
            r="91"
            fill="none"
            stroke={theme === 'dark' ? '#1e1b4b' : '#e2e8f0'}
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
        )}

        {/* LETTER 'O' - Full Interlocking Left Ring */}
        <circle
          cx="76"
          cy="100"
          r="38"
          stroke="url(#ogGradientO)"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
          filter="url(#ogGlow)"
        />

        {/* LETTER 'G' - Interlocking Right Ring with Notch and Horizontal Bar */}
        {/* Main G curved arc */}
        <path
          d="M 148 72 A 38 38 0 1 0 160 100"
          stroke="url(#ogGradientG)"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />

        {/* Horizontal Bar of G */}
        <path
          d="M 125 100 L 154 100"
          stroke="url(#ogGradientG)"
          strokeWidth="15"
          strokeLinecap="square"
          fill="none"
        />

        {/* Digital Pixel Stepped Tab at top right of G's horizontal arm */}
        <rect
          x="147"
          y="92.5"
          width="8"
          height="15"
          fill="url(#ogGradientG)"
          rx="1"
        />
      </svg>
    </div>
  );
};
