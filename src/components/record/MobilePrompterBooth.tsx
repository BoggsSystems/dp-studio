import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Play, Pause, ArrowLeft, Check, Sparkles, Video, AlertCircle, ShoppingBag, Eye, Lock } from 'lucide-react';
import { OpticalConfig, ScriptToken } from './prompterTypes';
import { parseShoppableScript } from './scriptParser';
import { api } from '../../services/api';

interface MobilePrompterBoothProps {
  sessionToken: string;
}

export default function MobilePrompterBooth({ sessionToken }: MobilePrompterBoothProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optical Config tuned specifically for vertical mobile notch hugging
  const [config, setConfig] = useState<OpticalConfig>({
    anchorPosition: 'top',
    anchorTopPercent: 14, // 14% from top bezel (right under selfie lens)
    columnWidthPx: 320,
    fontSizePx: 26,
    lineHeight: 1.6,
    theme: 'oled-black',
    showGuideLine: true,
    showVignette: true,
    textAlignment: 'center',
    targetWpm: 140,
    autoPauseOnCues: false,
  });

  // Recording & Prompter States
  const [recordingState, setRecordingState] = useState<'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'STOPPED' | 'UPLOADING' | 'DONE'>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isPrompterRunning, setIsPrompterRunning] = useState(false);
  const [activeCue, setActiveCue] = useState<ScriptToken | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cuePins, setCuePins] = useState<Array<{ productId: string; timestampSeconds: number }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  // 1. Fetch Session and Notify Desktop Phone Connected
  useEffect(() => {
    let mounted = true;
    api.getRecordingSession(sessionToken)
      .then((sess) => {
        if (!mounted) return;
        setSession(sess);
        if (sess.targetWpm) setConfig((c) => ({ ...c, targetWpm: sess.targetWpm }));
        setLoading(false);
        // Inform desktop studio that this device is connected
        const deviceName = /iPhone/i.test(navigator.userAgent) ? 'iPhone' : /Android/i.test(navigator.userAgent) ? 'Android Device' : 'Mobile Camera';
        api.notifyPhoneConnected(sessionToken, deviceName).catch(() => {});
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Session expired or not found.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [sessionToken]);

  // 2. Initialize Camera Feed
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  // Request Wake Lock to prevent screen sleep during recording
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Parse Script Tokens
  const parsedScript = React.useMemo(() => {
    return parseShoppableScript(session?.scriptText || '');
  }, [session?.scriptText]);

  // Smooth Optical Scroller Loop
  useEffect(() => {
    if (!isPrompterRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const words = parsedScript.totalWordCount || 1;
    // Calculate pixels/sec dynamically
    const pxPerSec = (config.targetWpm / 60) * (config.fontSizePx * config.lineHeight * 0.95);

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      offsetRef.current += pxPerSec * dt;
      setScrollOffset(offsetRef.current);

      // Check stage cues at the anchor point
      const currentWordIdx = Math.floor((offsetRef.current / (pxPerSec * (60 / config.targetWpm))));
      const currentCue = parsedScript.tokens.find((t) => t.type === 'cue' && Math.abs((t.wordIndex || 0) - currentWordIdx) <= 2);
      if (currentCue) {
        setActiveCue(currentCue);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPrompterRunning, config.targetWpm, config.fontSizePx, config.lineHeight, parsedScript]);

  // Countdown & Trigger
  const startRecordingFlow = () => {
    setRecordingState('COUNTDOWN');
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startActualMediaRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualMediaRecording = () => {
    setRecordingState('RECORDING');
    setIsPrompterRunning(true);
    setElapsedSec(0);
    offsetRef.current = 0;
    setScrollOffset(0);
    chunksRef.current = [];
    setCuePins([]);

    api.notifyRecordingState(sessionToken, 'START').catch(() => {});

    if (streamRef.current) {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : 'video/webm';

      const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordedBlob(fullBlob);
        setRecordedBlobUrl(URL.createObjectURL(fullBlob));
        setRecordingState('STOPPED');
      };

      recorder.start(500);
    }
  };

  const stopRecording = () => {
    setIsPrompterRunning(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    api.notifyRecordingState(sessionToken, 'STOP').catch(() => {});
  };

  // Upload take directly to Studio project
  const handleSendToStudio = async () => {
    if (!recordedBlob) return;
    setRecordingState('UPLOADING');
    try {
      const file = new File([recordedBlob], `take_${Date.now()}.mp4`, { type: recordedBlob.type });
      const uploadRes = await api.uploadVideo(file, session.projectId);

      await api.completeRecordingSession(sessionToken, {
        videoUrl: uploadRes.url,
        durationSeconds: elapsedSec || 30,
        cuePins,
      });

      setRecordingState('DONE');
    } catch (err: any) {
      setError(err.message || 'Failed to upload video to studio.');
      setRecordingState('STOPPED');
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <RefreshCw className="animate-spin" size={24} color="#38bdf8" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#0a0f1d', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Shoot Session Expired</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '320px', marginTop: '8px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', userSelect: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* 1. Full-bleed Live Camera Preview */}
      <video
        ref={videoPreviewRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          opacity: recordingState === 'DONE' ? 0.2 : 0.85,
        }}
      />

      {/* 2. Top-Bezel Optical Eye-Contact Anchor (Tight 320px scroller right below selfie lens) */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '38%',
          overflow: 'hidden',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {/* Optical Reading Marker */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.7), transparent)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
          }}
        />

        {/* Scrolling Script Text */}
        <div
          ref={contentRef}
          style={{
            transform: `translateY(${70 - scrollOffset}px)`,
            textAlign: config.textAlignment,
            fontSize: `${config.fontSizePx}px`,
            lineHeight: config.lineHeight,
            fontWeight: 700,
            color: '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 2px #000',
            paddingTop: '20px',
          }}
        >
          {parsedScript.tokens.map((token) => {
            if (token.type === 'heading') {
              return (
                <div key={token.id} style={{ color: '#38bdf8', fontSize: '18px', textTransform: 'uppercase', margin: '14px 0 6px' }}>
                  {token.content}
                </div>
              );
            }
            if (token.type === 'cue') {
              return (
                <span
                  key={token.id}
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    margin: '0 4px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.85)',
                    color: '#000',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  👉 {token.cueLabel || token.cueType}
                </span>
              );
            }
            return (
              <span key={token.id} data-token-id={token.id} style={{ margin: '0 3px' }}>
                {token.content}
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. Stage Cue Alert Banner (Pops up when a product cue is reached) */}
      {activeCue && (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #f59e0b',
            borderRadius: '999px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '13px',
            zIndex: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <ShoppingBag size={15} />
          <span>{activeCue.cueLabel || 'Show Product Now'}</span>
        </div>
      )}

      {/* 4. Countdown Overlay */}
      {recordingState === 'COUNTDOWN' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 50 }}>
          <div style={{ fontSize: '96px', fontWeight: 900, color: '#38bdf8', animation: 'pulse 0.8s infinite' }}>
            {countdown}
          </div>
        </div>
      )}

      {/* 5. Bottom Touch Action Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 20px 36px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 40,
        }}
      >
        {/* Flip Camera */}
        <button
          onClick={() => setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))}
          disabled={recordingState === 'RECORDING'}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={20} />
        </button>

        {/* Big Shutter Record / Stop Button */}
        {recordingState === 'IDLE' && (
          <button
            onClick={startRecordingFlow}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '4px solid #ffffff',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff' }} />
          </button>
        )}

        {recordingState === 'RECORDING' && (
          <button
            onClick={stopRecording}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '4px solid #ffffff',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#fff' }} />
          </button>
        )}

        {/* Speed Adjustment (WPM) */}
        <button
          onClick={() => setConfig((c) => ({ ...c, targetWpm: c.targetWpm >= 180 ? 110 : c.targetWpm + 20 }))}
          style={{
            padding: '8px 12px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {config.targetWpm} WPM
        </button>
      </div>

      {/* 6. Take Review & Instant Cloud Upload Modal */}
      {recordingState === 'STOPPED' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 29, 0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 60, textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '16px' }}>
            <Video size={28} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Take Recorded!</h3>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 24px', maxWidth: '280px' }}>
            Ready to transfer directly to project <strong>"{session?.projectName}"</strong> on your desktop studio.
          </p>

          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button
              onClick={() => {
                setRecordingState('IDLE');
                setRecordedBlob(null);
              }}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '13px' }}
            >
              Retake
            </button>
            <button
              onClick={handleSendToStudio}
              style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              Send to Studio ⚡
            </button>
          </div>
        </div>
      )}

      {/* 7. Uploading State */}
      {recordingState === 'UPLOADING' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 29, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 70, textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={36} color="#38bdf8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Streaming to Cloud...</h3>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Transferring take directly to your desktop timeline.</p>
        </div>
      )}

      {/* 8. Success Screen */}
      {recordingState === 'DONE' && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a0f1d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 80, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '16px' }}>
            <Check size={32} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Take Handed Off!</h3>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 24px', maxWidth: '280px' }}>
            Check your desktop screen. Your video and shoppable product pins are already loaded!
          </p>
          <button
            onClick={() => setRecordingState('IDLE')}
            style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            Shoot Another Take
          </button>
        </div>
      )}
    </div>
  );
}
