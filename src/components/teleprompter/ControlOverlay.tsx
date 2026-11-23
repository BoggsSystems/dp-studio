import React from 'react';
import { X, Sliders, ArrowUpDown, Eye, Type, Palette } from 'lucide-react';
import { OpticalConfig, AnchorPosition, ColorTheme, TextAlignment } from './teleprompterTypes';

interface ControlOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: OpticalConfig;
  onUpdateConfig: (updates: Partial<OpticalConfig>) => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Optical & Reading Ergonomics</h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Tune reading line and text column width to eliminate eye-darting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Camera Placement & Reading Anchor */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ArrowUpDown size={14} color="#38bdf8" />
              Camera Placement & Reading Line Anchor
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onUpdateConfig({ anchorPosition: 'top' as AnchorPosition, anchorTopPercent: 14 })}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: config.anchorPosition === 'top' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: config.anchorPosition === 'top' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: config.anchorPosition === 'top' ? '#38bdf8' : '#e2e8f0' }}>
                  Top Bezel (Recommended)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                  Camera / iPhone mounted above monitor. Reading line pinned at top 14%.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ anchorPosition: 'bottom' as AnchorPosition, anchorTopPercent: 80 })}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: config.anchorPosition === 'bottom' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: config.anchorPosition === 'bottom' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: config.anchorPosition === 'bottom' ? '#38bdf8' : '#e2e8f0' }}>
                  Bottom Bezel
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                  Camera on desk stand below screen. Reading line pinned at bottom 80%.
                </div>
              </button>
            </div>
          </div>

          {/* 2. Column Width (Foveal Vision Constraint) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Reading Column Width (Foveal Eye Constraint):</span>
              <strong style={{ color: '#38bdf8' }}>{config.columnWidthPx}px</strong>
            </div>
            <input
              type="range"
              min={340}
              max={680}
              step={20}
              value={config.columnWidthPx}
              onChange={(e) => onUpdateConfig({ columnWidthPx: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              <span>340px (Vertical Short / Narrow)</span>
              <span>480px (Standard Desktop)</span>
              <span>680px (Wide)</span>
            </div>
          </div>

          {/* 3. Typography: Font Size & Line Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Font Size:</span>
                <strong style={{ color: '#38bdf8' }}>{config.fontSizePx}px</strong>
              </div>
              <input
                type="range"
                min={22}
                max={54}
                step={2}
                value={config.fontSizePx}
                onChange={(e) => onUpdateConfig({ fontSizePx: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Line Height:</span>
                <strong style={{ color: '#38bdf8' }}>{config.lineHeight}x</strong>
              </div>
              <input
                type="range"
                min={1.4}
                max={2.3}
                step={0.1}
                value={config.lineHeight}
                onChange={(e) => onUpdateConfig({ lineHeight: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* 4. Color Themes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Palette size={14} color="#38bdf8" />
              Anti-Glare Presentation Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(
                [
                  { id: 'oled-black', label: 'OLED Black', bg: '#000000', text: '#ffffff' },
                  { id: 'charcoal', label: 'Charcoal', bg: '#18181b', text: '#f4f4f5' },
                  { id: 'high-vis-yellow', label: 'High-Vis', bg: '#000000', text: '#fde047' },
                  { id: 'warm-amber', label: 'Amber', bg: '#000000', text: '#f59e0b' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateConfig({ theme: t.id as ColorTheme })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: config.theme === t.id ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: t.bg,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: t.text, fontSize: '12px', fontWeight: 700 }}>Aa</div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Show Focus Anchor Guideline</span>
              <input
                type="checkbox"
                checked={config.showGuideLine}
                onChange={(e) => onUpdateConfig({ showGuideLine: e.target.checked })}
                style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Vignette Gradient (Spotlight reading line)</span>
              <input
                type="checkbox"
                checked={config.showVignette}
                onChange={(e) => onUpdateConfig({ showVignette: e.target.checked })}
                style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Auto-Pause on [PAUSE] Cues</span>
              <input
                type="checkbox"
                checked={config.autoPauseOnCues}
                onChange={(e) => onUpdateConfig({ autoPauseOnCues: e.target.checked })}
                style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#38bdf8',
              color: '#090e17',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
