import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Smartphone, CheckCircle, RefreshCw, X, Copy, ExternalLink, Radio, Check } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from '../../services/toast';

interface MobileBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  shortCode: string;
  onTakeReceived: (data: { videoUrl: string; durationSeconds: number; cuePins?: any[] }) => void;
}

export default function MobileBridgeModal({
  isOpen,
  onClose,
  sessionToken,
  shortCode,
  onTakeReceived,
}: MobileBridgeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [phoneDevice, setPhoneDevice] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<'DISCONNECTED' | 'CONNECTED' | 'RECORDING' | 'UPLOADING' | 'DONE'>('DISCONNECTED');
  const [copied, setCopied] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Compute mobile record URL
  const recordUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/record?session=${sessionToken}`
    : `https://studio.shopvideo.tv/record?session=${sessionToken}`;

  // 1. Generate QR Code
  useEffect(() => {
    if (!sessionToken || !isOpen) return;

    QRCode.toDataURL(recordUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [sessionToken, recordUrl, isOpen]);

  // 2. Open SSE Stream to listen for real-time mobile updates
  useEffect(() => {
    if (!sessionToken || !isOpen) return;

    const streamUrl = api.getRecordingSessionStreamUrl(sessionToken);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('connected', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setPhoneDevice(payload.device || 'Mobile Phone');
        setRecordingState('CONNECTED');
        toast.info(`📱 ${payload.device || 'Mobile phone'} connected!`);
      } catch {
        setRecordingState('CONNECTED');
      }
    });

    es.addEventListener('recording_state', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.state === 'START') {
          setRecordingState('RECORDING');
        } else if (payload.state === 'STOP') {
          setRecordingState('UPLOADING');
        }
      } catch (err) {
        console.error('Error parsing recording state', err);
      }
    });

    es.addEventListener('take_uploaded', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setRecordingState('DONE');
        toast.success('🎬 Video take received from your phone!');
        if (onTakeReceived) {
          onTakeReceived(payload);
        }
      } catch (err) {
        console.error('Error handling take uploaded', err);
      }
    });

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [sessionToken, isOpen, onTakeReceived]);

  const handleCopy = () => {
    navigator.clipboard.writeText(recordUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 7, 14, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0d1527 0%, #090e1a 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.1)',
          padding: '28px',
          position: 'relative',
          color: '#f8fafc',
          textAlign: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '14px' }}>
          <Smartphone size={15} color="#38bdf8" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Desktop-to-Phone Teleprompter Bridge
          </span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Scan to Shoot on Phone
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, margin: '0 auto 20px auto', maxWidth: '380px' }}>
          Scan with your iPhone or Android camera to open the mobile teleprompter booth. No login required.
        </p>

        {/* QR Code Canvas */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-block',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            marginBottom: '18px',
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Shoot on Phone QR Code"
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw className="animate-spin" size={28} color="#38bdf8" />
            </div>
          )}
        </div>

        {/* Code & Direct Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', color: '#cbd5e1' }}>
            Session: <strong style={{ color: '#38bdf8' }}>{shortCode || sessionToken.slice(0, 8)}</strong>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
          <a
            href={recordUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Open teleprompter booth in new tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Live SSE Status Indicator */}
        <div
          style={{
            background:
              recordingState === 'DONE'
                ? 'rgba(16, 185, 129, 0.12)'
                : recordingState === 'RECORDING'
                ? 'rgba(239, 68, 68, 0.12)'
                : recordingState === 'CONNECTED'
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(255, 255, 255, 0.03)',
            border:
              recordingState === 'DONE'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : recordingState === 'RECORDING'
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : recordingState === 'CONNECTED'
                ? '1px solid rgba(56, 189, 248, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
          }}
        >
          {recordingState === 'DISCONNECTED' && (
            <>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#94a3b8',
                  boxShadow: '0 0 8px rgba(148, 163, 184, 0.5)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Waiting for mobile device to scan...
              </span>
            </>
          )}

          {recordingState === 'CONNECTED' && (
            <>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8',
                }}
              />
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>
                🟢 {phoneDevice || 'Phone'} Connected • Ready to record take
              </span>
            </>
          )}

          {recordingState === 'RECORDING' && (
            <>
              <Radio size={16} color="#ef4444" className="animate-pulse" />
              <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                🔴 Phone Recording in Progress...
              </span>
            </>
          )}

          {recordingState === 'UPLOADING' && (
            <>
              <RefreshCw size={16} color="#fbbf24" className="animate-spin" />
              <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>
                ⚡ Uploading take to Studio...
              </span>
            </>
          )}

          {recordingState === 'DONE' && (
            <>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                ✨ Video Take Received! Pins placed.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
