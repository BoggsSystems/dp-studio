import React, { useState } from 'react';

export interface ProductGroup {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  icon: string;
  badge?: string;
}

export interface ShoppableTriggerDeckProps {
  onTriggerOverlay: (group: ProductGroup) => Promise<void> | void;
  isAiAutopilot: boolean;
  onToggleAiAutopilot: () => void;
}

export default function ShoppableTriggerDeck({
  onTriggerOverlay,
  isAiAutopilot,
  onToggleAiAutopilot
}: ShoppableTriggerDeckProps) {
  const [activeTriggeringId, setActiveTriggeringId] = useState<string | null>(null);

  const productGroups: ProductGroup[] = [
    {
      id: 'efc15c77-d4b0-43a6-af53-e9e4ee036d56',
      title: 'Opportunity OS Pro Pass',
      subtitle: '1-Click Profile Autofill & ATS Resume Injection Engine',
      description: 'Execute multi-ATS applications in 10ms with 0 AI API overhead.',
      price: '$49.00',
      icon: '⚡',
      badge: 'Bestseller'
    },
    {
      id: 'book_group_101',
      title: "Jeff's Technical Career Book",
      subtitle: 'Master Executive AI Engineering & Velocity',
      description: 'Amazon Paperback & Kindle Executive Career Guide',
      price: '$24.99',
      icon: '📚',
      badge: 'Amazon Hot Release'
    },
    {
      id: 'studio_light_101',
      title: "Jeff's Broadcast LED Light",
      subtitle: 'Professional Ambient Softbox Panel',
      description: 'Cyberpunk neon purple & teal stream lighting setup',
      price: '$89.00',
      icon: '💡',
      badge: 'Studio Hardware'
    }
  ];

  const handleTrigger = async (group: ProductGroup) => {
    setActiveTriggeringId(group.id);
    await onTriggerOverlay(group);
    setTimeout(() => setActiveTriggeringId(null), 1000);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Control Deck Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🛍️</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>SHOPPABLE PRODUCER CONTROL DECK</h2>
        </div>

        {/* AI Autopilot Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isAiAutopilot ? '#a855f7' : 'var(--text-muted)' }}>
            🤖 AI Autopilot Engine
          </span>
          <button
            onClick={onToggleAiAutopilot}
            style={{
              width: '42px',
              height: '24px',
              borderRadius: '12px',
              background: isAiAutopilot ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : '#334155',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: isAiAutopilot ? '21px' : '3px',
                transition: 'all 0.2s ease'
              }}
            />
          </button>
        </div>
      </div>

      {/* 1-Tap Trigger Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {productGroups.map((group) => {
          const isTriggering = activeTriggeringId === group.id;
          return (
            <div
              key={group.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-glass)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem', background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>{group.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{group.title}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{group.subtitle}</p>
                  </div>
                </div>

                <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {group.badge}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{group.description}</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{group.price}</span>

                <button
                  onClick={() => handleTrigger(group)}
                  className="btn-trigger"
                  style={{
                    background: isTriggering ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                    color: isTriggering ? '#fff' : undefined,
                    boxShadow: isTriggering ? '0 0 20px rgba(16, 185, 129, 0.6)' : undefined
                  }}
                >
                  {isTriggering ? '⚡ DISPATCHED!' : '⚡ 1-Tap Trigger'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
