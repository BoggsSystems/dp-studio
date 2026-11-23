import React from 'react';
import { OpticalConfig } from './teleprompterTypes';

interface ReadingAnchorGuideProps {
  config: OpticalConfig;
}

export const ReadingAnchorGuide: React.FC<ReadingAnchorGuideProps> = ({ config }) => {
  const topPercent = config.anchorTopPercent;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Optional Top Vignette */}
      {config.showVignette && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: `${Math.max(0, topPercent - 5)}%`,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            pointerEvents: 'none',
            transition: 'height 0.3s ease',
          }}
        />
      )}

      {/* Focus Anchor Line */}
      {config.showGuideLine && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${topPercent}%`,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'top 0.3s ease',
            pointerEvents: 'none',
          }}
        >
          {/* Subtle horizontal marker centered over the text column */}
          <div
            style={{
              height: '2px',
              width: `${config.columnWidthPx + 60}px`,
              background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.45) 20%, rgba(56, 189, 248, 0.9) 50%, rgba(56, 189, 248, 0.45) 80%, transparent 100%)',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.5)',
              borderRadius: '999px',
            }}
          />
          {/* Arrow / Eye pointer indicators on sides */}
          <div
            style={{
              position: 'absolute',
              width: `${config.columnWidthPx + 100}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#38bdf8', fontSize: '13px', fontFamily: 'monospace', fontWeight: 800 }}>▶</span>
            <span style={{ color: '#38bdf8', fontSize: '13px', fontFamily: 'monospace', fontWeight: 800 }}>◀</span>
          </div>
        </div>
      )}

      {/* Optional Bottom Vignette */}
      {config.showVignette && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${Math.max(0, 100 - (topPercent + 25))}%`,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
            pointerEvents: 'none',
            transition: 'height 0.3s ease',
          }}
        />
      )}
    </div>
  );
};
