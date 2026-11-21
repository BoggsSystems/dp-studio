import React from 'react';

export interface ShopVideoLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  pulse?: boolean;
  variant?: 'disc' | 'flat' | 'badge';
  style?: React.CSSProperties;
}

export const ShopVideoLogo: React.FC<ShopVideoLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  pulse = true,
  variant = 'disc',
  style = {},
}) => {
  return (
    <div
      className={`shopvideo-brand-lockup ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size > 28 ? '10px' : '6px',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        className={`shopvideo-logo-disc ${pulse ? 'pulse-active' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="svRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            <linearGradient id="svDiscGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#070b14" />
            </linearGradient>

            <filter id="svGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Disc Background */}
          {variant !== 'flat' && (
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="url(#svDiscGradient)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
            />
          )}

          {/* Outer Broadcast Pulse Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#svRingGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            filter={variant !== 'flat' ? 'url(#svGlow)' : undefined}
            opacity="0.95"
          />

          {/* Shopping Bag & Finger Group - scaled & centered */}
          <g transform="translate(50, 50) scale(0.24) translate(-150, -150)">
            {/* Shopping Bag Body */}
            <path
              d="M 124.45 193.81 L 148.84 193.81 L 148.84 193.81 C 152 193.81 183.6 193.81 183.6 193.81 L 185.82 134.12 L 114.32 134.12 L 116.54 180.92 C 116.8 187.96 122.44 193.81 129.49 193.81 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Shopping Bag Handle */}
            <path
              d="M 132.33 134.61 V 115.97 C 132.33 106.21 140.24 98.3 150 98.3 C 159.76 98.3 167.67 106.21 167.67 115.97 V 134.61"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tap Contact Ripple Rings */}
            <circle cx="152" cy="155" r="9" fill="none" stroke="#38bdf8" strokeWidth="4" opacity="0.8" />
            <circle cx="152" cy="155" r="18" fill="none" stroke="#34d399" strokeWidth="3" opacity="0.45" />

            {/* Pointer Hand / Finger */}
            <g id="logo-finger">
              {/* Index Finger */}
              <path
                d="M 152.5 160.15 L 173.24 180.9 C 175.49 183.15 179.13 183.15 181.37 180.9 C 183.62 178.65 183.62 175.01 181.37 172.77 L 160.63 152.02 C 158.39 149.78 154.75 149.78 152.5 152.02 C 150.26 154.27 150.26 157.91 152.5 160.15 Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Hand Silhouette */}
              <path
                d="M 176.58 192.24 C 174.33 189.99 170.7 189.99 168.45 192.24 C 166.2 194.48 166.2 198.12 168.45 200.37 L 182.21 214.13 C 193.44 225.36 211.64 225.36 222.87 214.13 C 234.1 202.9 234.1 184.7 222.87 173.47 L 204.73 155.33 C 202.48 153.08 198.84 153.08 196.6 155.33 C 194.35 157.57 194.35 161.21 196.6 163.46 L 204.73 171.59"
                fill="none"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span
            style={{
              fontSize: size > 32 ? '19px' : '16px',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#ffffff',
            }}
          >
            ShopVideo
          </span>
          <span
            style={{
              fontSize: size > 32 ? '19px' : '16px',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#38bdf8',
            }}
          >
            .tv
          </span>
        </div>
      )}
    </div>
  );
};

export default ShopVideoLogo;
