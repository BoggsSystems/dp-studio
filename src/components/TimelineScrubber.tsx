import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Plus, MapPin, Tag } from 'lucide-react';
import { ProductGroup } from '../types';

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  productGroups: ProductGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onAddPinAtCurrentTime: () => void;
}

export default function TimelineScrubber({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  productGroups,
  selectedGroupId,
  onSelectGroup,
  onAddPinAtCurrentTime,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * duration);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="surface-panel" style={{ marginTop: '16px' }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '36px', height: '36px', padding: 0 }}
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            className="btn btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            title="Rewind 5s"
          >
            <RotateCcw size={14} />
          </button>

          <button
            className="btn btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            title="Forward 5s"
          >
            <RotateCw size={14} />
          </button>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, marginLeft: '6px' }}>
            <span style={{ color: 'var(--text-primary)' }}>{formatTime(currentTime)}</span>
            <span style={{ color: 'var(--text-muted)' }}> / {formatTime(duration)}</span>
          </div>
        </div>

        <button
          className="btn btn-success"
          onClick={onAddPinAtCurrentTime}
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          <Plus size={14} />
          <span>Drop Shoppable Pin @ {formatTime(currentTime).split('.')[0]}</span>
        </button>
      </div>

      {/* Visual Timeline Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: 'relative',
          height: '42px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-medium)',
          cursor: 'pointer',
          overflow: 'visible',
          userSelect: 'none',
        }}
      >
        {/* Synthetic Audio / Waveform Visual representation */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
            opacity: 0.25,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: `${15 + Math.sin(i * 0.45) * 14 + (i % 5) * 4}px`,
                background: 'var(--text-secondary)',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>

        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progressPct}%`,
            background: 'rgba(37, 99, 235, 0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Playhead Cursor */}
        <div
          style={{
            position: 'absolute',
            left: `${progressPct}%`,
            top: '-4px',
            bottom: '-4px',
            width: '2px',
            background: '#ffffff',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ffffff',
            }}
          />
        </div>

        {/* Product Group Pins on Timeline */}
        {productGroups.map((group) => {
          const pinPct = duration > 0 ? (group.timestampSeconds / duration) * 100 : 0;
          const isSelected = selectedGroupId === group.id;

          return (
            <div
              key={group.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGroup(group.id);
                onSeek(group.timestampSeconds);
              }}
              title={`${group.title} (${group.timestampSeconds.toFixed(1)}s)`}
              style={{
                position: 'absolute',
                left: `${pinPct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 20 : 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isSelected ? '28px' : '22px',
                height: isSelected ? '28px' : '22px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--accent-teal-light)' : 'var(--accent-blue)',
                color: '#ffffff',
                boxShadow: isSelected ? '0 0 10px rgba(20, 184, 166, 0.8)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Tag size={isSelected ? 14 : 11} />
            </div>
          );
        })}
      </div>

      {/* Pin Counter & Quick Nav */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
        {productGroups.map((group, index) => {
          const isSelected = selectedGroupId === group.id;
          return (
            <button
              key={group.id}
              onClick={() => {
                onSelectGroup(group.id);
                onSeek(group.timestampSeconds);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
                border: `1px solid ${isSelected ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <MapPin size={10} color={isSelected ? 'var(--accent-teal)' : 'var(--text-muted)'} />
              <span>#{index + 1} {group.title || 'Untitled Pin'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '10px' }}>
                {group.timestampSeconds.toFixed(1)}s
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
