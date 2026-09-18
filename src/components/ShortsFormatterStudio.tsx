import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Type,
  ShoppingBag,
  Download,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  Sliders,
  Flame,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';

interface WordItem {
  id: string;
  word: string;
  start: number;
  end: number;
}

interface SubtitleChunk {
  id: string;
  start: number;
  end: number;
  words: WordItem[];
  text: string;
}

export type HighlightColor = 'amber' | 'emerald' | 'cyan' | 'pink' | 'crimson' | 'violet';
export type LayoutMode = 'FIT_BLUR' | 'COVER_CROP';
export type WordPacing = 'ONE_WORD' | 'TWO_THREE' | 'SENTENCE';

const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; hex: string; glow: string }> = {
  amber: { label: 'Electric Amber', hex: '#FFB800', glow: 'rgba(255, 184, 0, 0.6)' },
  emerald: { label: 'Neon Emerald', hex: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  cyan: { label: 'Cyber Cyan', hex: '#00F2FE', glow: 'rgba(0, 242, 254, 0.6)' },
  pink: { label: 'Hot Pink', hex: '#FF007F', glow: 'rgba(255, 0, 127, 0.6)' },
  crimson: { label: 'Crimson Red', hex: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
  violet: { label: 'Neon Violet', hex: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
};

const EMOJI_MAP: Record<string, string> = {
  analytics: '📈',
  opportunity: '🚀',
  system: '⚡',
  autofill: '🤖',
  code: '💻',
  speedrun: '⚡',
  job: '💼',
  money: '💰',
  salary: '💵',
  ats: '🎯',
  ai: '🧠',
  fast: '⚡',
  portal: '🌀',
  click: '👆',
  screen: '🖥️',
  book: '📖',
  apply: '✅',
};

export default function ShortsFormatterStudio() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string>('');
  const [words, setWords] = useState<WordItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Styling & Customization Controls
  const [highlightColor, setHighlightColor] = useState<HighlightColor>('amber');
  const [fontSize, setFontSize] = useState<number>(26);
  const [verticalPosition, setVerticalPosition] = useState<number>(55); // % from top
  const [wordPacing, setWordPacing] = useState<WordPacing>('TWO_THREE');
  const [autoEmojis, setAutoEmojis] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FIT_BLUR');
  const [showShoppableDrawer, setShowShoppableDrawer] = useState<boolean>(true);

  // Social copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Load catalog products
  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data);
      if (data.length > 0) setSelectedProduct(data[0]);
    });
  }, []);

  // Handle Video File Selection
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setIsPlaying(false);
    setCurrentTime(0);

    // Auto-transcribe with Groq Whisper Large v3 Turbo
    setIsTranscribing(true);
    setTranscribeProgress('Transcribing audio with Groq Whisper Large v3 Turbo...');

    try {
      const res = await api.transcribeVideo(file);
      if (res && res.words && res.words.length > 0) {
        const formattedWords: WordItem[] = res.words.map((w, idx) => ({
          id: `w_${idx}_${Date.now()}`,
          word: w.word.trim(),
          start: w.start,
          end: w.end,
        }));
        setWords(formattedWords);
      } else if (res && res.text) {
        // Fallback segment splitting
        const split = res.text.split(/\s+/).filter(Boolean);
        const estDuration = res.duration || 30;
        const wordTime = estDuration / split.length;
        const formattedWords: WordItem[] = split.map((word, idx) => ({
          id: `w_${idx}_${Date.now()}`,
          word,
          start: idx * wordTime,
          end: (idx + 1) * wordTime,
        }));
        setWords(formattedWords);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      alert(`Transcription error: ${err.message || 'Failed to transcribe'}`);
    } finally {
      setIsTranscribing(false);
      setTranscribeProgress('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Group words into display chunks based on pacing
  const chunks = useMemo<SubtitleChunk[]>(() => {
    if (words.length === 0) return [];
    const result: SubtitleChunk[] = [];

    if (wordPacing === 'ONE_WORD') {
      words.forEach((w, idx) => {
        result.push({
          id: `chunk_${idx}`,
          start: w.start,
          end: w.end,
          words: [w],
          text: w.word,
        });
      });
      return result;
    }

    const wordsPerChunk = wordPacing === 'TWO_THREE' ? 3 : 6;
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const slice = words.slice(i, i + wordsPerChunk);
      if (slice.length > 0) {
        result.push({
          id: `chunk_${i}`,
          start: slice[0].start,
          end: slice[slice.length - 1].end,
          words: slice,
          text: slice.map((w) => w.word).join(' '),
        });
      }
    }
    return result;
  }, [words, wordPacing]);

  // Current active chunk based on playback time
  const activeChunk = useMemo<SubtitleChunk | null>(() => {
    if (chunks.length === 0) return null;
    return (
      chunks.find((c) => currentTime >= c.start - 0.05 && currentTime <= c.end + 0.15) || null
    );
  }, [chunks, currentTime]);

  // Play/Pause Video
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Helper to attach emoji to a word
  const getWordDisplay = (wordObj: WordItem) => {
    const clean = wordObj.word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toLowerCase();
    let text = uppercase ? wordObj.word.toUpperCase() : wordObj.word;
    if (autoEmojis && EMOJI_MAP[clean]) {
      text = `${text} ${EMOJI_MAP[clean]}`;
    }
    return text;
  };

  // Social Copy Generation
  const fullTranscript = useMemo(() => {
    return words.map((w) => w.word).join(' ');
  }, [words]);

  const socialTitles = useMemo(() => {
    if (!fullTranscript) return ['How to build AI systems ⚡', 'Bypassing 45-min portals in 10ms 🚀'];
    return [
      `How to bypass 45-minute ATS portals in 10 milliseconds ⚡`,
      `The AI Engineering Secret Nobody Tells You (Speedrun) 🔥`,
      `I automated my entire application pipeline with Opportunity OS 🚀`,
    ];
  }, [fullTranscript]);

  const pinnedComment = useMemo(() => {
    const productTitle = selectedProduct ? selectedProduct.title : 'Opportunity OS Platform';
    const productUrl = selectedProduct?.externalUrl || 'https://opportunity-system.com/about';
    return `👉 Grab the ${productTitle} and free Chapter 1 blueprint here: ${productUrl} (Link also in Bio ⚡)`;
  }, [selectedProduct]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Client-Side 1080x1920 MP4 Video Exporter using Canvas + MediaRecorder
  const handleExportShort = async () => {
    if (!videoRef.current || !videoUrl) return;
    setIsExporting(true);
    setExportProgress(10);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Could not initialize canvas context');
      setIsExporting(false);
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      let combinedStream = stream;

      // Capture audio from video element if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        if (dest.stream.getAudioTracks().length > 0) {
          combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        }
      } catch (e) {}

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 6000000,
      });

      const chunksRecorded: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRecorded.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRecorded, { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `digitpop_short_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsExporting(false);
        setExportProgress(100);
      };

      mediaRecorder.start();
      video.currentTime = 0;
      await video.play();
      setIsPlaying(true);

      const renderFrame = () => {
        if (video.ended || video.paused || !isExporting) {
          if (mediaRecorder.state === 'recording') mediaRecorder.stop();
          return;
        }

        // 1. Draw Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1920);

        if (layoutMode === 'FIT_BLUR') {
          // Blurred background
          ctx.save();
          ctx.filter = 'blur(30px) brightness(0.4)';
          ctx.drawImage(video, -200, -200, 1480, 2320);
          ctx.restore();

          // Center video fit
          const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const drawWidth = 1080;
          const drawHeight = 1080 / videoAspect;
          const drawY = (1920 - drawHeight) / 2;
          ctx.drawImage(video, 0, drawY, drawWidth, drawHeight);
        } else {
          // Cover crop
          ctx.drawImage(video, 0, 0, 1080, 1920);
        }

        // 2. Draw Bouncing Subtitles
        const currentT = video.currentTime;
        const currChunk = chunks.find((c) => currentT >= c.start - 0.05 && currentT <= c.end + 0.15);
        if (currChunk) {
          const yPos = 1920 * (verticalPosition / 100);
          ctx.font = `900 ${fontSize * 2.2}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Measure total width to space words
          const wordsToDraw = currChunk.words;
          const activeIndex = wordsToDraw.findIndex(
            (w) => currentT >= w.start - 0.05 && currentT <= w.end + 0.05
          );

          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 16;
          ctx.lineWidth = 12;
          ctx.strokeStyle = '#000000';

          const textString = wordsToDraw
            .map((w, idx) => (idx === activeIndex ? `[${getWordDisplay(w)}]` : getWordDisplay(w)))
            .join(' ');

          ctx.strokeText(textString, 540, yPos);
          ctx.fillStyle = HIGHLIGHT_COLORS[highlightColor].hex;
          ctx.fillText(textString, 540, yPos);
        }

        setExportProgress(Math.min(95, Math.round((video.currentTime / (video.duration || 1)) * 100)));
        requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (err: any) {
      console.error('Export recording failed:', err);
      setIsExporting(false);
      alert('Direct canvas recording not supported on this browser version.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
      {/* Left Column: Formatter Controls & Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Title Panel */}
        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                <Sparkles size={20} color="var(--accent-amber)" />
                <span>AI Shorts & Kinetic Subtitle Formatter</span>
                <span className="badge badge--emerald" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  Groq Large-v3 Turbo
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Transform raw recordings into polished 9:16 Shorts with bouncing animated subtitles, viral hooks, and shoppable 1-click checkout.
              </div>
            </div>
            {videoFile && (
              <button
                onClick={() => {
                  setVideoFile(null);
                  setVideoUrl(null);
                  setWords([]);
                }}
                className="btn btn--outline"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <RotateCcw size={14} /> New Video
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          {!videoUrl && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                marginTop: '16px',
                border: '2px dashed rgba(255, 184, 0, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 24px',
                textAlign: 'center',
                background: 'rgba(255, 184, 0, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => document.getElementById('shorts-upload-input')?.click()}
            >
              <input
                id="shorts-upload-input"
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              />
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(255, 184, 0, 0.1)', marginBottom: '12px' }}>
                <Upload size={32} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                Drag & Drop your raw video recording here
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports 1080p / 4K recordings (.MOV, .MP4, .WEBM)
              </div>
              <div style={{ marginTop: '14px', display: 'inline-block' }}>
                <span className="btn btn--primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  Browse Local File
                </span>
              </div>
            </div>
          )}

          {/* Transcribing Progress Banner */}
          {isTranscribing && (
            <div style={{ marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={20} color="#10b981" className="animate-spin" />
              <div>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>Generating Millisecond-Accurate Word Timestamps</div>
                <div style={{ fontSize: '12px', color: '#10b981' }}>{transcribeProgress}</div>
              </div>
            </div>
          )}
        </div>

        {/* Customization Controls Panel */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--accent-cyan)" />
              <span>Subtitle & Canvas Customization</span>
            </div>

            {/* 1. Kinetic Highlight Color */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Active Word Highlight Glow
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((colorKey) => {
                  const conf = HIGHLIGHT_COLORS[colorKey];
                  const isSelected = highlightColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      onClick={() => setHighlightColor(colorKey)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? `2px solid ${conf.hex}` : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(255,255,255,0.08)' : 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: conf.hex,
                          boxShadow: isSelected ? `0 0 10px ${conf.glow}` : 'none',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: isSelected ? '#fff' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 500 }}>
                        {conf.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Subtitle Pacing & Typography */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Word Burst Pacing
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'ONE_WORD', label: '⚡ 1 Word (Ultra)' },
                    { key: 'TWO_THREE', label: '🎯 2-3 Words' },
                    { key: 'SENTENCE', label: '📄 Full Line' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setWordPacing(p.key as WordPacing)}
                      className={`btn ${wordPacing === p.key ? 'btn--primary' : 'btn--outline'}`}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  9:16 Canvas Aspect Mode
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setLayoutMode('FIT_BLUR')}
                    className={`btn ${layoutMode === 'FIT_BLUR' ? 'btn--primary' : 'btn--outline'}`}
                    style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
                  >
                    ✨ Fit + Blur Fill
                  </button>
                  <button
                    onClick={() => setLayoutMode('COVER_CROP')}
                    className={`btn ${layoutMode === 'COVER_CROP' ? 'btn--primary' : 'btn--outline'}`}
                    style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
                  >
                    📱 Full Cover
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Sliders: Font Size & Vertical Position */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Font Size</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="42"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Vertical Position (Safe Zone)</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{verticalPosition}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={verticalPosition}
                  onChange={(e) => setVerticalPosition(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* 4. Toggles: Emojis, Uppercase, Shoppable Product */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={autoEmojis}
                  onChange={(e) => setAutoEmojis(e.target.checked)}
                />
                <span>Auto-Inject Emojis (⚡ 🚀 💰 🤖)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                />
                <span>ALL CAPS (High Impact)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={showShoppableDrawer}
                  onChange={(e) => setShowShoppableDrawer(e.target.checked)}
                />
                <span>Attach Shoppable Product Drawer</span>
              </label>
            </div>

            {/* 5. Shoppable Product Selector */}
            {showShoppableDrawer && (
              <div style={{ marginTop: '8px', padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={14} />
                  <span>Pinned Shoppable Product (1-Click Checkout)</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {products.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          minWidth: '220px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(255, 184, 0, 0.1)' : 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                            ${p.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive Transcript Editor & Word Timeline */}
        {words.length > 0 && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={16} color="var(--accent-emerald)" />
                <span>Interactive Word Timeline ({words.length} words extracted)</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click any word to seek playback</span>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '12px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              {words.map((wordObj) => {
                const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
                return (
                  <span
                    key={wordObj.id}
                    onClick={() => seekTo(wordObj.start)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: isActive ? 800 : 500,
                      background: isActive ? HIGHLIGHT_COLORS[highlightColor].hex : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#000' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      boxShadow: isActive ? `0 0 10px ${HIGHLIGHT_COLORS[highlightColor].glow}` : 'none',
                    }}
                  >
                    {wordObj.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Viral Social Copy & Hook Generator */}
        {words.length > 0 && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="var(--accent-amber)" />
              <span>Viral Social Copy (YouTube Shorts & TikTok)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Titles */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  High-CTR Video Titles:
                </div>
                {socialTitles.map((title, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      fontSize: '13px',
                      color: '#fff',
                    }}
                  >
                    <span>{title}</span>
                    <button
                      onClick={() => copyToClipboard(title, `title_${idx}`)}
                      className="btn btn--outline"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      {copiedKey === `title_${idx}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedKey === `title_${idx}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pinned Comment */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  High-Converting Pinned Comment:
                </div>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                >
                  <span>{pinnedComment}</span>
                  <button
                    onClick={() => copyToClipboard(pinnedComment, 'pinned')}
                    className="btn btn--outline"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    {copiedKey === 'pinned' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedKey === 'pinned' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Realistic 9:16 Smartphone Simulator Preview */}
      <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={16} color="var(--accent-amber)" />
            <span>Mobile 9:16 Live Preview</span>
          </div>
          {videoUrl && (
            <span className="badge badge--cyan" style={{ fontSize: '11px' }}>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
          )}
        </div>

        {/* The 9:16 Phone Canvas Frame */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '620px',
            background: '#000',
            borderRadius: '36px',
            border: '8px solid #1f2937',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Phone Speaker Notch */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: '#374151',
              borderRadius: '10px',
              zIndex: 100,
            }}
          />

          {videoUrl ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} onClick={togglePlay}>
              {/* Optional Blurred Backdrop for 16:9 Fit */}
              {layoutMode === 'FIT_BLUR' && (
                <video
                  src={videoUrl}
                  muted
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    width: 'calc(100% + 40px)',
                    height: 'calc(100% + 40px)',
                    objectFit: 'cover',
                    filter: 'blur(20px) brightness(0.4)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Main Video Surface */}
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  objectFit: layoutMode === 'COVER_CROP' ? 'cover' : 'contain',
                  cursor: 'pointer',
                }}
              />

              {/* Play / Pause Center Overlay Indicator when paused */}
              {!isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.35)',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Play size={28} color="#fff" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              )}

              {/* Live Animated Bouncing Subtitle Overlay */}
              {activeChunk && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${verticalPosition}%`,
                    left: '12px',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 40,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {activeChunk.words.map((w) => {
                    const isWordActive = currentTime >= w.start - 0.05 && currentTime <= w.end + 0.05;
                    const text = getWordDisplay(w);

                    return (
                      <span
                        key={w.id}
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: `${fontSize}px`,
                          fontWeight: 900,
                          lineHeight: 1.1,
                          letterSpacing: '-0.5px',
                          color: isWordActive ? HIGHLIGHT_COLORS[highlightColor].hex : '#ffffff',
                          textShadow: isWordActive
                            ? `0 0 20px ${HIGHLIGHT_COLORS[highlightColor].glow}, 0 4px 12px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000`
                            : '0 4px 10px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000',
                          transform: isWordActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                          transition: 'transform 0.08s ease-out, color 0.08s ease-out',
                          display: 'inline-block',
                        }}
                      >
                        {text}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Shoppable Lower-Third Drawer Preview */}
              {showShoppableDrawer && selectedProduct && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 184, 0, 0.4)',
                    padding: '10px 12px',
                    zIndex: 50,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedProduct.imageUrl && (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-amber)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Featured In Clip
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {selectedProduct.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                      ${selectedProduct.price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #FFB800, #F59E0B)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    1-Click Buy
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
              <Upload size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                No video loaded
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Drop a video on the left to see the live 9:16 animated subtitle preview.
              </div>
            </div>
          )}
        </div>

        {/* Video Scrubber & Playback Controls */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <button
                onClick={togglePlay}
                style={{
                  background: 'var(--accent-amber)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
              </button>

              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                style={{ flex: 1, cursor: 'pointer' }}
              />

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="btn btn--outline"
                style={{ padding: '6px' }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>

            {/* Export 1080x1920 MP4 Button */}
            <button
              onClick={handleExportShort}
              disabled={isExporting}
              className="btn btn--primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Download size={18} />
              <span>{isExporting ? `Rendering 1080x1920 MP4 (${exportProgress}%)...` : 'Render & Download 9:16 Short'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
