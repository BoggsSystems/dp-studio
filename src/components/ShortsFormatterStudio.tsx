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
  Edit3,
  RefreshCw,
  AlertCircle,
  FileAudio,
  QrCode,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
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
export type QrPlacement = 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'TOP_LEFT';
export type ThumbnailStyle = 'VIRAL_WHITE' | 'FLAME_ORANGE' | 'CYBER_LIME' | 'ELECTRIC_CYAN' | 'HOT_PINK';

const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; hex: string; glow: string }> = {
  amber: { label: 'Electric Amber', hex: '#FFB800', glow: 'rgba(255, 184, 0, 0.6)' },
  emerald: { label: 'Neon Emerald', hex: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  cyan: { label: 'Cyber Cyan', hex: '#00F2FE', glow: 'rgba(0, 242, 254, 0.6)' },
  pink: { label: 'Hot Pink', hex: '#FF007F', glow: 'rgba(255, 0, 127, 0.6)' },
  crimson: { label: 'Crimson Red', hex: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
  violet: { label: 'Neon Violet', hex: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
};

export const THUMBNAIL_STYLES: Record<ThumbnailStyle, { name: string; fontColor: string; strokeColor: string; glow: string }> = {
  VIRAL_WHITE: { name: 'Viral White (High CTR)', fontColor: '#FFFFFF', strokeColor: '#000000', glow: 'rgba(0,0,0,0.95)' },
  FLAME_ORANGE: { name: 'Flame Orange (Urgency)', fontColor: '#FF6B00', strokeColor: '#000000', glow: 'rgba(255,107,0,0.7)' },
  CYBER_LIME: { name: 'Cyber Lime (Visual Pop)', fontColor: '#00FF66', strokeColor: '#000000', glow: 'rgba(0,255,102,0.7)' },
  ELECTRIC_CYAN: { name: 'Electric Cyan', fontColor: '#00F2FE', strokeColor: '#000000', glow: 'rgba(0,242,254,0.7)' },
  HOT_PINK: { name: 'Hot Pink', fontColor: '#FF007F', strokeColor: '#000000', glow: 'rgba(255,0,127,0.7)' },
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

// Helper: Convert AudioBuffer to 16kHz mono WAV Blob for sub-second network transfer
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Client-side lightweight audio extractor
async function extractAudioFromVideo(file: File): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return file;

    const audioCtx = new AudioContextClass();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Downsample to 16kHz mono offline
    const targetSampleRate = 16000;
    const offlineCtx = new OfflineAudioContext(1, decodedBuffer.duration * targetSampleRate, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  } catch (err) {
    console.warn('Client audio decode failed, falling back to raw file:', err);
    return file;
  }
}

export default function ShortsFormatterStudio() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string>('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [editableTranscript, setEditableTranscript] = useState<string>('');
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);

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

  // QR Code Overlays for Multi-Device & Desktop Conversion
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [qrPlacement, setQrPlacement] = useState<QrPlacement>('TOP_RIGHT');
  const [qrCustomUrl, setQrCustomUrl] = useState<string>('https://opportunity-system.com');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // High-CTR Thumbnail Studio State
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [thumbnailTitle, setThumbnailTitle] = useState<string>("DON'T LEARN SYNTAX IN 2026");
  const [thumbnailStyle, setThumbnailStyle] = useState<ThumbnailStyle>('VIRAL_WHITE');
  const [thumbnailFontSize, setThumbnailFontSize] = useState<number>(54);
  const [thumbnailPosition, setThumbnailPosition] = useState<number>(45); // % from top
  const [thumbnailBadge, setThumbnailBadge] = useState<string>('⚡ MUST WATCH');
  const [thumbnailStrokeWidth, setThumbnailStrokeWidth] = useState<number>(14);
  const [thumbnailUppercase, setThumbnailUppercase] = useState<boolean>(true);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);

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

  // Generate QR code data URL dynamically
  useEffect(() => {
    const targetUrl = selectedProduct?.externalUrl || qrCustomUrl || 'https://opportunity-system.com';
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [selectedProduct, qrCustomUrl]);

  // Transcription trigger function
  const runTranscription = async (fileToProcess: File) => {
    setIsTranscribing(true);
    setTranscribeError(null);
    setTranscribeProgress('⚡ Extracting lightweight audio track for instant transcription...');

    try {
      // 1. Extract audio in browser to send 500KB instead of 100MB
      const audioBlob = await extractAudioFromVideo(fileToProcess);
      setTranscribeProgress('🚀 Transcribing with Groq Whisper Large v3 Turbo (~0.4s)...');

      // 2. Call transcription API
      const res = await api.transcribeVideo(audioBlob, 'short_audio.wav');

      if (res && res.words && res.words.length > 0) {
        const formattedWords: WordItem[] = res.words.map((w, idx) => ({
          id: `w_${idx}_${Date.now()}`,
          word: w.word.trim(),
          start: w.start,
          end: w.end,
        }));
        setWords(formattedWords);
        const fullText = formattedWords.map((w) => w.word).join(' ');
        setEditableTranscript(fullText);
      } else if (res && res.text) {
        const split = res.text.split(/\s+/).filter(Boolean);
        const estDuration = res.duration || duration || 30;
        const wordTime = estDuration / split.length;
        const formattedWords: WordItem[] = split.map((word, idx) => ({
          id: `w_${idx}_${Date.now()}`,
          word,
          start: idx * wordTime,
          end: (idx + 1) * wordTime,
        }));
        setWords(formattedWords);
        setEditableTranscript(res.text);
      } else {
        throw new Error('No words or text returned from Whisper API.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setTranscribeError(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
      setTranscribeProgress('');
    }
  };

  // Handle Video File Selection
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setIsPlaying(false);
    setCurrentTime(0);

    // Run transcription automatically
    await runTranscription(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Save changes from the Full Transcript Editor back into words array
  const handleSaveTranscriptEdits = () => {
    const splitWords = editableTranscript.split(/\s+/).filter(Boolean);
    if (splitWords.length === 0) return;

    if (words.length > 0 && splitWords.length === words.length) {
      // Direct 1-to-1 word replacement preserving exact timestamps
      const updated = words.map((w, idx) => ({
        ...w,
        word: splitWords[idx],
      }));
      setWords(updated);
    } else {
      // Re-interpolate timestamps across the video duration
      const totalDuration = duration || (words.length > 0 ? words[words.length - 1].end : 30);
      const wordDuration = totalDuration / splitWords.length;
      const updated: WordItem[] = splitWords.map((word, idx) => ({
        id: `w_${idx}_${Date.now()}`,
        word,
        start: idx * wordDuration,
        end: (idx + 1) * wordDuration,
      }));
      setWords(updated);
    }
    setIsEditingTranscript(false);
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
      setTimeout(() => {
        captureFrameAtCurrentTime();
      }, 300);
    }
  };

  // Frame Grabber from current video playback
  const captureFrameAtCurrentTime = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    if (layoutMode === 'FIT_BLUR') {
      ctx.save();
      ctx.filter = 'blur(30px) brightness(0.4)';
      ctx.drawImage(video, -200, -200, 1480, 2320);
      ctx.restore();

      const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
      const drawWidth = 1080;
      const drawHeight = 1080 / videoAspect;
      const drawY = (1920 - drawHeight) / 2;
      ctx.drawImage(video, 0, drawY, drawWidth, drawHeight);
    } else {
      ctx.drawImage(video, 0, 0, 1080, 1920);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setThumbnailImage(dataUrl);
  };

  // Dynamic AI Viral Hooks generated from transcript & product
  const viralHookSuggestions = useMemo(() => {
    const textLower = editableTranscript.toLowerCase();
    const list: string[] = [];

    if (textLower.includes('syntax') || textLower.includes('code') || textLower.includes('developer')) {
      list.push("DON'T LEARN SYNTAX IN 2026");
      list.push("WHY 90% OF DEVS ARE STUCK");
      list.push("THE NEW PHYSICS OF CODE");
      list.push("DID YOU DO YOUR 20 MINUTES?");
    } else if (textLower.includes('job') || textLower.includes('career') || textLower.includes('apply')) {
      list.push("50 AND BROKE? LEARN THIS");
      list.push("HOW TO 10X JOB INTERVIEWS");
      list.push("STOP APPLYING THE OLD WAY");
    } else {
      list.push("THE #1 MISTAKE TO AVOID");
      list.push("WHY EVERYTHING CHANGED");
      list.push("DID YOU DO YOUR 20 MINUTES?");
    }

    if (selectedProduct) {
      list.push(`${selectedProduct.title.toUpperCase().slice(0, 28)}`);
    }

    return list;
  }, [editableTranscript, selectedProduct]);

  // Download High-CTR Thumbnail (9:16 or 16:9)
  const downloadThumbnail = (aspect: '9:16' | '16:9') => {
    if (!thumbnailImage) {
      captureFrameAtCurrentTime();
    }
    const currentImgUrl = thumbnailImage;
    if (!currentImgUrl) return;

    const img = new Image();
    img.src = currentImgUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = aspect === '9:16' ? 1080 : 1920;
      const height = aspect === '9:16' ? 1920 : 1080;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (aspect === '9:16') {
        ctx.drawImage(img, 0, 0, 1080, 1920);
      } else {
        // Landscape center crop
        ctx.save();
        ctx.drawImage(img, 0, -420, 1920, 1920);
        ctx.restore();
      }

      // Top Badge
      if (thumbnailBadge) {
        ctx.save();
        const badgeY = aspect === '9:16' ? 100 : 60;
        ctx.font = '900 28px Inter, sans-serif';
        const badgeTextWidth = ctx.measureText(thumbnailBadge).width;
        const badgeWidth = badgeTextWidth + 48;
        const badgeX = (width - badgeWidth) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = THUMBNAIL_STYLES[thumbnailStyle].fontColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(badgeX, badgeY, badgeWidth, 54, 14);
        } else {
          ctx.rect(badgeX, badgeY, badgeWidth, 54);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(thumbnailBadge, width / 2, badgeY + 27);
        ctx.restore();
      }

      // Main Bold Viral Hook Text (Wrapped)
      const textToDraw = thumbnailUppercase ? thumbnailTitle.toUpperCase() : thumbnailTitle;
      const yCenter = height * (thumbnailPosition / 100);
      const conf = THUMBNAIL_STYLES[thumbnailStyle];

      ctx.save();
      const baseFontSize = thumbnailFontSize * (aspect === '9:16' ? 1.6 : 1.4);
      ctx.font = `900 ${baseFontSize}px Inter, Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = thumbnailStrokeWidth * 1.5;
      ctx.strokeStyle = conf.strokeColor;
      ctx.shadowColor = conf.glow;
      ctx.shadowBlur = 24;

      const wordsArr = textToDraw.split(' ');
      const lines: string[] = [];
      let currentLine = wordsArr[0] || '';

      for (let i = 1; i < wordsArr.length; i++) {
        const testLine = currentLine + ' ' + wordsArr[i];
        if (ctx.measureText(testLine).width < width * 0.86) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = wordsArr[i];
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = baseFontSize * 1.18;
      const startY = yCenter - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, idx) => {
        const lineY = startY + idx * lineHeight;
        ctx.strokeText(line, width / 2, lineY);
        ctx.fillStyle = conf.fontColor;
        ctx.fillText(line, width / 2, lineY);
      });
      ctx.restore();

      const link = document.createElement('a');
      link.download = `thumbnail_${aspect.replace(':', 'x')}_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };
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
  const socialTitles = useMemo(() => {
    if (!editableTranscript) return ['How to build AI systems ⚡', 'Bypassing 45-min portals in 10ms 🚀'];
    return [
      `How to bypass 45-minute ATS portals in 10 milliseconds ⚡`,
      `The AI Engineering Secret Nobody Tells You (Speedrun) 🔥`,
      `I automated my entire application pipeline with Opportunity OS 🚀`,
    ];
  }, [editableTranscript]);

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
      // Pre-load QR image for canvas drawing if enabled
      let qrImg: HTMLImageElement | null = null;
      if (showQrCode && qrDataUrl) {
        qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          if (qrImg!.complete) resolve(true);
          else {
            qrImg!.onload = () => resolve(true);
            qrImg!.onerror = () => resolve(false);
          }
        });
      }

      const stream = canvas.captureStream(30);
      let combinedStream = stream;

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

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1920);

        if (layoutMode === 'FIT_BLUR') {
          ctx.save();
          ctx.filter = 'blur(30px) brightness(0.4)';
          ctx.drawImage(video, -200, -200, 1480, 2320);
          ctx.restore();

          const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const drawWidth = 1080;
          const drawHeight = 1080 / videoAspect;
          const drawY = (1920 - drawHeight) / 2;
          ctx.drawImage(video, 0, drawY, drawWidth, drawHeight);
        } else {
          ctx.drawImage(video, 0, 0, 1080, 1920);
        }

        // Subtitle text rendering
        const currentT = video.currentTime;
        const currChunk = chunks.find((c) => currentT >= c.start - 0.05 && currentT <= c.end + 0.15);
        if (currChunk) {
          const yPos = 1920 * (verticalPosition / 100);
          ctx.font = `900 ${fontSize * 2.2}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

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

        // Render QR Code Badge if enabled
        if (showQrCode && qrImg && qrImg.complete) {
          const qrX = qrPlacement === 'TOP_RIGHT' ? 1080 - 220 - 40 : qrPlacement === 'TOP_LEFT' ? 40 : 1080 - 220 - 40;
          const qrY = qrPlacement === 'BOTTOM_RIGHT' ? 1920 - 380 : 70;
          const w = 220;
          const h = 270;
          const r = 24;

          ctx.save();
          // Card backdrop
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.strokeStyle = HIGHLIGHT_COLORS[highlightColor].hex;
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(qrX, qrY, w, h, r);
          } else {
            ctx.rect(qrX, qrY, w, h);
          }
          ctx.fill();
          ctx.stroke();

          // White QR background wrapper
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(qrX + 20, qrY + 20, 180, 180, 12);
          } else {
            ctx.rect(qrX + 20, qrY + 20, 180, 180);
          }
          ctx.fill();

          // QR Image
          ctx.drawImage(qrImg, qrX + 24, qrY + 24, 172, 172);

          // Text Label
          ctx.font = '900 20px Inter, sans-serif';
          ctx.fillStyle = HIGHLIGHT_COLORS[highlightColor].hex;
          ctx.textAlign = 'center';
          ctx.fillText('⚡ SCAN TO BUY', qrX + w / 2, qrY + 234);

          if (selectedProduct) {
            ctx.font = '700 16px Inter, sans-serif';
            ctx.fillStyle = '#10B981';
            ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, qrX + w / 2, qrY + 256);
          }
          ctx.restore();
        }

        // Render Shoppable Product Drawer
        if (showShoppableDrawer && selectedProduct) {
          const drawerY = 1920 - 200;
          const dx = 40;
          const dw = 1000;
          const dh = 140;
          const dr = 24;

          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(255, 184, 0, 0.6)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(dx, drawerY, dw, dh, dr);
          } else {
            ctx.rect(dx, drawerY, dw, dh);
          }
          ctx.fill();
          ctx.stroke();

          ctx.font = '800 20px Inter, sans-serif';
          ctx.fillStyle = '#FFB800';
          ctx.textAlign = 'left';
          ctx.fillText('⚡ FEATURED IN CLIP', dx + 30, drawerY + 45);

          ctx.font = '700 28px Inter, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          const maxTitleLen = 42;
          const titleText = selectedProduct.title.length > maxTitleLen ? selectedProduct.title.slice(0, maxTitleLen) + '...' : selectedProduct.title;
          ctx.fillText(titleText, dx + 30, drawerY + 90);

          ctx.font = '800 36px Inter, sans-serif';
          ctx.fillStyle = '#10B981';
          ctx.textAlign = 'right';
          ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, dx + dw - 40, drawerY + 80);
          ctx.restore();
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => videoFile && runTranscription(videoFile)}
                  disabled={isTranscribing}
                  className="btn btn--primary"
                  style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={isTranscribing ? 'animate-spin' : ''} />
                  <span>{isTranscribing ? 'Transcribing...' : '⚡ Generate Captions'}</span>
                </button>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setWords([]);
                    setEditableTranscript('');
                    setTranscribeError(null);
                  }}
                  className="btn btn--outline"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <RotateCcw size={14} /> New Video
                </button>
              </div>
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

          {/* Error Banner with Retry */}
          {transcribeError && (
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>{transcribeError}</span>
              </div>
              {videoFile && (
                <button
                  onClick={() => runTranscription(videoFile)}
                  className="btn btn--primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Retry Transcription
                </button>
              )}
            </div>
          )}
        </div>

        {/* Customization Controls Panel */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={16} color="var(--accent-cyan)" />
                <span>Subtitle & Canvas Customization</span>
              </div>
              {words.length === 0 && !isTranscribing && videoFile && (
                <button
                  onClick={() => runTranscription(videoFile)}
                  className="btn btn--primary"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={14} /> ⚡ Generate Captions Now
                </button>
              )}
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

            {/* 4. Toggles: Emojis, Uppercase, Shoppable Product, QR Code */}
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                />
                <span>Include Shoppable QR Badge (Desktop/TV Shoppers)</span>
              </label>
            </div>

            {/* 4b. QR Code Customization Bar */}
            {showQrCode && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={14} />
                    <span>Shoppable QR Badge (Multi-Device Conversion)</span>
                  </div>
                  {qrDataUrl && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Target: {selectedProduct ? selectedProduct.title : 'opportunity-system.com'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', alignItems: 'center' }}>
                  {qrDataUrl && (
                    <div style={{ background: '#fff', padding: '4px', borderRadius: '6px', width: 'fit-content', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      <img src={qrDataUrl} alt="QR Preview" style={{ width: '44px', height: '44px', display: 'block' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Overlay Position:</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { key: 'TOP_RIGHT', label: 'Top Right (Recommended)' },
                        { key: 'BOTTOM_RIGHT', label: 'Bottom Right' },
                        { key: 'TOP_LEFT', label: 'Top Left' },
                      ].map((pos) => (
                        <button
                          key={pos.key}
                          onClick={() => setQrPlacement(pos.key as QrPlacement)}
                          className={`btn ${qrPlacement === pos.key ? 'btn--primary' : 'btn--outline'}`}
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

        {/* 📝 Full Video Transcript & Editor */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} color="var(--accent-amber)" />
                <span>Full Video Transcript & Editor</span>
                {words.length > 0 && (
                  <span className="badge badge--cyan" style={{ fontSize: '11px' }}>
                    {words.length} words
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditingTranscript ? (
                  <>
                    <button
                      onClick={handleSaveTranscriptEdits}
                      className="btn btn--primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Save & Sync Captions
                    </button>
                    <button
                      onClick={() => {
                        setEditableTranscript(words.map((w) => w.word).join(' '));
                        setIsEditingTranscript(false);
                      }}
                      className="btn btn--outline"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingTranscript(true)}
                    className="btn btn--outline"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={12} /> Edit Text
                  </button>
                )}
              </div>
            </div>

            {/* Editable Text Box */}
            {isEditingTranscript ? (
              <textarea
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                placeholder="Edit transcript text here..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--accent-amber)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: editableTranscript ? '#fff' : 'var(--text-muted)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {editableTranscript || 'No transcript generated yet. Click "⚡ Generate Captions" above.'}
              </div>
            )}

            {/* Word Timeline */}
            {words.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Word Timing Inspector (Click word to jump playback):
                </div>
                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {words.map((wordObj) => {
                    const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end;
                    return (
                      <span
                        key={wordObj.id}
                        onClick={() => seekTo(wordObj.start)}
                        style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
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

        {/* 🖼️ High-CTR Thumbnail Studio & Frame Grabber */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--accent-amber)" />
                <span>High-CTR Thumbnail Studio (YouTube & TikTok Covers)</span>
              </div>
              <button
                onClick={captureFrameAtCurrentTime}
                className="btn btn--primary"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Camera size={14} /> 📸 Grab Current Frame ({Math.floor(currentTime)}s)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '20px', alignItems: 'start' }}>
              {/* Left Column: Title, Styles, AI Hooks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* AI Viral Hook Suggestions */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} color="var(--accent-amber)" />
                    <span>AI Viral Hook Suggestions (1-Click Apply):</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {viralHookSuggestions.map((hook, idx) => (
                      <button
                        key={idx}
                        onClick={() => setThumbnailTitle(hook)}
                        className="btn btn--outline"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: thumbnailTitle === hook ? 'rgba(255,184,0,0.15)' : 'transparent',
                          borderColor: thumbnailTitle === hook ? 'var(--accent-amber)' : 'var(--border-color)',
                          color: thumbnailTitle === hook ? '#fff' : 'var(--text-secondary)',
                          fontWeight: thumbnailTitle === hook ? 700 : 500,
                        }}
                      >
                        {hook}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Thumbnail Headline Text Input */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Thumbnail Hook Headline:
                  </div>
                  <input
                    type="text"
                    value={thumbnailTitle}
                    onChange={(e) => setThumbnailTitle(e.target.value)}
                    placeholder="Enter bold hook headline (e.g. DID YOU DO YOUR 20 MINUTES?)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--accent-amber)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Style Presets */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Typography & Color Style:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {(Object.keys(THUMBNAIL_STYLES) as ThumbnailStyle[]).map((stKey) => {
                      const st = THUMBNAIL_STYLES[stKey];
                      const isSelected = thumbnailStyle === stKey;
                      return (
                        <button
                          key={stKey}
                          onClick={() => setThumbnailStyle(stKey)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? `2px solid ${st.fontColor}` : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'var(--bg-surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: st.fontColor,
                              boxShadow: isSelected ? `0 0 8px ${st.glow}` : 'none',
                            }}
                          />
                          <span style={{ fontSize: '10px', color: isSelected ? '#fff' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 500 }}>
                            {st.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Top Badge & Sliders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Vertical Placement</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{thumbnailPosition}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="75"
                      value={thumbnailPosition}
                      onChange={(e) => setThumbnailPosition(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Font Size</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{thumbnailFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="36"
                      max="72"
                      value={thumbnailFontSize}
                      onChange={(e) => setThumbnailFontSize(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Optional Top Badge Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    Top Alert Badge:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['', '⚡ MUST WATCH', '🔥 2026 BLUEPRINT', '🚨 AI SHIFT', '🎯 1-CLICK'].map((badge) => (
                      <button
                        key={badge}
                        onClick={() => setThumbnailBadge(badge)}
                        className={`btn ${thumbnailBadge === badge ? 'btn--primary' : 'btn--outline'}`}
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                      >
                        {badge || 'None'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Thumbnail Preview & Download Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '180px',
                    height: '320px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid var(--accent-amber)',
                    background: '#000',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {thumbnailImage ? (
                    <img
                      src={thumbnailImage}
                      alt="Thumbnail Background Frame"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '10px' }}>
                      Click "Grab Current Frame"
                    </div>
                  )}

                  {/* Overlay Top Badge */}
                  {thumbnailBadge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        background: 'rgba(0,0,0,0.85)',
                        border: `1px solid ${THUMBNAIL_STYLES[thumbnailStyle].fontColor}`,
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        zIndex: 10,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {thumbnailBadge}
                    </div>
                  )}

                  {/* Overlay Bold Hook Text */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${thumbnailPosition}%`,
                      left: '8px',
                      right: '8px',
                      transform: 'translateY(-50%)',
                      textAlign: 'center',
                      fontFamily: 'Inter, Impact, sans-serif',
                      fontSize: `${Math.round(thumbnailFontSize * 0.28)}px`,
                      fontWeight: 900,
                      lineHeight: 1.15,
                      color: THUMBNAIL_STYLES[thumbnailStyle].fontColor,
                      textShadow: `0 0 10px ${THUMBNAIL_STYLES[thumbnailStyle].glow}, 0 2px 8px rgba(0,0,0,0.9), 1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px -1.5px 0 #000`,
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    {thumbnailUppercase ? thumbnailTitle.toUpperCase() : thumbnailTitle}
                  </div>
                </div>

                {/* Download Actions */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => downloadThumbnail('9:16')}
                    className="btn btn--primary"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> ⬇️ 9:16 (1080x1920)
                  </button>
                  <button
                    onClick={() => downloadThumbnail('16:9')}
                    className="btn btn--outline"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={12} /> ⬇️ 16:9 Card
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

              {/* QR Code Overlay Badge for Multi-Device & Desktop Conversion */}
              {showQrCode && qrDataUrl && (
                <div
                  style={{
                    position: 'absolute',
                    ...(qrPlacement === 'TOP_RIGHT'
                      ? { top: '24px', right: '14px' }
                      : qrPlacement === 'TOP_LEFT'
                      ? { top: '24px', left: '14px' }
                      : { bottom: showShoppableDrawer && selectedProduct ? '88px' : '20px', right: '14px' }),
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    padding: '6px 8px',
                    borderRadius: '12px',
                    border: `1.5px solid ${HIGHLIGHT_COLORS[highlightColor].hex}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    zIndex: 48,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 12px rgba(255,184,0,0.2)',
                    pointerEvents: 'none',
                    animation: 'fadeIn 0.3s ease-in-out',
                  }}
                >
                  <div style={{ background: '#fff', padding: '3px', borderRadius: '6px', display: 'flex' }}>
                    <img
                      src={qrDataUrl}
                      alt="Scan to Buy"
                      style={{ width: '56px', height: '56px', display: 'block', borderRadius: '3px' }}
                    />
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: 900, color: HIGHLIGHT_COLORS[highlightColor].hex, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    ⚡ Scan to Buy
                  </span>
                  {selectedProduct && (
                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#10b981' }}>
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  )}
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
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}
            >
              <Download size={18} />
              <span>{isExporting ? `Rendering 1080x1920 MP4 (${exportProgress}%)...` : 'Render & Download 9:16 Short'}</span>
            </button>

            {/* Quick Actions Row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={captureFrameAtCurrentTime}
                className="btn btn--outline"
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                title="Freeze current video frame into the Thumbnail Studio"
              >
                <Camera size={13} color="var(--accent-amber)" /> 📸 Grab Frame for Thumbnail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
