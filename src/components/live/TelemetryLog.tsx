import React, { useState } from 'react';

export interface TelemetryEvent {
  time?: string;
  type: string;
  message?: string;
  source?: string;
  latencyMs?: number;
  [key: string]: any;
}

export interface TelemetryLogProps {
  events: TelemetryEvent[];
  onClearLogs: () => void;
}

export default function TelemetryLog({ events, onClearLogs }: TelemetryLogProps) {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEvents = events.filter((evt) => {
    if (filterType === 'ALL') return true;
    return evt.type === filterType;
  });

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'LIVE_OVERLAY_TRIGGER':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'TRANSCRIPT_CHUNK':
        return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'VIEWER_JOIN':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Log Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>📡</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>WEBSOCKETS & STREAM TELEMETRY LOGS</h2>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
            {events.length} Events Logged
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'LIVE_OVERLAY_TRIGGER', 'TRANSCRIPT_CHUNK', 'VIEWER_JOIN'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  background: filterType === t ? 'rgba(168, 85, 247, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${filterType === t ? '#a855f7' : 'var(--border-glass)'}`,
                  color: filterType === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {t === 'LIVE_OVERLAY_TRIGGER' ? 'Triggers' : t === 'TRANSCRIPT_CHUNK' ? 'AI Transcripts' : t === 'VIEWER_JOIN' ? 'Viewers' : 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={onClearLogs}
            style={{ background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Log Entries Container */}
      <div style={{ background: '#020617', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px', height: '240px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>No telemetry events recorded yet. Ready for stream events.</div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const badge = getEventBadgeStyle(evt.type);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{evt.time}</span>
                  <span style={{ background: badge.bg, color: badge.color, border: badge.border, padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {evt.type}
                  </span>
                  <span style={{ color: '#f1f5f9' }}>{evt.message}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '0.75rem' }}>
                  <span>Source: <strong style={{ color: '#38bdf8' }}>{evt.source || 'CLIENT'}</strong></span>
                  <span style={{ color: '#34d399' }}>{evt.latencyMs || 0} ms</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
