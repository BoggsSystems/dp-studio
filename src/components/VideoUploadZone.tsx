import React, { useState, useRef } from 'react';
import { UploadCloud, Video, CheckCircle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { toast } from '../services/toast';

interface VideoUploadZoneProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  onVideoLoaded: (url: string, duration: number, thumbnailUrl?: string) => void;
  onThumbnailCapture?: (dataUrl: string) => void;
  currentTime?: number;
}

export default function VideoUploadZone({
  videoUrl,
  thumbnailUrl,
  onVideoLoaded,
  onThumbnailCapture,
  currentTime = 0,
}: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDirectUrlMode, setIsDirectUrlMode] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (.mp4, .mov, .webm)', 'Invalid File Type');
      return;
    }

    setUploadProgress(0);
    try {
      const { url } = await api.uploadMedia(file, 'vods', (prog) => {
        const pct = typeof prog === 'number' ? prog : prog.percent;
        setUploadProgress(pct);
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 800);
      toast.success('Video uploaded successfully', 'Upload Complete');

      // Create object URL for instant local duration probing
      const probeVideo = document.createElement('video');
      probeVideo.src = URL.createObjectURL(file);
      probeVideo.onloadedmetadata = () => {
        const duration = probeVideo.duration || 60;
        
        // Auto capture first frame as thumbnail
        probeVideo.currentTime = Math.min(1.0, duration / 2);
        probeVideo.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = probeVideo.videoWidth || 640;
          canvas.height = probeVideo.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(probeVideo, 0, 0, canvas.width, canvas.height);
            const generatedThumb = canvas.toDataURL('image/jpeg', 0.85);
            onVideoLoaded(url, duration, generatedThumb);
          } else {
            onVideoLoaded(url, duration);
          }
        };
      };
    } catch (err: any) {
      toast.error(err.message || 'Video upload failed', 'Upload Error');
      setUploadProgress(null);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onVideoLoaded(customUrl.trim(), 120, thumbnailUrl || undefined);
    setIsDirectUrlMode(false);
  };

  return (
    <div className="surface-panel" style={{ marginBottom: '20px' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <Video size={16} color="var(--accent-teal)" />
            <span>Master Video Source (Cloudflare R2)</span>
          </div>
          <div className="panel-desc">
            Direct high-speed ingest to Cloudflare edge CDN with zero egress streaming.
          </div>
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: '12px' }}
          onClick={() => setIsDirectUrlMode(!isDirectUrlMode)}
        >
          <LinkIcon size={13} />
          <span>{isDirectUrlMode ? 'Upload File Instead' : 'Paste Existing CDN/HLS URL'}</span>
        </button>
      </div>

      {isDirectUrlMode ? (
        <form onSubmit={handleCustomUrlSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="url"
            className="form-input"
            placeholder="https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/vods/your_video.mp4"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            Load Stream
          </button>
        </form>
      ) : videoUrl ? (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '260px',
              height: '146px',
              background: '#000',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              controls
              preload="metadata"
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--status-online)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle size={14} /> Cloudflare Edge CDN Active
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                wordBreak: 'break-all',
                background: 'var(--bg-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '10px',
              }}
            >
              {videoUrl}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw size={12} /> Replace Video File
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'var(--bg-surface)' : 'var(--bg-primary)',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />

          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--text-secondary)',
            }}
          >
            <UploadCloud size={24} />
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Click or drag & drop video file (.mp4, .mov, .webm)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Automatically uploaded directly to Cloudflare R2 bucket: <code>digitpop-media</code>
          </div>

          {uploadProgress !== null && (
            <div style={{ marginTop: '20px', maxWidth: '320px', margin: '20px auto 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Uploading to R2...</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #2563eb, #0d9488)',
                    transition: 'width 0.1s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
