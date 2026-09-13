import React, { useState, useEffect, useRef } from 'react';

export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: string;
  resolution: string;
  role: string;
  isManuallyAttached?: boolean;
}

export interface LiveCameraStreamProps {
  activeSource: string;
  isPip?: boolean;
}

function LiveCameraStream({ activeSource, isPip }: LiveCameraStreamProps) {
  const [remoteFrameUrl, setRemoteFrameUrl] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>('Connecting to Railway Cloud Router...');
  const [frameCount, setFrameCount] = useState<number>(0);
  const [lastFrameTime, setLastFrameTime] = useState<string | null>(null);

  useEffect(() => {
    console.log('[LiveCameraStream] Subscribing to cloud stream feed for source:', activeSource);
    setStreamStatus(`Connected to Railway Cloud Ingest for ${activeSource}`);

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('wss://digitpop-server-staging.up.railway.app/master_control?sessionId=45f65b49-79ef-48c6-a2e3-9c9655a4f569');
      ws.onopen = () => {
        console.log('[LiveCameraStream] WebSocket connected to Railway Cloud router');
        setStreamStatus('WebSockets Connected — Waiting for Broadcaster Frame Ingest...');
      };
      ws.onmessage = (evt: MessageEvent) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'REMOTE_VIDEO_FRAME' && typeof msg.frameData === 'string' && msg.frameData.startsWith('data:image/')) {
            setRemoteFrameUrl(msg.frameData);
            setFrameCount(prev => {
              const nextCount = prev + 1;
              if (nextCount % 10 === 0) {
                console.log(`📡 [CLIENT FRAME RECEIVER] Rendered Frame #${nextCount} from MacBook Broadcaster!`);
              }
              return nextCount;
            });
            setLastFrameTime(new Date().toLocaleTimeString());
            setStreamStatus('Live Presenter Stream Active (60fps)');
          }
        } catch (e) {}
      };
      ws.onerror = (err) => {
        console.warn('[LiveCameraStream] WebSocket notice:', err);
        setStreamStatus('Cloud connection notice (Reconnecting...)');
      };
    } catch (e) {
      console.warn('[LiveCameraStream] WebSocket connection notice:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [activeSource]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      {/* Telemetry Badge Overlay */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '8px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#fff' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: frameCount > 0 ? '#10b981' : '#f59e0b', boxShadow: frameCount > 0 ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }} />
        <span>Frames: <strong>{frameCount}</strong></span>
        {lastFrameTime && <span style={{ color: '#94a3b8' }}>| Last: {lastFrameTime}</span>}
      </div>

      {/* 1. Live WebSockets Remote Video Stream Frame */}
      {remoteFrameUrl ? (
        <img
          src={remoteFrameUrl}
          alt="Live Remote Stream Feed"
          onError={() => setRemoteFrameUrl(null)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        /* 2. Cloud Stream Standby HUD */
        <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.35), rgba(2, 6, 23, 0.95))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', padding: '6px 16px', borderRadius: '20px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.5px' }}>● RAILWAY CLOUD INGEST ACTIVE</span>
          </div>

          <span style={{ fontSize: isPip ? '1.8rem' : '3.5rem' }}>📹</span>

          <span style={{ fontSize: isPip ? '0.75rem' : '1.1rem', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
            {activeSource === 'IPHONE_ROAMING' ? 'iPhone 16 Pro Roaming Cam (4K 60fps)' : 'MacBook Pro Presenter Cam (1080p 60fps)'}
          </span>

          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.75rem', color: '#c084fc', textAlign: 'center', maxWidth: '420px' }}>
            Status: {streamStatus}
          </div>

          {!isPip && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', maxWidth: '400px', margin: 0 }}>
              Launch <strong style={{ color: '#38bdf8' }}>DigitPop Studio</strong> on your MacBook and tap <strong style={{ color: '#10b981' }}>Start Stream</strong> to push live video frames to Railway Cloud!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LiveScreenCaptureStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const startScreenCapture = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' } as MediaTrackConstraints, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
      }
      setIsCapturing(true);

      const track = displayStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          setIsCapturing(false);
        };
      }
    } catch (err) {
      console.warn('Screen capture cancelled:', err);
      setIsCapturing(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: isCapturing ? 'block' : 'none'
        }}
      />
      {!isCapturing && (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🖥️</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Mac Mini Desktop Screen Stream</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', maxWidth: '420px' }}>
            Click below to capture your actual Mac Mini display (Opportunity OS & Workday ATS) live in 60 FPS 4K.
          </p>
          <button
            onClick={startScreenCapture}
            style={{
              background: 'linear-gradient(135deg, #10b981, #047857)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            🖥️ Start Live Screen Capture
          </button>
        </div>
      )}
    </div>
  );
}

export interface TwitchStageProps {
  activeSource: string;
  onSelectSource: (source: string) => void;
}

export default function TwitchStage({ activeSource, onSelectSource }: TwitchStageProps) {
  const [pipPosition, setPipPosition] = useState<string>('bottom-right');
  const [pipSize, setPipSize] = useState<string>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch('https://digitpop-server-staging.up.railway.app/api/stream/sources');
        const data = await res.json();
        const serverDevices: any[] = (data.success && data.devices) || [];

        setConnectedDevices(prevDevices => {
          if (serverDevices.length > 0) {
            return serverDevices.map(sd => ({
              deviceId: sd.deviceId,
              deviceName: sd.deviceName || 'Client Device',
              deviceType: sd.deviceType || 'IOS_APP',
              status: 'ONLINE',
              resolution: sd.resolution || '4K 60fps',
              role: sd.role || 'PIP_FACE'
            }));
          }
          return prevDevices.filter(d => d.isManuallyAttached);
        });
      } catch (err) {
        // Fallback
      }
    }
    fetchSources();
    const interval = setInterval(fetchSources, 3000);
    return () => clearInterval(interval);
  }, []);

  const assignDeviceRole = async (deviceId: string, newRole: string) => {
    setConnectedDevices(prev => prev.map(d => d.deviceId === deviceId ? { ...d, role: newRole } : d));
    try {
      await fetch('https://digitpop-server-staging.up.railway.app/api/stream/session/45f65b49-79ef-48c6-a2e3-9c9655a4f569/route-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, assignedRole: newRole })
      });
    } catch (err) {
      console.warn('Role assignment notice:', err);
    }
  };

  const handleAttachDevicePreset = async (name: string, type: string, resText: string) => {
    const newId = `dev_${Date.now().toString().slice(-6)}`;
    const newDevice: ConnectedDevice = {
      deviceId: newId,
      deviceName: name,
      deviceType: type,
      status: 'ONLINE',
      resolution: resText,
      role: 'ANGLE_3',
      isManuallyAttached: true
    };

    setConnectedDevices(prev => [...prev, newDevice]);
    setIsPairModalOpen(false);

    try {
      await fetch('https://digitpop-server-staging.up.railway.app/api/stream/session/45f65b49-79ef-48c6-a2e3-9c9655a4f569/attach-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice)
      });
    } catch (err) {
      console.warn('Attach device notice:', err);
    }
  };

  const handleDetachDevice = async (deviceId: string) => {
    setConnectedDevices(prev => prev.filter(d => d.deviceId !== deviceId));

    try {
      await fetch('https://digitpop-server-staging.up.railway.app/api/stream/session/45f65b49-79ef-48c6-a2e3-9c9655a4f569/detach-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
    } catch (err) {
      console.warn('Detach device notice:', err);
    }
  };

  const getPipStyles = (): React.CSSProperties => {
    let sizeStyles = { width: '260px', height: '160px' };
    if (pipSize === 'small') sizeStyles = { width: '180px', height: '110px' };
    if (pipSize === 'large') sizeStyles = { width: '360px', height: '225px' };
    if (pipSize === 'hidden') return { display: 'none' };

    let posStyles: React.CSSProperties = { bottom: '20px', right: '20px' };
    if (pipPosition === 'top-left') posStyles = { top: '20px', left: '20px' };
    if (pipPosition === 'top-right') posStyles = { top: '20px', right: '20px' };
    if (pipPosition === 'bottom-left') posStyles = { bottom: '20px', left: '20px' };

    return {
      position: 'absolute',
      ...posStyles,
      ...sizeStyles,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid rgba(168, 85, 247, 0.6)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(168, 85, 247, 0.3)',
      zIndex: 10,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stage Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>📺</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>TWITCH-STYLE MULTI-SOURCE STAGE</h2>
          <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            Active: {activeSource}
          </span>
        </div>

        {/* PiP Layout Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>PiP Size:</span>
          {['small', 'medium', 'large', 'hidden'].map((s) => (
            <button
              key={s}
              onClick={() => setPipSize(s)}
              style={{
                background: pipSize === s ? 'rgba(168, 85, 247, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${pipSize === s ? '#a855f7' : 'var(--border-glass)'}`,
                color: pipSize === s ? '#f8fafc' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textTransform: 'capitalize'
              }}
            >
              {s}
            </button>
          ))}

          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>Corner:</span>
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((p) => (
            <button
              key={p}
              onClick={() => setPipPosition(p)}
              style={{
                background: pipPosition === p ? 'rgba(59, 130, 246, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${pipPosition === p ? '#3b82f6' : 'var(--border-glass)'}`,
                color: pipPosition === p ? '#f8fafc' : 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              {p.split('-').map(w => w[0].toUpperCase()).join('')}
            </button>
          ))}
        </div>
      </div>

      {/* Connected Devices Source Matrix Bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>📱 LIVE CONNECTED CLIENT DEVICES MATRIX ({connectedDevices.length})</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>● Railway Cloud Router Active</span>
          </div>

          <button
            onClick={() => setIsPairModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ➕ Pair / Attach Device
          </button>
        </div>

        {connectedDevices.length === 0 ? (
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '10px', border: '1px dashed var(--border-glass)', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>📡</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>NO CLIENT DEVICES CURRENTLY REGISTERED</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '460px', lineHeight: 1.5 }}>
              Launch <strong style={{ color: '#38bdf8' }}>DigitPop Studio</strong> on your MacBook or iPhone to auto-register, or click <strong style={{ color: '#3b82f6' }}>"➕ Pair / Attach Device"</strong> above to attach a stream source manually.
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {connectedDevices.map(dev => (
              <div key={dev.deviceId} style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '12px', borderRadius: '12px', border: dev.status === 'ONLINE' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{dev.deviceName}</span>
                    {dev.status === 'ONLINE' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: dev.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      color: dev.status === 'ONLINE' ? '#34d399' : '#94a3b8',
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {dev.status || 'STANDBY'}
                    </span>

                    <button
                      onClick={() => handleDetachDevice(dev.deviceId)}
                      title="Disconnect / Remove Device"
                      style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.65rem' }}
                    >
                      🔌 Remove
                    </button>
                  </div>
                </div>

                {/* Mini Live Stream Video Preview Thumbnail */}
                <div
                  onClick={() => onSelectSource('MACBOOK_FACETIME')}
                  style={{ width: '100%', height: '85px', borderRadius: '8px', overflow: 'hidden', background: '#020617', border: '1px solid rgba(168, 85, 247, 0.3)', cursor: 'pointer', position: 'relative' }}
                >
                  <LiveCameraStream activeSource="MINI_PREVIEW" isPip />
                  <div style={{ position: 'absolute', bottom: '4px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#a855f7', fontWeight: 700 }}>
                    ▶ LIVE PREVIEW (1080p)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>Type: {dev.deviceType}</span>
                  <span>{dev.resolution}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  {['MAIN_SCREEN', 'PIP_FACE', 'ANGLE_3'].map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        assignDeviceRole(dev.deviceId, role);
                        if (role === 'PIP_FACE') onSelectSource('MACBOOK_FACETIME');
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: dev.role === role ? '1px solid #10b981' : '1px solid var(--border-glass)',
                        background: dev.role === role ? 'rgba(16, 185, 129, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                        color: dev.role === role ? '#34d399' : '#94a3b8'
                      }}
                    >
                      {role === 'MAIN_SCREEN' ? '🖥️ Main' : role === 'PIP_FACE' ? '📷 PiP' : '📹 Angle 3'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Broadcast Composition Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '14px', overflow: 'hidden', background: '#020617', border: '1px solid var(--border-glass)' }}>
        {/* Main Background Feed */}
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {activeSource === 'MAC_MINI_DESKTOP' ? (
            <LiveScreenCaptureStream />
          ) : activeSource === 'MACBOOK_FACETIME' || activeSource === 'IPHONE_ROAMING' ? (
            <LiveCameraStream activeSource={activeSource} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #064e3b, #047857)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontSize: '3rem' }}>📱</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>iPhone Wireless Roaming Camera</h3>
              <p style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>Secondary Mobile Close-Up Angle (4K 60fps)</p>
            </div>
          )}
        </div>

        {/* Picture-in-Picture (PiP) Inset Box */}
        <div style={getPipStyles()}>
          <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a855f7' }}>PIP: Live Broadcaster Cam</span>
              <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>
                {isMuted ? '🔇' : '🎙️'}
              </button>
            </div>

            <LiveCameraStream activeSource="PIP_CAM" isPip />
          </div>
        </div>
      </div>

      {/* Source Switcher Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SELECT ACTIVE BROADCAST SOURCE:</span>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onSelectSource('MAC_MINI_DESKTOP')}
            style={{
              background: activeSource === 'MAC_MINI_DESKTOP' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${activeSource === 'MAC_MINI_DESKTOP' ? '#60a5fa' : 'var(--border-glass)'}`,
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖥️ Mac Mini Screen Share
          </button>

          <button
            onClick={() => onSelectSource('MACBOOK_FACETIME')}
            style={{
              background: activeSource === 'MACBOOK_FACETIME' ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${activeSource === 'MACBOOK_FACETIME' ? '#c084fc' : 'var(--border-glass)'}`,
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💻 MacBook Presenter Cam
          </button>

          <button
            onClick={() => onSelectSource('IPHONE_ROAMING')}
            style={{
              background: activeSource === 'IPHONE_ROAMING' ? 'linear-gradient(135deg, #10b981, #047857)' : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${activeSource === 'IPHONE_ROAMING' ? '#34d399' : 'var(--border-glass)'}`,
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📱 iPhone Roaming Cam
          </button>
        </div>
      </div>

      {/* Pair / Attach Device Modal */}
      {isPairModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '16px', padding: '24px', maxWidth: '460px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>📱 Pair New Client Broadcaster Device</h3>
              <button onClick={() => setIsPairModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Scan the session pairing QR code or tap a quick preset below to attach a new broadcasting client to the live Railway Cloud router:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleAttachDevicePreset('iPhone 16 Pro Roaming Cam', 'IOS_APP', '4K 60fps')}
                style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #10b981', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📱 Attach iPhone 16 Pro (4K 60fps)</span>
                <span style={{ color: '#34d399', fontSize: '0.75rem' }}>+ Attach</span>
              </button>

              <button
                onClick={() => handleAttachDevicePreset('iPad Pro Studio Cam', 'IOS_APP', '1080p 60fps')}
                style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #a855f7', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📱 Attach iPad Pro Studio (1080p)</span>
                <span style={{ color: '#c084fc', fontSize: '0.75rem' }}>+ Attach</span>
              </button>

              <button
                onClick={() => handleAttachDevicePreset('Sony Alpha A7IV Studio Rig', 'HDMI_CAPTURE', '4K 60fps')}
                style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #38bdf8', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📷 Attach Sony Alpha A7IV Rig (4K)</span>
                <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>+ Attach</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
