import React from 'react';
import { X, List, ChevronRight } from 'lucide-react';
import { SectionHeader } from './teleprompterTypes';

interface SectionNavProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionHeader[];
  currentWordIndex: number;
  onSelectSection: (section: SectionHeader) => void;
}

export const SectionNav: React.FC<SectionNavProps> = ({
  isOpen,
  onClose,
  sections,
  currentWordIndex,
  onSelectSection,
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
          maxWidth: '480px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Table of Contents</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No sections detected. Add markdown headers (e.g. <code># Intro</code>, <code># Product Demo</code>) to navigate sections!
            </div>
          ) : (
            sections.map((sec, idx) => {
              const isCurrent =
                currentWordIndex >= sec.wordIndex &&
                (idx === sections.length - 1 || currentWordIndex < sections[idx + 1].wordIndex);

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    onSelectSection(sec);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrent ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isCurrent ? '#38bdf8' : '#e2e8f0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', minWidth: '18px' }}>
                      {idx + 1}.
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500 }}>{sec.title}</span>
                  </div>
                  <ChevronRight size={15} color={isCurrent ? '#38bdf8' : '#64748b'} />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
