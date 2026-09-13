import React, { useEffect, useState, useRef } from 'react';
import { studioMixer, AudioLevels } from '../../services/StudioAudioMixer';

export default function AudioMixerDock() {
  const [micVol, setMicVol] = useState<number>(1.0);
  const [desktopVol, setDesktopVol] = useState<number>(1.0);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isDesktopMuted, setIsDesktopMuted] = useState<boolean>(false);
  const [levels, setLevels] = useState<AudioLevels>({ micLevel: 0, desktopLevel: 0, masterLevel: 0 });

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const updateMeters = () => {
      const currentLevels = studioMixer.getLevels();
      setLevels(currentLevels);
      animRef.current = requestAnimationFrame(updateMeters);
    };
    animRef.current = requestAnimationFrame(updateMeters);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleMicVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMicVol(val);
    studioMixer.setMicVolume(val);
  };

  const handleDesktopVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDesktopVol(val);
    studioMixer.setDesktopVolume(val);
  };

  const handleToggleMicMute = () => {
    const muted = studioMixer.toggleMicMute();
    setIsMicMuted(muted);
  };

  const handleToggleDesktopMute = () => {
    const muted = studioMixer.toggleDesktopMute();
    setIsDesktopMuted(muted);
  };

  const renderVuMeter = (level: number) => {
    const pct = Math.round(level * 100);
    const color = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
    return (
      <div style={{ width: '100%', height: '8px', background: '#020617', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 0.08s ease-out, background 0.1s ease',
            boxShadow: `0 0 8px ${color}`
          }}
        />
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🎛️</span>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>STUDIO AUDIO MIXER ENGINE</h2>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
            48 kHz Stereo Bus Active
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Independent Channels + Anti-Echo Isolation</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Channel 1: Broadcaster Microphone */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleMicMute}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                style={{
                  background: isMicMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                  border: isMicMuted ? '1px solid #ef4444' : '1px solid #10b981',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {isMicMuted ? '🔇 MUTED' : '🎙️ MIC'}
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Broadcaster Mic</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8' }}>
              {Math.round(micVol * 100)}%
            </span>
          </div>

          {renderVuMeter(levels.micLevel)}

          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={micVol}
            onChange={handleMicVol}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        {/* Channel 2: Desktop / System Sound */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleDesktopMute}
                title={isDesktopMuted ? 'Unmute Desktop Sound' : 'Mute Desktop Sound'}
                style={{
                  background: isDesktopMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                  border: isDesktopMuted ? '1px solid #ef4444' : '1px solid #38bdf8',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {isDesktopMuted ? '🔇 MUTED' : '🖥️ SYSTEM'}
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Mac Desktop Audio</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8' }}>
              {Math.round(desktopVol * 100)}%
            </span>
          </div>

          {renderVuMeter(levels.desktopLevel)}

          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={desktopVol}
            onChange={handleDesktopVol}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
        </div>

        {/* Channel 3: Master Output Bus */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', color: '#c084fc', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700 }}>
                🔊 MASTER
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Broadcast Mix Out</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#34d399' }}>
              ● Streaming
            </span>
          </div>

          {renderVuMeter(levels.masterLevel)}

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Egress Audio Track: Stereo 48kHz</span>
            <span>Sub-Second Latency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
