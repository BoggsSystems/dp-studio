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
  Share2,
  Code,
  Globe,
  Send,
  CheckCircle2,
  Radio,
  Layers,
  ExternalLink,
  LogOut,
  Wand2,
  Eye,
  Maximize2,
  Palette,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { saveDraftVideoBlob, getDraftVideoBlob, clearDraftVideoBlob, saveShortProject, createCloudShortProject } from '../services/videoStorage';
import { toast } from '../services/toast';
import { Product, FormattedShortProject } from '../types';

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

export type HighlightColor = 'amber' | 'emerald' | 'cyan' | 'pink' | 'orange' | 'violet';
export type LayoutMode = 'FIT_BLUR' | 'COVER_CROP';
export type WordPacing = 'ONE_WORD' | 'TWO_THREE' | 'SENTENCE';
export type QrPlacement = 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'TOP_LEFT';
export type ThumbnailStyle = 'VIRAL_WHITE' | 'FLAME_ORANGE' | 'CYBER_LIME' | 'ELECTRIC_CYAN' | 'HOT_PINK';

const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; hex: string; glow: string }> = {
  amber: { label: 'Electric Amber', hex: '#FFB800', glow: 'rgba(255, 184, 0, 0.6)' },
  emerald: { label: 'Neon Emerald', hex: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  cyan: { label: 'Cyber Cyan', hex: '#00F2FE', glow: 'rgba(0, 242, 254, 0.6)' },
  pink: { label: 'Hot Pink', hex: '#FF007F', glow: 'rgba(255, 0, 127, 0.6)' },
  orange: { label: 'Sunset Orange', hex: '#F97316', glow: 'rgba(249, 115, 22, 0.6)' },
  violet: { label: 'Neon Violet', hex: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
};

const getHighlightColorConfig = (colorKey: string) => {
  return HIGHLIGHT_COLORS[colorKey as HighlightColor] || HIGHLIGHT_COLORS.amber;
};

export const THUMBNAIL_STYLES: Record<ThumbnailStyle, { name: string; fontColor: string; strokeColor: string; glow: string }> = {
  VIRAL_WHITE: { name: 'Viral White (High CTR)', fontColor: '#FFFFFF', strokeColor: '#000000', glow: 'rgba(0,0,0,0.95)' },
  FLAME_ORANGE: { name: 'Flame Orange (Urgency)', fontColor: '#FF6B00', strokeColor: '#000000', glow: 'rgba(255,107,0,0.7)' },
  CYBER_LIME: { name: 'Cyber Lime (Visual Pop)', fontColor: '#00FF66', strokeColor: '#000000', glow: 'rgba(0,255,102,0.7)' },
  ELECTRIC_CYAN: { name: 'Electric Cyan', fontColor: '#00F2FE', strokeColor: '#000000', glow: 'rgba(0,242,254,0.7)' },
  HOT_PINK: { name: 'Hot Pink', fontColor: '#FF007F', strokeColor: '#000000', glow: 'rgba(255,0,127,0.7)' },
};

export type AiCoverStyle = 'CYBERPUNK' | 'CINEMATIC' | 'TECH_3D' | 'MANGA' | 'MINIMAL_DARK';

export interface AiCoverPreset {
  id: AiCoverStyle;
  label: string;
  description: string;
  gradientBg: [string, string, string];
  accentColor: string;
  badge: string;
}

export const AI_COVER_PRESETS: Record<AiCoverStyle, AiCoverPreset> = {
  CYBERPUNK: {
    id: 'CYBERPUNK',
    label: 'Cyberpunk Neon',
    description: 'Matrix code rain, glowing cyan wireframe & holographic HUD aperture',
    gradientBg: ['#030712', '#051923', '#003554'],
    accentColor: '#00F2FE',
    badge: '⚡ CYBER MATRIX',
  },
  CINEMATIC: {
    id: 'CINEMATIC',
    label: 'Cinematic Studio',
    description: 'Moody 35mm bokeh, warm gold rim lighting & volumetric particles',
    gradientBg: ['#0a080d', '#1f130b', '#2e1908'],
    accentColor: '#FFB800',
    badge: '🎬 35MM BOKEH',
  },
  TECH_3D: {
    id: 'TECH_3D',
    label: '3D Isometric Tech',
    description: 'Futuristic floating glass cubes, neon nodes & deep violet geometry',
    gradientBg: ['#090514', '#170c2e', '#321055'],
    accentColor: '#A855F7',
    badge: '🔮 BLENDER 3D',
  },
  MANGA: {
    id: 'MANGA',
    label: 'Manga Speed Action',
    description: 'High-velocity action speedlines, dark monochrome & crimson burst',
    gradientBg: ['#050505', '#1a0508', '#2b070d'],
    accentColor: '#EF4444',
    badge: '💥 ACTION BURST',
  },
  MINIMAL_DARK: {
    id: 'MINIMAL_DARK',
    label: 'Minimal Dark Luxe',
    description: 'Deep obsidian luxury gradient, frosted card frame & high contrast',
    gradientBg: ['#030712', '#0f172a', '#1e293b'],
    accentColor: '#38BDF8',
    badge: '✨ PRO STUDIO',
  },
};

// Generates an ultra-high resolution 1080x1920 procedural / AI cover background
export function generateProceduralAiCoverCanvas(
  prompt: string,
  style: AiCoverStyle,
  variationIndex: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const preset = AI_COVER_PRESETS[style] || AI_COVER_PRESETS.CYBERPUNK;
  const seed = (variationIndex + 1) * 9973 + (style.charCodeAt(0) || 0) * 31;
  const pseudoRand = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  // 1. Base Rich Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, preset.gradientBg[0]);
  grad.addColorStop(0.5, preset.gradientBg[1]);
  grad.addColorStop(1, preset.gradientBg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Style-Specific Generative Art Layers
  if (style === 'CYBERPUNK') {
    // 3D Perspective Floor Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
    ctx.lineWidth = 2;
    const horizonY = 1150;
    for (let x = -400; x <= 1480; x += 110) {
      ctx.beginPath();
      ctx.moveTo(540, horizonY);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = horizonY + 20; y <= 1920; y += 35 + (y - horizonY) * 0.16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
    ctx.restore();

    // Streaming Matrix Code Columns
    ctx.save();
    ctx.font = '700 22px monospace';
    const matrixTokens = ['01', '10', 'AI_CORE', '0xFF', 'SYS', '>>', '{velocity}', '<async>', '01101', 'NODE', '77%', 'QUANTUM'];
    for (let i = 0; i < 22; i++) {
      const colX = 35 + i * 46;
      const startY = 80 + pseudoRand(i * 3) * 600;
      const count = 4 + Math.floor(pseudoRand(i * 5) * 8);
      for (let j = 0; j < count; j++) {
        const token = matrixTokens[(i + j + variationIndex) % matrixTokens.length];
        const alpha = Math.max(0.12, 0.85 - j * 0.1);
        ctx.fillStyle = j === 0 ? '#FFFFFF' : i % 2 === 0 ? `rgba(0, 242, 254, ${alpha})` : `rgba(16, 185, 129, ${alpha})`;
        ctx.fillText(token, colX, startY + j * 30);
      }
    }
    ctx.restore();

    // Central Glowing Hologram Ring & HUD Reticle
    ctx.save();
    const ringY = 680 + (variationIndex % 2) * 100;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.65)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00F2FE';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(540, ringY, 270, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 0, 127, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(540, ringY, 340, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(540, ringY, 340, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(540 - 45, ringY); ctx.lineTo(540 + 45, ringY);
    ctx.moveTo(540, ringY - 45); ctx.lineTo(540, ringY + 45);
    ctx.stroke();
    ctx.restore();

  } else if (style === 'CINEMATIC') {
    // Dual Color Studio Rim Lighting
    ctx.save();
    const goldGlow = ctx.createRadialGradient(220, 380, 60, 220, 380, 850);
    goldGlow.addColorStop(0, 'rgba(255, 184, 0, 0.45)');
    goldGlow.addColorStop(0.5, 'rgba(255, 107, 0, 0.15)');
    goldGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = goldGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    const tealGlow = ctx.createRadialGradient(860, 1420, 60, 860, 1420, 750);
    tealGlow.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
    tealGlow.addColorStop(0.6, 'rgba(0, 53, 84, 0.1)');
    tealGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = tealGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 35mm Optical Anamorphic Streak
    const streakY = 820 + variationIndex * 60;
    const streakGrad = ctx.createLinearGradient(0, streakY, 1080, streakY);
    streakGrad.addColorStop(0, 'transparent');
    streakGrad.addColorStop(0.2, 'rgba(0, 242, 254, 0.2)');
    streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    streakGrad.addColorStop(0.8, 'rgba(255, 184, 0, 0.25)');
    streakGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, streakY - 10, 1080, 20);

    // Bokeh Orbs
    for (let b = 0; b < 50; b++) {
      const bx = pseudoRand(b * 7) * 1080;
      const by = pseudoRand(b * 11) * 1920;
      const radius = 12 + pseudoRand(b * 13) * 70;
      const alpha = 0.08 + pseudoRand(b * 17) * 0.26;
      const bGlow = ctx.createRadialGradient(bx, by, radius * 0.2, bx, by, radius);
      bGlow.addColorStop(0, b % 2 === 0 ? `rgba(255, 184, 0, ${alpha})` : `rgba(0, 242, 254, ${alpha})`);
      bGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

  } else if (style === 'TECH_3D') {
    // 3D Isometric Floating Tech Solids
    ctx.save();
    const centerX = 540;
    const centerY = 780 + (variationIndex % 2) * 80;

    // Glowing Radial Orb Core
    const coreGlow = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 550);
    coreGlow.addColorStop(0, 'rgba(168, 85, 247, 0.65)');
    coreGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    const drawIsometricCube = (cx: number, cy: number, size: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 24;

      const vertices: [number, number][] = [];
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a + Math.PI / 6;
        vertices.push([size * Math.cos(angle), size * Math.sin(angle)]);
      }
      ctx.beginPath();
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      for (let v = 1; v < 6; v++) ctx.lineTo(vertices[v][0], vertices[v][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 16, 85, 0.45)';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(vertices[0][0], vertices[0][1]);
      ctx.moveTo(0, 0); ctx.lineTo(vertices[2][0], vertices[2][1]);
      ctx.moveTo(0, 0); ctx.lineTo(vertices[4][0], vertices[4][1]);
      ctx.stroke();
      ctx.restore();
    };

    drawIsometricCube(centerX, centerY, 190 + variationIndex * 20, 0.12);
    drawIsometricCube(centerX - 280, centerY - 270, 95, -0.22);
    drawIsometricCube(centerX + 290, centerY + 250, 115, 0.35);
    drawIsometricCube(centerX - 240, centerY + 370, 80, 0.16);
    drawIsometricCube(centerX + 260, centerY - 330, 90, -0.42);

    // Laser connection trails
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 280, centerY - 270); ctx.lineTo(centerX, centerY);
    ctx.moveTo(centerX + 290, centerY + 250); ctx.lineTo(centerX, centerY);
    ctx.moveTo(centerX - 240, centerY + 370); ctx.lineTo(centerX, centerY);
    ctx.moveTo(centerX + 260, centerY - 330); ctx.lineTo(centerX, centerY);
    ctx.stroke();
    ctx.restore();

  } else if (style === 'MANGA') {
    // Dynamic Manga Radial Action Speedlines
    ctx.save();
    const focalX = 540;
    const focalY = 840 + (variationIndex % 2) * 90;
    const lineCount = 75;

    for (let l = 0; l < lineCount; l++) {
      const angle = (Math.PI * 2 * l) / lineCount + (pseudoRand(l) - 0.5) * 0.05;
      const innerDist = 260 + pseudoRand(l * 3) * 140;
      const outerDist = 1450;

      const x1 = focalX + Math.cos(angle) * innerDist;
      const y1 = focalY + Math.sin(angle) * innerDist;
      const x2 = focalX + Math.cos(angle) * outerDist;
      const y2 = focalY + Math.sin(angle) * outerDist;

      const width = 2 + pseudoRand(l * 5) * 8;
      ctx.strokeStyle = l % 3 === 0 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Crimson Energy Burst
    const redGlow = ctx.createRadialGradient(focalX, focalY, 30, focalX, focalY, 420);
    redGlow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    redGlow.addColorStop(0.6, 'rgba(185, 28, 28, 0.18)');
    redGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = redGlow;
    ctx.beginPath();
    ctx.arc(focalX, focalY, 420, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (style === 'MINIMAL_DARK') {
    // Frosted Card Border Frame with High Contrast
    ctx.save();
    const frameInset = 80;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(frameInset, frameInset, 1080 - frameInset * 2, 1920 - frameInset * 2);

    const bracketLen = 65;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 6;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(frameInset - 10, frameInset + bracketLen);
    ctx.lineTo(frameInset - 10, frameInset - 10);
    ctx.lineTo(frameInset + bracketLen, frameInset - 10);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(1080 - frameInset + 10 - bracketLen, frameInset - 10);
    ctx.lineTo(1080 - frameInset + 10, frameInset - 10);
    ctx.lineTo(1080 - frameInset + 10, frameInset + bracketLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(frameInset - 10, 1920 - frameInset - bracketLen);
    ctx.lineTo(frameInset - 10, 1920 - frameInset + 10);
    ctx.lineTo(frameInset + bracketLen, 1920 - frameInset + 10);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(1080 - frameInset + 10 - bracketLen, 1920 - frameInset + 10);
    ctx.lineTo(1080 - frameInset + 10, 1920 - frameInset + 10);
    ctx.lineTo(1080 - frameInset + 10, 1920 - frameInset - bracketLen);
    ctx.stroke();

    const spot = ctx.createRadialGradient(540, 780, 20, 540, 780, 650);
    spot.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.restore();
  }

  // 3. Technical Metadata Footers & Watermark
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIGITPOP AI STUDIO • 1080x1920 ULTRA-HD • HIGH CTR THUMBNAIL', 540, 1860);

  const promptKeywords = prompt
    ? prompt.split(' ').filter(w => w.length > 4).slice(0, 3).map(w => w.toUpperCase()).join(' • ')
    : 'AI ARCHITECTURE • 2026 VELOCITY • MUST WATCH';

  ctx.fillStyle = preset.accentColor;
  ctx.font = '800 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(promptKeywords, 540, 1820);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
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

  // AI Title & Description Studio State
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [pinnedCommentText, setPinnedCommentText] = useState<string>('');
  const [isAiGeneratingMeta, setIsAiGeneratingMeta] = useState<boolean>(false);

  // High-CTR Thumbnail Studio State
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [thumbnailTitle, setThumbnailTitle] = useState<string>('');
  const [thumbnailStyle, setThumbnailStyle] = useState<ThumbnailStyle>('VIRAL_WHITE');
  const [thumbnailFontSize, setThumbnailFontSize] = useState<number>(54);
  const [thumbnailPosition, setThumbnailPosition] = useState<number>(45); // % from top
  const [thumbnailBadge, setThumbnailBadge] = useState<string>('⚡ MUST WATCH');
  const [thumbnailStrokeWidth, setThumbnailStrokeWidth] = useState<number>(14);
  const [thumbnailUppercase, setThumbnailUppercase] = useState<boolean>(true);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);

  // AI Context-Aware Cover / Thumbnail Generator State
  const [aiCoverPrompt, setAiCoverPrompt] = useState<string>(
    'Futuristic developer terminal with glowing holographic AI neural network HUD and code architecture diagrams'
  );
  const [aiCoverStyle, setAiCoverStyle] = useState<AiCoverStyle>('CYBERPUNK');
  const [isGeneratingAiCovers, setIsGeneratingAiCovers] = useState<boolean>(false);
  const [aiCoverCandidates, setAiCoverCandidates] = useState<string[]>([]);
  const [isAiCoverPanelExpanded, setIsAiCoverPanelExpanded] = useState<boolean>(false);

  // Real-Scale (1080x1920) Lightbox Inspector State
  const [isRealSizeModalOpen, setIsRealSizeModalOpen] = useState<boolean>(false);
  const [realSizeModalUrl, setRealSizeModalUrl] = useState<string | null>(null);
  const [realSizeZoom100, setRealSizeZoom100] = useState<boolean>(false);
  const [isInspectingRealSize, setIsInspectingRealSize] = useState<boolean>(false);

  // Multi-Channel Distribution & Embed Generator State
  const [activeDistTab, setActiveDistTab] = useState<'EMBED_WEB' | 'SOCIAL_CHANNELS'>('EMBED_WEB');
  const [embedMode, setEmbedMode] = useState<'FLOATING_BUBBLE' | 'INLINE_CARD' | 'REACT_NATIVE'>('FLOATING_BUBBLE');
  const [embedAutoplay, setEmbedAutoplay] = useState<boolean>(true);
  const [embedTheme, setEmbedTheme] = useState<'dark' | 'glass'>('dark');
  const [embedPosition, setEmbedPosition] = useState<'BOTTOM_RIGHT' | 'BOTTOM_LEFT'>('BOTTOM_RIGHT');
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'TWITTER' | 'ABOUT_PAGE'>('YOUTUBE');

  // Opportunity OS About Page Showcase State
  const [isPublishingAboutPage, setIsPublishingAboutPage] = useState<boolean>(false);
  const [publishAboutPageStage, setPublishAboutPageStage] = useState<'IDLE' | 'RENDERING' | 'INITIALIZING' | 'UPLOADING' | 'SAVING' | 'DONE'>('IDLE');
  const [publishAboutPagePercent, setPublishAboutPagePercent] = useState<number>(0);
  const [publishAboutPageLoadedMb, setPublishAboutPageLoadedMb] = useState<string>('0.0');
  const [publishAboutPageTotalMb, setPublishAboutPageTotalMb] = useState<string>('0.0');
  const [publishedAboutPageUrl, setPublishedAboutPageUrl] = useState<string | null>(null);
  const [publishAboutPageError, setPublishAboutPageError] = useState<string | null>(null);

  // YouTube OAuth & Publishing State
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [isPublishingYouTube, setIsPublishingYouTube] = useState<boolean>(false);
  const [publishYouTubeStage, setPublishYouTubeStage] = useState<'IDLE' | 'RENDERING' | 'INITIALIZING' | 'UPLOADING' | 'SETTING_THUMBNAIL' | 'DONE'>('IDLE');
  const [publishYouTubePercent, setPublishYouTubePercent] = useState<number>(0);
  const [publishYouTubeLoadedMb, setPublishYouTubeLoadedMb] = useState<string>('0');
  const [publishYouTubeTotalMb, setPublishYouTubeTotalMb] = useState<string>('0');
  const [publishedYouTubeUrl, setPublishedYouTubeUrl] = useState<string | null>(null);
  const [publishYouTubeError, setPublishYouTubeError] = useState<string | null>(null);
  const [youtubeConnectSuccessMsg, setYoutubeConnectSuccessMsg] = useState<string | null>(null);

  // TikTok OAuth & Publishing State
  const [isPublishingTikTok, setIsPublishingTikTok] = useState<boolean>(false);
  const [publishTikTokStage, setPublishTikTokStage] = useState<'IDLE' | 'RENDERING' | 'INITIALIZING' | 'UPLOADING' | 'DONE'>('IDLE');
  const [publishTikTokPercent, setPublishTikTokPercent] = useState<number>(0);
  const [publishTikTokLoadedMb, setPublishTikTokLoadedMb] = useState<string>('0');
  const [publishTikTokTotalMb, setPublishTikTokTotalMb] = useState<string>('0');
  const [publishedTikTokUrl, setPublishedTikTokUrl] = useState<string | null>(null);
  const [publishTikTokError, setPublishTikTokError] = useState<string | null>(null);
  const [tiktokConnectSuccessMsg, setTiktokConnectSuccessMsg] = useState<string | null>(null);

  // Instagram OAuth & Publishing State
  const [isPublishingInstagram, setIsPublishingInstagram] = useState<boolean>(false);
  const [publishInstagramStage, setPublishInstagramStage] = useState<'IDLE' | 'RENDERING' | 'INITIALIZING' | 'UPLOADING' | 'DONE'>('IDLE');
  const [publishInstagramPercent, setPublishInstagramPercent] = useState<number>(0);
  const [publishedInstagramUrl, setPublishedInstagramUrl] = useState<string | null>(null);
  const [publishInstagramError, setPublishInstagramError] = useState<string | null>(null);
  const [instagramConnectSuccessMsg, setInstagramConnectSuccessMsg] = useState<string | null>(null);

  // X / Twitter OAuth & Publishing State
  const [isPublishingTwitter, setIsPublishingTwitter] = useState<boolean>(false);
  const [publishTwitterStage, setPublishTwitterStage] = useState<'IDLE' | 'RENDERING' | 'INITIALIZING' | 'UPLOADING' | 'DONE'>('IDLE');
  const [publishTwitterPercent, setPublishTwitterPercent] = useState<number>(0);
  const [publishedTwitterUrl, setPublishedTwitterUrl] = useState<string | null>(null);
  const [publishTwitterError, setPublishTwitterError] = useState<string | null>(null);
  const [twitterConnectSuccessMsg, setTwitterConnectSuccessMsg] = useState<string | null>(null);

  // Social copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Persistence and Auto-Recovery State
  const [shortProjectId, setShortProjectId] = useState<string>(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`));
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // 1. Restore local metadata & IndexedDB video blob on mount
  useEffect(() => {
    let isCancelled = false;

    const restoreDraft = async () => {
      try {
        const savedDraftJson = localStorage.getItem('digitpop_shorts_formatter_draft_v1');
        let hasRestoredData = false;

        let draftWordsFound = false;
        if (savedDraftJson) {
          const draft = JSON.parse(savedDraftJson);
          if (draft.id) setShortProjectId(draft.id);
          if (draft.publishedYouTubeUrl) setPublishedYouTubeUrl(draft.publishedYouTubeUrl);
          if (draft.words && draft.words.length > 0) {
            setWords(draft.words);
            hasRestoredData = true;
            draftWordsFound = true;
          }
          if (draft.editableTranscript) {
            setEditableTranscript(draft.editableTranscript);
            hasRestoredData = true;
          }
          if (draft.highlightColor) {
            const validKeys: HighlightColor[] = ['amber', 'emerald', 'cyan', 'pink', 'orange', 'violet'];
            if (validKeys.includes(draft.highlightColor)) {
              setHighlightColor(draft.highlightColor);
            } else {
              setHighlightColor('amber');
            }
          }
          if (draft.fontSize !== undefined) setFontSize(draft.fontSize);
          if (draft.verticalPosition !== undefined) setVerticalPosition(draft.verticalPosition);
          if (draft.wordPacing) setWordPacing(draft.wordPacing);
          if (draft.autoEmojis !== undefined) setAutoEmojis(draft.autoEmojis);
          if (draft.uppercase !== undefined) setUppercase(draft.uppercase);
          if (draft.layoutMode) setLayoutMode(draft.layoutMode);
          if (draft.showShoppableDrawer !== undefined) setShowShoppableDrawer(draft.showShoppableDrawer);
          if (draft.showQrCode !== undefined) setShowQrCode(draft.showQrCode);
          if (draft.qrPlacement) setQrPlacement(draft.qrPlacement);
          if (draft.qrCustomUrl) setQrCustomUrl(draft.qrCustomUrl);
          if (draft.selectedProductId) setSavedProductId(draft.selectedProductId);
          if (draft.videoTitle) setVideoTitle(draft.videoTitle);
          if (draft.videoDescription) setVideoDescription(draft.videoDescription);
          if (draft.pinnedCommentText) setPinnedCommentText(draft.pinnedCommentText);
          if (draft.thumbnailTitle) setThumbnailTitle(draft.thumbnailTitle);
          if (draft.thumbnailStyle) setThumbnailStyle(draft.thumbnailStyle);
          if (draft.thumbnailFontSize) setThumbnailFontSize(draft.thumbnailFontSize);
          if (draft.thumbnailPosition) setThumbnailPosition(draft.thumbnailPosition);
          if (draft.thumbnailBadge !== undefined) setThumbnailBadge(draft.thumbnailBadge);
          if (draft.thumbnailStrokeWidth) setThumbnailStrokeWidth(draft.thumbnailStrokeWidth);
          if (draft.thumbnailUppercase !== undefined) setThumbnailUppercase(draft.thumbnailUppercase);
          if (draft.thumbnailImage) setThumbnailImage(draft.thumbnailImage);
        }

        // Restore video from IndexedDB or cloud draft
        const storedVideo = await getDraftVideoBlob();
        if (storedVideo && storedVideo.blob && !isCancelled) {
          const file = new File([storedVideo.blob], storedVideo.name || 'short_video.mp4', {
            type: storedVideo.blob.type || 'video/mp4',
          });
          setVideoFile(file);
          const objUrl = URL.createObjectURL(file);
          setVideoUrl(objUrl);
          hasRestoredData = true;

          // If this is a fresh launch from wizard with no transcript words yet, auto-run transcription
          if (!draftWordsFound) {
            runTranscription(file);
          }
        }

        if (hasRestoredData && !isCancelled) {
          setIsDraftRestored(true);
        }
      } catch (err) {
        console.warn('Draft restoration error:', err);
      } finally {
        if (!isCancelled) {
          isMountedRef.current = true;
        }
      }
    };

    restoreDraft();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Auto-save draft whenever configuration or transcript changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    const timer = setTimeout(() => {
      try {
        const draftData = {
          id: shortProjectId,
          words,
          editableTranscript,
          videoTitle,
          videoDescription,
          pinnedCommentText,
          highlightColor,
          fontSize,
          verticalPosition,
          wordPacing,
          autoEmojis,
          uppercase,
          layoutMode,
          showShoppableDrawer,
          showQrCode,
          qrPlacement,
          qrCustomUrl,
          selectedProductId: selectedProduct?.id || savedProductId || null,
          productTitle: selectedProduct?.title,
          productPrice: selectedProduct?.price,
          thumbnailTitle,
          thumbnailStyle,
          thumbnailFontSize,
          thumbnailPosition,
          thumbnailBadge,
          thumbnailStrokeWidth,
          thumbnailUppercase,
          thumbnailImage,
          publishedYouTubeUrl,
          status: publishedYouTubeUrl ? 'PUBLISHED' : 'DRAFT',
          updatedAt: Date.now(),
        };
        localStorage.setItem('digitpop_shorts_formatter_draft_v1', JSON.stringify(draftData));

        // Auto-sync into multi-project shorts library
        if (words.length > 0 || editableTranscript || thumbnailTitle || videoTitle || videoUrl) {
          const shortProjectRecord: FormattedShortProject = {
            id: shortProjectId,
            title: videoTitle || thumbnailTitle || (videoFile?.name ? videoFile.name.replace(/\.[^/.]+$/, '') : 'AI Shoppable Short'),
            videoFileName: videoFile?.name || 'short_video.mp4',
            thumbnailUrl: thumbnailImage || undefined,
            durationSeconds: duration || (words.length ? Math.ceil(words[words.length - 1].end) : 30),
            words,
            editableTranscript,
            videoTitle,
            videoDescription,
            pinnedCommentText,
            highlightColor,
            fontSize,
            verticalPosition,
            wordPacing,
            autoEmojis,
            uppercase,
            layoutMode,
            showShoppableDrawer,
            showQrCode,
            qrPlacement,
            qrCustomUrl,
            productId: selectedProduct?.id || savedProductId || undefined,
            productTitle: selectedProduct?.title,
            productPrice: selectedProduct?.price,
            thumbnailTitle,
            thumbnailStyle,
            thumbnailFontSize,
            thumbnailPosition,
            thumbnailBadge,
            thumbnailStrokeWidth,
            thumbnailUppercase,
            publishedYouTubeUrl: publishedYouTubeUrl || undefined,
            status: publishedYouTubeUrl ? 'PUBLISHED' : 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveShortProject(shortProjectRecord);
        }
      } catch (e) {
        console.warn('Draft auto-save warning:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    words,
    editableTranscript,
    videoTitle,
    videoDescription,
    pinnedCommentText,
    highlightColor,
    fontSize,
    verticalPosition,
    wordPacing,
    autoEmojis,
    uppercase,
    layoutMode,
    showShoppableDrawer,
    showQrCode,
    qrPlacement,
    qrCustomUrl,
    selectedProduct,
    savedProductId,
    thumbnailTitle,
    thumbnailStyle,
    thumbnailFontSize,
    thumbnailPosition,
    thumbnailBadge,
    thumbnailStrokeWidth,
    thumbnailUppercase,
    thumbnailImage,
  ]);

  // Load catalog products and connected social accounts
  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data);
    });

    api.getSocialAccounts().then((accounts) => {
      setSocialAccounts(accounts);
    });

    // Check for OAuth redirect query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      const channel = params.get('channel') || 'YouTube Channel';
      setYoutubeConnectSuccessMsg(`🎉 Successfully connected YouTube Channel: ${channel}`);
      api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('youtube_error')) {
      setPublishYouTubeError(`YouTube Connection Error: ${params.get('youtube_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('tiktok_connected') === 'true') {
      const channel = params.get('channel') || 'TikTok Creator';
      setTiktokConnectSuccessMsg(`🎉 Successfully connected TikTok Account: @${channel}`);
      api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('tiktok_error')) {
      setPublishTikTokError(`TikTok Connection Error: ${params.get('tiktok_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('instagram_connected') === 'true') {
      const channel = params.get('channel') || 'Instagram Account';
      setInstagramConnectSuccessMsg(`🎉 Successfully connected Instagram: @${channel}`);
      api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('instagram_error')) {
      setPublishInstagramError(`Instagram Connection Error: ${params.get('instagram_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('twitter_connected') === 'true') {
      const channel = params.get('channel') || 'X Account';
      setTwitterConnectSuccessMsg(`🎉 Successfully connected X (Twitter): @${channel}`);
      api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('twitter_error')) {
      setPublishTwitterError(`X Connection Error: ${params.get('twitter_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for popup window OAuth messages
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_CONNECTED') {
        const channel = event.data.channel || 'YouTube Channel';
        setYoutubeConnectSuccessMsg(`🎉 Successfully connected YouTube Channel: @${channel}`);
        setPublishYouTubeError(null);
        api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      } else if (event.data?.type === 'YOUTUBE_ERROR') {
        setPublishYouTubeError(`YouTube Connection Error: ${event.data.error}`);
      } else if (event.data?.type === 'TIKTOK_CONNECTED') {
        const channel = event.data.channel || 'TikTok Creator';
        setTiktokConnectSuccessMsg(`🎉 Successfully connected TikTok Account: @${channel}`);
        setPublishTikTokError(null);
        api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      } else if (event.data?.type === 'TIKTOK_ERROR') {
        setPublishTikTokError(`TikTok Connection Error: ${event.data.error}`);
      } else if (event.data?.type === 'INSTAGRAM_CONNECTED') {
        const channel = event.data.channel || 'Instagram Account';
        setInstagramConnectSuccessMsg(`🎉 Successfully connected Instagram: @${channel}`);
        setPublishInstagramError(null);
        api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      } else if (event.data?.type === 'INSTAGRAM_ERROR') {
        setPublishInstagramError(`Instagram Connection Error: ${event.data.error}`);
      } else if (event.data?.type === 'TWITTER_CONNECTED') {
        const channel = event.data.channel || 'X Account';
        setTwitterConnectSuccessMsg(`🎉 Successfully connected X (Twitter): @${channel}`);
        setPublishTwitterError(null);
        api.getSocialAccounts().then((accounts) => setSocialAccounts(accounts));
      } else if (event.data?.type === 'TWITTER_ERROR') {
        setPublishTwitterError(`X Connection Error: ${event.data.error}`);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  // Synchronize selectedProduct whenever products list or savedProductId updates
  useEffect(() => {
    if (!products || products.length === 0) return;
    if (savedProductId) {
      const found = products.find((p) => p.id === savedProductId);
      if (found) {
        setSelectedProduct(found);
        return;
      }
    }
    setSelectedProduct((prev) => {
      if (prev && products.some((p) => p.id === prev.id)) return prev;
      return products[0];
    });
  }, [products, savedProductId]);

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
        generateAiMetadata(fullText);
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
        generateAiMetadata(res.text);
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

  // Generate AI Title, Rich Description, and Pinned Comment from transcript & selected product
  const generateAiMetadata = (textInput?: string, productOverride?: Product | null) => {
    setIsAiGeneratingMeta(true);
    try {
      const text = textInput || editableTranscript || words.map((w) => w.word).join(' ');
      
      // Auto-match best product from catalog if no manual product override is set
      let matchedProduct = productOverride !== undefined ? productOverride : selectedProduct;
      if (!productOverride && products && products.length > 0 && text) {
        const textLower = text.toLowerCase();
        let bestScore = -1;
        let bestCandidate: Product | null = null;

        for (const p of products) {
          let score = 0;
          const titleWords = (p.title || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
          const descWords = (p.description || '').toLowerCase().split(/\s+/).filter((w) => w.length > 3);

          for (const tw of titleWords) {
            if (textLower.includes(tw)) score += 3;
          }
          for (const dw of descWords) {
            if (textLower.includes(dw)) score += 1;
          }

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = p;
          }
        }

        if (bestCandidate && bestScore > 0) {
          matchedProduct = bestCandidate;
          setSelectedProduct(bestCandidate);
          setSavedProductId(bestCandidate.id);
          if (bestCandidate.externalUrl) {
            setQrCustomUrl(bestCandidate.externalUrl);
          }
        }
      }

      const product = matchedProduct || selectedProduct;
      const productUrl = product?.externalUrl || 'https://opportunity-system.com/about';

      const productSnippet = product
        ? `\n⚡ Featured Product: ${product.title} ($${product.price.toFixed(2)})\n👉 Buy / Details: ${productUrl}`
        : `\n👉 Explore Blueprint & Platform: ${productUrl}`;

      const pinnedSnippet = product
        ? `👉 Grab the ${product.title} here: ${productUrl} (Link in Bio ⚡)`
        : `👉 Explore Opportunity OS and free tools here: ${productUrl} (Link in Bio ⚡)`;

      if (!text || text.trim().length === 0) {
        const fileFallback = videoFile?.name ? videoFile.name.replace(/\.[^/.]+$/, '').toUpperCase() : 'AI SHOPPABLE SHORT';
        setVideoTitle(fileFallback);
        setThumbnailTitle(fileFallback);
        setVideoDescription(
          `🚀 Grab the blueprint & software tools: ${productUrl}${productSnippet}\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS`
        );
        setPinnedCommentText(pinnedSnippet);
        return;
      }

      const cleanText = text.replace(/\s+/g, ' ').trim();
      const sentences = cleanText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 4);
      
      let hook = '';
      if (sentences.length > 0) {
        const first = sentences[0];
        if (first.length <= 60) {
          hook = first.toUpperCase();
        } else {
          // If the first spoken thought is long, cleanly grab the first 6-8 words up to 55 chars
          const words = first.split(/\s+/);
          let sliced = '';
          for (const w of words) {
            if ((sliced + ' ' + w).trim().length <= 55) {
              sliced = (sliced + ' ' + w).trim();
            } else {
              break;
            }
          }
          hook = (sliced || first.slice(0, 50)).toUpperCase();
        }
      } else {
        hook = cleanText.slice(0, 50).toUpperCase();
      }

      if (!hook) {
        hook = videoFile?.name ? videoFile.name.replace(/\.[^/.]+$/, '').toUpperCase() : 'AI SHOPPABLE SHORT';
      }

      const hookSnippet = cleanText.length > 240 ? cleanText.slice(0, 240) + '...' : cleanText;
      const desc = `${hookSnippet}\n\n${productSnippet}\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS`;

      setVideoTitle(hook);
      setThumbnailTitle(hook);
      setVideoDescription(desc);
      setPinnedCommentText(pinnedSnippet);
    } finally {
      setTimeout(() => setIsAiGeneratingMeta(false), 300);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSavedProductId(product.id);
    if (product.externalUrl) {
      setQrCustomUrl(product.externalUrl);
    }
    generateAiMetadata(undefined, product);
  };

  // Handle Video File Selection
  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Derive instant initial title from filename before transcription completes
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
    setVideoTitle(baseName);
    setThumbnailTitle(baseName);

    // Allocate canonical backend project UUID immediately
    const allocatedId = await createCloudShortProject(baseName);
    setShortProjectId(allocatedId);

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setIsPlaying(false);
    setCurrentTime(0);

    // Save video file to IndexedDB for persistent recovery across page reloads
    await saveDraftVideoBlob(file, file.name);

    // Run transcription automatically
    await runTranscription(file);
  };

  // Reset current short draft and clear persistent cache
  const handleResetDraft = async () => {
    try {
      await clearDraftVideoBlob();
      localStorage.removeItem('digitpop_shorts_formatter_draft_v1');
    } catch (e) {
      console.warn('Draft clear error:', e);
    }

    const newDraftId = await createCloudShortProject('Untitled Short Draft');
    setShortProjectId(newDraftId);
    setVideoFile(null);
    setVideoUrl(null);
    setWords([]);
    setEditableTranscript('');
    setTranscribeError(null);
    setIsDraftRestored(false);
    setThumbnailImage(null);
    setPublishedYouTubeUrl(null);
    setSavedProductId(null);
    setSelectedProduct(products.length > 0 ? products[0] : null);
  };

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Explicitly Save Short to Library
  const handleManualSaveShort = async () => {
    if (!videoUrl && !videoFile) return;
    const shortProject: FormattedShortProject = {
      id: shortProjectId,
      title: videoTitle || thumbnailTitle || (videoFile?.name ? videoFile.name.replace(/\.[^/.]+$/, '') : 'AI Shoppable Short'),
      videoFileName: videoFile?.name || 'short_video.mp4',
      thumbnailUrl: thumbnailImage || undefined,
      durationSeconds: duration || 30,
      words,
      editableTranscript,
      videoTitle,
      videoDescription,
      pinnedCommentText,
      highlightColor,
      fontSize,
      verticalPosition,
      wordPacing,
      autoEmojis,
      uppercase,
      layoutMode,
      showShoppableDrawer,
      showQrCode,
      qrPlacement,
      qrCustomUrl,
      productId: selectedProduct?.id || savedProductId || undefined,
      productTitle: selectedProduct?.title,
      productPrice: selectedProduct?.price,
      thumbnailTitle,
      thumbnailStyle,
      thumbnailFontSize,
      thumbnailPosition,
      thumbnailBadge,
      thumbnailStrokeWidth,
      thumbnailUppercase,
      publishedYouTubeUrl: publishedYouTubeUrl || undefined,
      status: publishedYouTubeUrl ? 'PUBLISHED' : 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveShortProject(shortProject, videoFile || undefined);
    setSaveSuccessMsg('💾 Saved to Shorts Library!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
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

  // Generated Web Embed Code Snippet for opportunity-system.com
  const generatedEmbedCode = useMemo(() => {
    if (embedMode === 'FLOATING_BUBBLE') {
      return `<!-- DigitPop Shoppable Shorts: Floating Video Bubble -->\n<script \n  src="https://digitpop.opportunity-system.com/player/v1/digitpop-shorts.js"\n  data-mode="bubble"\n  data-position="${embedPosition.toLowerCase().replace('_', '-')}"\n  data-theme="${embedTheme}"\n  data-product-id="${selectedProduct?.id || 'prod_opportunity_os'}"\n  data-title="${thumbnailTitle}"\n  async>\n</script>`;
    } else if (embedMode === 'INLINE_CARD') {
      return `<!-- DigitPop Shoppable Shorts: 9:16 Interactive Frame -->\n<div style="max-width: 380px; margin: 0 auto; aspect-ratio: 9/16; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">\n  <iframe \n    src="https://digitpop.opportunity-system.com/player/v1/embed?theme=${embedTheme}&product=${selectedProduct?.id || ''}&autoplay=${embedAutoplay ? 1 : 0}"\n    width="100%" \n    height="100%" \n    frameborder="0" \n    allow="autoplay; encrypted-media; fullscreen"\n    style="border: none; width: 100%; height: 100%;">\n  </iframe>\n</div>`;
    } else {
      return `import { DigitPopShorts } from '@digitpop/react-player';\n\nexport default function AboutPageVideo() {\n  return (\n    <DigitPopShorts\n      mode="bubble"\n      theme="${embedTheme}"\n      position="${embedPosition.toLowerCase().replace('_', '-')}"\n      productId="${selectedProduct?.id || 'prod_opportunity_os'}"\n      videoTitle="${thumbnailTitle}"\n      autoPlay={${embedAutoplay}}\n    />\n  );\n}`;
    }
  }, [embedMode, embedPosition, embedTheme, selectedProduct, thumbnailTitle, embedAutoplay]);

  // YouTube OAuth & Publishing Handlers
  const youtubeAccount = useMemo(() => {
    return socialAccounts.find((a) => a.platform === 'YOUTUBE_SHORTS') || null;
  }, [socialAccounts]);

  const handleConnectYouTube = () => {
    const authUrl = api.getYouTubeAuthUrl();
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'youtube_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    // If popup blocker intervened, fallback to full page redirect
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
      return;
    }

    // Polling fallback to check if user connected via popup
    const pollInterval = setInterval(async () => {
      try {
        const accounts = await api.getSocialAccounts();
        const yt = accounts.find((a) => a.platform === 'YOUTUBE_SHORTS');
        if (yt) {
          setSocialAccounts(accounts);
          const name = yt.accountName || (yt as any).account_name || 'Channel';
          setYoutubeConnectSuccessMsg(`🎉 Successfully connected YouTube Channel: @${name}`);
          setPublishYouTubeError(null);
          clearInterval(pollInterval);
        }
        if (popup.closed) {
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  const handleDisconnectYouTube = async () => {
    await api.disconnectSocialAccount('YOUTUBE_SHORTS');
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== 'YOUTUBE_SHORTS'));
  };

  // TikTok OAuth & Publishing Handlers
  const tiktokAccount = useMemo(() => {
    return socialAccounts.find((a) => a.platform === 'TIKTOK') || null;
  }, [socialAccounts]);

  const handleConnectTikTok = () => {
    const authUrl = api.getTikTokAuthUrl();
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'tiktok_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const accounts = await api.getSocialAccounts();
        const tt = accounts.find((a) => a.platform === 'TIKTOK');
        if (tt) {
          setSocialAccounts(accounts);
          const name = tt.accountName || (tt as any).account_name || 'Creator';
          setTiktokConnectSuccessMsg(`🎉 Successfully connected TikTok Account: @${name}`);
          setPublishTikTokError(null);
          clearInterval(pollInterval);
        }
        if (popup.closed) {
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  const handleDisconnectTikTok = async () => {
    await api.disconnectSocialAccount('TIKTOK');
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== 'TIKTOK'));
  };

  // Instagram OAuth & Handlers
  const instagramAccount = useMemo(() => {
    return socialAccounts.find((a) => a.platform === 'INSTAGRAM_REELS') || null;
  }, [socialAccounts]);

  const handleConnectInstagram = () => {
    const authUrl = api.getInstagramAuthUrl();
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'instagram_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const accounts = await api.getSocialAccounts();
        const ig = accounts.find((a) => a.platform === 'INSTAGRAM_REELS');
        if (ig) {
          setSocialAccounts(accounts);
          const name = ig.accountName || (ig as any).account_name || 'Instagram';
          setInstagramConnectSuccessMsg(`🎉 Successfully connected Instagram: @${name}`);
          setPublishInstagramError(null);
          clearInterval(pollInterval);
        }
        if (popup.closed) {
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  const handleDisconnectInstagram = async () => {
    await api.disconnectSocialAccount('INSTAGRAM_REELS');
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== 'INSTAGRAM_REELS'));
  };

  // X / Twitter OAuth & Handlers
  const twitterAccount = useMemo(() => {
    return socialAccounts.find((a) => a.platform === 'X_TWITTER') || null;
  }, [socialAccounts]);

  const handleConnectTwitter = () => {
    const authUrl = api.getTwitterAuthUrl();
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'twitter_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const accounts = await api.getSocialAccounts();
        const tw = accounts.find((a) => a.platform === 'X_TWITTER');
        if (tw) {
          setSocialAccounts(accounts);
          const name = tw.accountName || (tw as any).account_name || 'X Account';
          setTwitterConnectSuccessMsg(`🎉 Successfully connected X: @${name}`);
          setPublishTwitterError(null);
          clearInterval(pollInterval);
        }
        if (popup.closed) {
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  const handleDisconnectTwitter = async () => {
    await api.disconnectSocialAccount('X_TWITTER');
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== 'X_TWITTER'));
  };

  // Render High-CTR Thumbnail Blob (9:16 or 16:9)
  const renderThumbnailBlob = async (aspect: '9:16' | '16:9' = '9:16'): Promise<Blob | null> => {
    let currentImgUrl = thumbnailImage;
    if (!currentImgUrl && videoRef.current) {
      captureFrameAtCurrentTime();
      currentImgUrl = thumbnailImage;
    }

    const width = aspect === '9:16' ? 1080 : 1920;
    const height = aspect === '9:16' ? 1920 : 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (currentImgUrl) {
      const img = new Image();
      img.src = currentImgUrl;
      await new Promise((resolve) => {
        if (img.complete) resolve(true);
        else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        }
      });
      if (aspect === '9:16') {
        ctx.drawImage(img, 0, 0, 1080, 1920);
      } else {
        ctx.save();
        ctx.drawImage(img, 0, -420, 1920, 1920);
        ctx.restore();
      }
    } else if (videoRef.current) {
      const video = videoRef.current;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      if (aspect === '9:16') {
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
      } else {
        ctx.drawImage(video, 0, 0, 1920, 1080);
      }
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

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
    });
  };

  // Download High-CTR Thumbnail (9:16 or 16:9)
  const downloadThumbnail = async (aspect: '9:16' | '16:9') => {
    const blob = await renderThumbnailBlob(aspect);
    if (!blob) return;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `thumbnail_${aspect.replace(':', 'x')}_${Date.now()}.jpg`;
    link.href = downloadUrl;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  // Generate 4 candidate high-CTR AI covers based on prompt and style preset
  const handleGenerateAiCovers = async () => {
    setIsGeneratingAiCovers(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      const effectivePrompt = aiCoverPrompt.trim() || videoTitle || 'AI Software Velocity and Developer Blueprint';
      const candidates: string[] = [];
      for (let i = 0; i < 4; i++) {
        const dataUrl = generateProceduralAiCoverCanvas(effectivePrompt, aiCoverStyle, i);
        candidates.push(dataUrl);
      }
      setAiCoverCandidates(candidates);
      if (candidates.length > 0) {
        setThumbnailImage(candidates[0]);
      }
      toast.success(`✨ Generated 4 high-CTR AI covers in ${AI_COVER_PRESETS[aiCoverStyle].label} style!`);
    } catch (err) {
      toast.error('Failed to generate AI covers. Please try again.');
    } finally {
      setIsGeneratingAiCovers(false);
    }
  };

  // Open Full-Resolution (1080x1920) Lightbox Inspector
  const handleOpenRealSizeInspector = async () => {
    setIsInspectingRealSize(true);
    try {
      const blob = await renderThumbnailBlob('9:16');
      if (!blob) {
        toast.error('Unable to render thumbnail preview.');
        return;
      }
      if (realSizeModalUrl) {
        URL.revokeObjectURL(realSizeModalUrl);
      }
      const url = URL.createObjectURL(blob);
      setRealSizeModalUrl(url);
      setIsRealSizeModalOpen(true);
    } catch (err) {
      toast.error('Failed to open thumbnail inspector.');
    } finally {
      setIsInspectingRealSize(false);
    }
  };

  // Copy Real Size Thumbnail image to clipboard
  const handleCopyRealSizeImage = async () => {
    try {
      const blob = await renderThumbnailBlob('9:16');
      if (!blob) {
        toast.error('Failed to render image for clipboard.');
        return;
      }
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        toast.success('📋 Copied full-res 1080x1920 thumbnail to clipboard!');
      } else {
        toast.info('Clipboard write not supported on this browser. Use download button instead.');
      }
    } catch (err) {
      toast.error('Could not copy image directly. Use download button.');
    }
  };

  // Bakes 1080x1920 short with kinetic bouncing subtitles, layout framing (FIT_BLUR), and overlays
  const renderFormattedVideoBlob = async (
    onProgress?: (percent: number) => void
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      if (!videoRef.current || !videoUrl) {
        return reject(new Error('No video loaded to render'));
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        return reject(new Error('Could not initialize canvas 2D context'));
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Offscreen low-res blur canvas for silky-smooth 60fps GPU acceleration (0.1ms vs 60ms CPU cost)
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = 135;
      blurCanvas.height = 240;
      const blurCtx = blurCanvas.getContext('2d', { alpha: false });
      if (blurCtx) {
        blurCtx.imageSmoothingEnabled = true;
        blurCtx.imageSmoothingQuality = 'low';
      }

      // Pre-load QR image for canvas drawing if enabled
      let qrImg: HTMLImageElement | null = null;
      if (showQrCode && qrDataUrl) {
        qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          if (qrImg!.complete) res(true);
          else {
            qrImg!.onload = () => res(true);
            qrImg!.onerror = () => res(false);
          }
        });
      }

      const stream = canvas.captureStream(30);
      let audioStreamTracks: MediaStreamTrack[] = [];
      try {
        if (!audioContextRef.current) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioCtxClass();
          audioDestRef.current = audioContextRef.current.createMediaStreamDestination();
          audioSourceRef.current = audioContextRef.current.createMediaElementSource(video);
          audioSourceRef.current.connect(audioDestRef.current);
          // Audio is captured in high-fidelity for the video file without playing aloud on physical speakers
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        if (audioDestRef.current && audioDestRef.current.stream.getAudioTracks().length > 0) {
          audioStreamTracks = audioDestRef.current.stream.getAudioTracks();
        }
      } catch (e) {
        console.warn('AudioContext routing fallback:', e);
        if ((video as any).captureStream) {
          const vStream = (video as any).captureStream();
          audioStreamTracks = vStream.getAudioTracks();
        }
      }

      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioStreamTracks,
      ]);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else {
        mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6500000, // 6.5 Mbps crisp 1080x1920 HD (~45MB for 2m short)
        audioBitsPerSecond: 256000,  // 256 kbps studio audio
      });

      const chunksRecorded: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRecorded.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunksRecorded, {
          type: mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm',
        });
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (e) => {
        reject(new Error('MediaRecorder error: ' + (e as any).error?.message));
      };

      let isRenderingStopped = false;
      let heartbeatInterval: any = null;
      let rvfcCallbackId: number | null = null;
      let rAFId: number | null = null;

      const stopRecording = () => {
        if (isRenderingStopped) return;
        isRenderingStopped = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (rAFId) cancelAnimationFrame(rAFId);
        if (rvfcCallbackId !== null && (video as any).cancelVideoFrameCallback) {
          (video as any).cancelVideoFrameCallback(rvfcCallbackId);
        }
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('pause', handlePause);
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };

      const handleEnded = () => stopRecording();
      const handlePause = () => {
        if (video.currentTime >= (video.duration || 1) - 0.25) {
          stopRecording();
        }
      };

      video.addEventListener('ended', handleEnded);
      video.addEventListener('pause', handlePause);

      // Watchdog timer to ensure recording always completes even if tab loses focus
      heartbeatInterval = setInterval(() => {
        if (!video || isRenderingStopped) return;
        if (video.ended || (video.duration && video.currentTime >= video.duration - 0.25)) {
          stopRecording();
        }
      }, 400);

      // Start recording and playback from beginning
      video.currentTime = 0;
      await video.play();
      setIsPlaying(true);
      mediaRecorder.start(100);

      const renderFrame = () => {
        if (isRenderingStopped) return;

        if (video.ended || (video.duration && video.currentTime >= video.duration - 0.05)) {
          stopRecording();
          return;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1920);

        // 1. Layout Framing (FIT_BLUR or FULL_BLEED / COVER_CROP)
        if (layoutMode === 'FIT_BLUR' && blurCtx) {
          // Blazingly fast GPU-style offscreen blur
          blurCtx.filter = 'blur(6px) brightness(0.4)';
          blurCtx.drawImage(video, 0, 0, 135, 240);
          ctx.drawImage(blurCanvas, 0, 0, 1080, 1920);

          const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const drawWidth = 1080;
          const drawHeight = 1080 / videoAspect;
          const drawY = (1920 - drawHeight) / 2;
          ctx.drawImage(video, 0, drawY, drawWidth, drawHeight);
        } else {
          // Cover crop
          const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const targetAspect = 1080 / 1920;
          if (videoAspect > targetAspect) {
            const srcHeight = video.videoHeight || 1080;
            const srcWidth = srcHeight * targetAspect;
            const srcX = ((video.videoWidth || 1920) - srcWidth) / 2;
            ctx.drawImage(video, srcX, 0, srcWidth, srcHeight, 0, 0, 1080, 1920);
          } else {
            const srcWidth = video.videoWidth || 1080;
            const srcHeight = srcWidth / targetAspect;
            const srcY = ((video.videoHeight || 1920) - srcHeight) / 2;
            ctx.drawImage(video, 0, srcY, srcWidth, srcHeight, 0, 0, 1080, 1920);
          }
        }

        // 2. Word-by-Word Kinetic Subtitle Overlay
        const currentT = video.currentTime;
        const currChunk = chunks.find((c) => currentT >= c.start - 0.05 && currentT <= c.end + 0.15);
        if (currChunk) {
          const yPos = 1920 * (verticalPosition / 100);
          const baseFontPx = fontSize * 2.2;
          const wordsToDraw = currChunk.words;
          const activeIndex = wordsToDraw.findIndex(
            (w) => currentT >= w.start - 0.05 && currentT <= w.end + 0.05
          );

          ctx.textBaseline = 'middle';
          const gap = 16;

          const wordSpacings = wordsToDraw.map((w, idx) => {
            const wordText = getWordDisplay(w);
            const isActive = idx === activeIndex;
            ctx.font = `900 ${isActive ? baseFontPx * 1.15 : baseFontPx}px Inter, sans-serif`;
            return {
              word: wordText,
              width: ctx.measureText(wordText).width,
              isActive,
            };
          });

          const totalWidth = wordSpacings.reduce((sum, item) => sum + item.width, 0) + (wordSpacings.length - 1) * gap;
          let currentX = (1080 - totalWidth) / 2;

          wordSpacings.forEach((item) => {
            const fontPx = item.isActive ? baseFontPx * 1.15 : baseFontPx;
            ctx.font = `900 ${fontPx}px Inter, sans-serif`;
            ctx.textAlign = 'left';

            ctx.save();
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#000000';
            ctx.shadowColor = item.isActive ? getHighlightColorConfig(highlightColor).glow : 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = item.isActive ? 24 : 14;

            ctx.strokeText(item.word, currentX, yPos + (item.isActive ? -4 : 0));

            ctx.fillStyle = item.isActive ? getHighlightColorConfig(highlightColor).hex : '#FFFFFF';
            ctx.fillText(item.word, currentX, yPos + (item.isActive ? -4 : 0));
            ctx.restore();

            currentX += item.width + gap;
          });
        }

        // 3. QR Code Badge
        if (showQrCode && qrImg && qrImg.complete) {
          const qrX = qrPlacement === 'TOP_RIGHT' ? 1080 - 220 - 40 : qrPlacement === 'TOP_LEFT' ? 40 : 1080 - 220 - 40;
          const qrY = qrPlacement === 'BOTTOM_RIGHT' ? 1920 - 380 : 70;
          const w = 220;
          const h = 270;
          const r = 24;

          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.strokeStyle = getHighlightColorConfig(highlightColor).hex;
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(qrX, qrY, w, h, r);
          } else {
            ctx.rect(qrX, qrY, w, h);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(qrX + 20, qrY + 20, 180, 180, 12);
          } else {
            ctx.rect(qrX + 20, qrY + 20, 180, 180);
          }
          ctx.fill();

          ctx.drawImage(qrImg, qrX + 24, qrY + 24, 172, 172);

          ctx.font = '900 20px Inter, sans-serif';
          ctx.fillStyle = getHighlightColorConfig(highlightColor).hex;
          ctx.textAlign = 'center';
          ctx.fillText('⚡ SCAN TO BUY', qrX + w / 2, qrY + 234);

          if (selectedProduct) {
            ctx.font = '700 16px Inter, sans-serif';
            ctx.fillStyle = '#10B981';
            ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, qrX + w / 2, qrY + 256);
          }
          ctx.restore();
        }

        // 4. Shoppable Product Drawer
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
          const titleText =
            selectedProduct.title.length > maxTitleLen
              ? selectedProduct.title.slice(0, maxTitleLen) + '...'
              : selectedProduct.title;
          ctx.fillText(titleText, dx + 30, drawerY + 90);

          ctx.font = '800 36px Inter, sans-serif';
          ctx.fillStyle = '#10B981';
          ctx.textAlign = 'right';
          ctx.fillText(`$${selectedProduct.price.toFixed(2)}`, dx + dw - 40, drawerY + 80);
          ctx.restore();
        }

        if (onProgress) {
          const pct = Math.min(100, Math.round((video.currentTime / (video.duration || 1)) * 100));
          onProgress(pct);
        }
      };

      const loop = () => {
        if (isRenderingStopped) return;
        renderFrame();
        if ((video as any).requestVideoFrameCallback) {
          rvfcCallbackId = (video as any).requestVideoFrameCallback(loop);
        } else {
          rAFId = requestAnimationFrame(loop);
        }
      };

      // Heartbeat timer ensures frames are continuously rendered even if tab is unfocused / backgrounded
      heartbeatInterval = setInterval(() => {
        if (!isRenderingStopped && !video.paused && !video.ended) {
          renderFrame();
        }
      }, 33);

      loop();
    });
  };

  const handlePublishDirectToYouTube = async () => {
    if (!videoRef.current && !videoFile && !videoUrl) return;
    setIsPublishingYouTube(true);
    setPublishYouTubeStage('RENDERING');
    setPublishYouTubePercent(0);
    setPublishYouTubeLoadedMb('0');
    setPublishYouTubeTotalMb('0');
    setPublishYouTubeError(null);
    setPublishedYouTubeUrl(null);

    try {
      // 1. Bake video canvas with kinetic subtitles, layout framing, and overlays
      let videoBlobToUpload: Blob;
      if (videoRef.current && videoUrl) {
        setPublishYouTubeStage('RENDERING');
        videoBlobToUpload = await renderFormattedVideoBlob((renderPercent) => {
          // Baking phase is 0% to 40%
          setPublishYouTubePercent(Math.round(renderPercent * 0.4));
        });
      } else if (videoFile) {
        videoBlobToUpload = videoFile;
      } else {
        const response = await fetch(videoUrl!);
        videoBlobToUpload = await response.blob();
      }

      // 2. Prepare high-CTR thumbnail blob (9:16)
      setPublishYouTubeStage('INITIALIZING');
      setPublishYouTubePercent(45);
      let thumbnailBlob: Blob | undefined;
      try {
        const generatedThumb = await renderThumbnailBlob('9:16');
        if (generatedThumb) {
          thumbnailBlob = generatedThumb;
        } else if (thumbnailImage) {
          const thumbRes = await fetch(thumbnailImage);
          thumbnailBlob = await thumbRes.blob();
        }
      } catch (thumbErr) {
        console.warn('Thumbnail generation warning:', thumbErr);
      }

      const fullDesc = videoDescription || `${editableTranscript.slice(0, 300)}...\n\n👉 Grab the Blueprint & Opportunity OS: https://opportunity-system.com/about\n⚡ Featured Product: ${selectedProduct?.title || 'Opportunity OS'}\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS`;
      const fullTitle = videoTitle ? (videoTitle.toLowerCase().includes('#shorts') ? videoTitle : `${videoTitle} #Shorts`) : (thumbnailTitle ? `${thumbnailTitle} #Shorts` : 'AI-Native Short #Shorts');

      // 3. Stream direct to Google YouTube Resumable Cloud Session
      const result = await api.publishYouTubeShort(
        {
          videoBlob: videoBlobToUpload,
          thumbnailBlob,
          title: fullTitle,
          description: fullDesc,
          tags: ['Shorts', 'Coding', 'SoftwareEngineering', 'AI', 'OpportunityOS'],
          privacy: 'public',
        },
        (progress) => {
          if (progress.stage === 'INITIALIZING') {
            setPublishYouTubeStage('INITIALIZING');
            setPublishYouTubePercent(48);
          } else if (progress.stage === 'UPLOADING') {
            setPublishYouTubeStage('UPLOADING');
            // Upload phase scaled from 50% to 90%
            const uploadScaled = 50 + Math.round((progress.percent / 100) * 40);
            setPublishYouTubePercent(uploadScaled);
            if (progress.loadedBytes && progress.totalBytes) {
              setPublishYouTubeLoadedMb((progress.loadedBytes / (1024 * 1024)).toFixed(1));
              setPublishYouTubeTotalMb((progress.totalBytes / (1024 * 1024)).toFixed(1));
            }
          } else if (progress.stage === 'SETTING_THUMBNAIL') {
            setPublishYouTubeStage('SETTING_THUMBNAIL');
            setPublishYouTubePercent(95);
          }
        }
      );

      setPublishYouTubeStage('DONE');
      setPublishYouTubePercent(100);
      setPublishedYouTubeUrl(result.url);

      // Automatically sync published short to library
      try {
        let bakedThumbUrl: string | undefined = thumbnailImage || undefined;
        if (thumbnailBlob) {
          try {
            const reader = new FileReader();
            bakedThumbUrl = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(thumbnailBlob!);
            });
          } catch (e) {}
        }

        const shortRecord: FormattedShortProject = {
          id: shortProjectId,
          title: thumbnailTitle || (videoFile?.name ? videoFile.name.replace(/\.[^/.]+$/, '') : 'AI Shoppable Short'),
          videoFileName: videoFile?.name || 'short_video.mp4',
          thumbnailUrl: bakedThumbUrl || thumbnailImage || undefined,
          durationSeconds: duration || 30,
          words,
          editableTranscript,
          highlightColor,
          fontSize,
          verticalPosition,
          wordPacing,
          autoEmojis,
          uppercase,
          layoutMode,
          showShoppableDrawer,
          showQrCode,
          qrPlacement,
          qrCustomUrl,
          productId: selectedProduct?.id || savedProductId || undefined,
          productTitle: selectedProduct?.title,
          productPrice: selectedProduct?.price,
          thumbnailTitle,
          thumbnailStyle,
          thumbnailFontSize,
          thumbnailPosition,
          thumbnailBadge,
          thumbnailStrokeWidth,
          thumbnailUppercase,
          publishedYouTubeUrl: result.url,
          publishedAt: new Date().toISOString(),
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveShortProject(shortRecord, videoBlobToUpload);
      } catch (e) {}
    } catch (err: any) {
      console.error('Direct YouTube publish failed:', err);
      setPublishYouTubeError(err.message || 'Failed to publish to YouTube.');
    } finally {
      setIsPublishingYouTube(false);
    }
  };

  // TikTok Direct Post Publishing Handler
  const handlePublishToTikTok = async () => {
    if (!videoUrl && !videoFile) {
      setPublishTikTokError('No video loaded to publish.');
      return;
    }

    try {
      setIsPublishingTikTok(true);
      setPublishTikTokError(null);
      setPublishTikTokPercent(0);

      // 1. Bake video canvas with kinetic subtitles, layout framing, and overlays
      let videoBlobToUpload: Blob;
      if (videoRef.current && videoUrl) {
        setPublishTikTokStage('RENDERING');
        videoBlobToUpload = await renderFormattedVideoBlob((renderPercent) => {
          setPublishTikTokPercent(Math.round(renderPercent * 0.45));
        });
      } else if (videoFile) {
        videoBlobToUpload = videoFile;
      } else {
        const response = await fetch(videoUrl!);
        videoBlobToUpload = await response.blob();
      }

      // 2. Publish direct to TikTok Creator Account
      setPublishTikTokStage('INITIALIZING');
      setPublishTikTokPercent(50);

      const viralCaption = videoTitle
        ? `${videoTitle}\n\n${videoDescription || ''}`.slice(0, 2000).trim()
        : `${thumbnailTitle} 🔥 Watch till the end! #coding #ai #softwareengineer #tech #developer #opportunityos`;

      const result = await api.publishTikTokVideo(
        {
          videoBlob: videoBlobToUpload,
          title: viralCaption,
          privacy: 'PUBLIC_TO_EVERYONE',
        },
        (progress) => {
          if (progress.stage === 'INITIALIZING') {
            setPublishTikTokStage('INITIALIZING');
            setPublishTikTokPercent(55);
          } else if (progress.stage === 'UPLOADING') {
            setPublishTikTokStage('UPLOADING');
            const uploadScaled = 55 + Math.round((progress.percent / 100) * 40);
            setPublishTikTokPercent(uploadScaled);
            if (progress.loadedBytes && progress.totalBytes) {
              setPublishTikTokLoadedMb((progress.loadedBytes / (1024 * 1024)).toFixed(1));
              setPublishTikTokTotalMb((progress.totalBytes / (1024 * 1024)).toFixed(1));
            }
          }
        }
      );

      setPublishTikTokStage('DONE');
      setPublishTikTokPercent(100);
      setPublishedTikTokUrl(result.url || 'https://www.tiktok.com');
    } catch (err: any) {
      console.error('Direct TikTok publish failed:', err);
      setPublishTikTokError(err.message || 'Failed to publish to TikTok.');
    } finally {
      setIsPublishingTikTok(false);
    }
  };

  // Instagram Reels Publishing Handler
  const handlePublishToInstagram = async () => {
    if (!videoUrl && !videoFile) {
      setPublishInstagramError('No video loaded to publish.');
      return;
    }

    try {
      setIsPublishingInstagram(true);
      setPublishInstagramError(null);
      setPublishInstagramPercent(0);

      let videoBlobToUpload: Blob;
      if (videoRef.current && videoUrl) {
        setPublishInstagramStage('RENDERING');
        videoBlobToUpload = await renderFormattedVideoBlob((renderPercent) => {
          setPublishInstagramPercent(Math.round(renderPercent * 0.45));
        });
      } else if (videoFile) {
        videoBlobToUpload = videoFile;
      } else {
        const response = await fetch(videoUrl!);
        videoBlobToUpload = await response.blob();
      }

      setPublishInstagramStage('INITIALIZING');
      setPublishInstagramPercent(50);

      const igCaption = videoTitle
        ? `${videoTitle}\n\n${videoDescription || ''}`.slice(0, 2200).trim()
        : `${thumbnailTitle} 🚀 Link in bio for the interactive shoppable short! #reels #ai #coding #softwarevelocity #developer`;

      const result = await api.publishInstagramReel(
        {
          videoBlob: videoBlobToUpload,
          title: videoTitle || thumbnailTitle,
          caption: igCaption,
        },
        (progress) => {
          if (progress.stage === 'INITIALIZING') {
            setPublishInstagramStage('INITIALIZING');
            setPublishInstagramPercent(55);
          } else if (progress.stage === 'UPLOADING') {
            setPublishInstagramStage('UPLOADING');
            const uploadScaled = 55 + Math.round((progress.percent / 100) * 40);
            setPublishInstagramPercent(uploadScaled);
          }
        }
      );

      setPublishInstagramStage('DONE');
      setPublishInstagramPercent(100);
      setPublishedInstagramUrl(result.url || 'https://instagram.com/reels');
    } catch (err: any) {
      console.error('Direct Instagram publish failed:', err);
      setPublishInstagramError(err.message || 'Failed to publish to Instagram.');
    } finally {
      setIsPublishingInstagram(false);
    }
  };

  // X / Twitter Publishing Handler
  const handlePublishToTwitter = async () => {
    if (!videoUrl && !videoFile) {
      setPublishTwitterError('No video loaded to publish.');
      return;
    }

    try {
      setIsPublishingTwitter(true);
      setPublishTwitterError(null);
      setPublishTwitterPercent(0);

      let videoBlobToUpload: Blob;
      if (videoRef.current && videoUrl) {
        setPublishTwitterStage('RENDERING');
        videoBlobToUpload = await renderFormattedVideoBlob((renderPercent) => {
          setPublishTwitterPercent(Math.round(renderPercent * 0.45));
        });
      } else if (videoFile) {
        videoBlobToUpload = videoFile;
      } else {
        const response = await fetch(videoUrl!);
        videoBlobToUpload = await response.blob();
      }

      setPublishTwitterStage('INITIALIZING');
      setPublishTwitterPercent(50);

      const postText = videoTitle
        ? `${videoTitle}\n\n👉 Full interactive short & blueprint: https://opportunity-system.com/about ⚡\n\n#AI #Coding #Tech`
        : `${thumbnailTitle}\n\n👉 Full interactive short & blueprint: https://opportunity-system.com/about ⚡\n\n#AI #Coding #Tech`;

      const result = await api.publishTwitterPost(
        {
          videoBlob: videoBlobToUpload,
          text: postText,
        },
        (progress) => {
          if (progress.stage === 'INITIALIZING') {
            setPublishTwitterStage('INITIALIZING');
            setPublishTwitterPercent(55);
          } else if (progress.stage === 'UPLOADING') {
            setPublishTwitterStage('UPLOADING');
            const uploadScaled = 55 + Math.round((progress.percent / 100) * 40);
            setPublishTwitterPercent(uploadScaled);
          }
        }
      );

      setPublishTwitterStage('DONE');
      setPublishTwitterPercent(100);
      setPublishedTwitterUrl(result.url || 'https://x.com');
    } catch (err: any) {
      console.error('Direct X publish failed:', err);
      setPublishTwitterError(err.message || 'Failed to publish to X.');
    } finally {
      setIsPublishingTwitter(false);
    }
  };

  // Universal Cloud Media Catalog Showcase Handler
  const handlePublishToAboutPage = async () => {
    if (!videoUrl && !videoFile) {
      setPublishAboutPageError('No video loaded to publish.');
      return;
    }

    try {
      setIsPublishingAboutPage(true);
      setPublishAboutPageError(null);
      setPublishAboutPagePercent(5);
      setPublishAboutPageStage('RENDERING');

      const apiBase = (
        import.meta.env.VITE_API_URL ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:9000'
          : 'https://digitpop.opportunity-system.com')
      ).replace(/\/+$/, '');

      // 1. Stage 1: Prepare Original High-Definition Video Stream (Zero Transcoding Lag, Native 60fps)
      setPublishAboutPageStage('INITIALIZING');
      setPublishAboutPagePercent(20);

      let videoBlobToUpload: Blob;
      if (videoFile) {
        videoBlobToUpload = videoFile;
      } else {
        const stored = await getDraftVideoBlob();
        if (stored?.blob) {
          videoBlobToUpload = stored.blob;
        } else if (videoUrl) {
          videoBlobToUpload = await (await fetch(videoUrl)).blob();
        } else {
          throw new Error('No video file available to publish');
        }
      }

      // 2. Stage 2: Bake High-CTR 9:16 Graphical Cover Image
      let bakedThumbUrl: string | undefined = thumbnailImage || undefined;
      let thumbBlobToUpload: Blob | null = null;
      try {
        const generatedThumb = await renderThumbnailBlob('9:16');
        if (generatedThumb) {
          thumbBlobToUpload = generatedThumb;
          const reader = new FileReader();
          bakedThumbUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(generatedThumb);
          });
        }
      } catch (thumbErr) {
        console.warn('Thumbnail generation warning:', thumbErr);
      }

      // 3. Stage 3: Direct Edge Upload to Cloudflare R2 / CDN (Reuse existing cloud video URL if already uploaded)
      const isCloudVideoUrl = videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) && !videoUrl.startsWith('blob:');
      let videoUrlToPublish: string = isCloudVideoUrl ? videoUrl! : 'https://digitpop.opportunity-system.com/videos/opportunity-os-about.mp4';
      let thumbUrlToPublish: string = bakedThumbUrl || 'https://digitpop.opportunity-system.com/thumbnails/opportunity-os-about.jpg';

      // 3a. If video was not already uploaded to cloud during ingestion, upload now via resilient chunked pipeline
      if (!isCloudVideoUrl && videoBlobToUpload) {
        try {
          const fileToUpload = videoBlobToUpload instanceof File ? videoBlobToUpload : new File([videoBlobToUpload], `${shortProjectId}.mp4`, { type: 'video/mp4' });
          const uploadedVideo = await api.uploadMedia(fileToUpload, 'videos/shorts/opportunity-system', (prog) => {
            const pct = typeof prog === 'number' ? prog : prog.percent;
            const lMb = typeof prog === 'number' ? (fileToUpload.size * (pct / 100) / (1024 * 1024)).toFixed(1) : prog.loadedMb;
            const tMb = typeof prog === 'number' ? (fileToUpload.size / (1024 * 1024)).toFixed(1) : prog.totalMb;
            setPublishAboutPageLoadedMb(lMb);
            setPublishAboutPageTotalMb(tMb);
            const scaled = Math.min(90, 45 + Math.round((pct * 40) / 100));
            setPublishAboutPagePercent(scaled);
            setPublishAboutPageStage('UPLOADING');
          });
          if (uploadedVideo && uploadedVideo.url) {
            videoUrlToPublish = uploadedVideo.url;
            setVideoUrl(uploadedVideo.url);
          }
        } catch (uploadErr: any) {
          console.error('Video upload error during publish:', uploadErr);
          throw uploadErr;
        }
      } else {
        setPublishAboutPagePercent(85);
        setPublishAboutPageStage('SAVING');
      }

      // 3b. Upload Baked Thumbnail Blob (9:16 Cover Art, ~80KB)
      if (thumbBlobToUpload) {
        try {
          const thumbFile = new File([thumbBlobToUpload], `${shortProjectId}_thumb.jpg`, { type: 'image/jpeg' });
          const uploadedThumb = await api.uploadMedia(thumbFile, 'thumbnails/shorts/opportunity-system');
          if (uploadedThumb && uploadedThumb.url) {
            thumbUrlToPublish = uploadedThumb.url;
          }
        } catch (thumbUploadErr) {
          console.warn('Thumbnail upload notice, continuing with fallback:', thumbUploadErr);
        }
      }

      // 4. Save to local IndexedDB for instant offline recall
      const projectPayload: FormattedShortProject = {
        id: shortProjectId,
        title: videoTitle || thumbnailTitle || 'Opportunity OS Short',
        videoFileName: videoFile?.name || `${shortProjectId}.mp4`,
        thumbnailUrl: thumbUrlToPublish,
        durationSeconds: duration || 56,
        words,
        editableTranscript,
        highlightColor,
        fontSize,
        verticalPosition,
        wordPacing,
        autoEmojis,
        uppercase,
        layoutMode,
        showShoppableDrawer,
        showQrCode,
        qrPlacement,
        qrCustomUrl,
        productId: selectedProduct?.id || savedProductId || undefined,
        productTitle: selectedProduct?.title || 'AI-Native Software Engineering',
        productPrice: selectedProduct?.price || 9.99,
        thumbnailTitle: videoTitle || thumbnailTitle,
        thumbnailStyle,
        thumbnailFontSize,
        thumbnailPosition,
        thumbnailBadge,
        thumbnailStrokeWidth,
        thumbnailUppercase,
        publishedYouTubeUrl: publishedYouTubeUrl || undefined,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveShortProject(projectPayload, videoBlobToUpload);

      // 5. Register in Cloud Media Catalog
      setPublishAboutPageStage('SAVING');
      setPublishAboutPagePercent(92);
      try {
        if (!videoUrlToPublish || videoUrlToPublish.startsWith('blob:') || videoUrlToPublish.includes('/uploads/cdn/')) {
          videoUrlToPublish = `https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/videos/shorts/opportunity-system/${encodeURIComponent(shortProjectId)}.mp4`;
        }
        if (!thumbUrlToPublish || thumbUrlToPublish.startsWith('blob:') || thumbUrlToPublish.includes('/uploads/cdn/')) {
          thumbUrlToPublish = `https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/thumbnails/shorts/opportunity-system/${encodeURIComponent(shortProjectId)}.jpg`;
        }

        const resp = await fetch(`${apiBase}/api/publisher/shorts/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...projectPayload,
            videoUrl: videoUrlToPublish,
            thumbnailUrl: thumbUrlToPublish,
            creatorSlug: 'opportunity-system',
            destinationChannel: 'about',
          }),
        });
        if (resp.ok) {
          const publishedData = await resp.json().catch(() => null);
          if (publishedData && publishedData.id) {
            projectPayload.id = publishedData.id;
            await saveShortProject(projectPayload, videoBlobToUpload);
          }
        } else {
          console.warn('DigitPop Cloud publish API warning:', resp.status, await resp.text().catch(() => ''));
        }
      } catch (cloudErr) {
        console.warn('DigitPop Cloud upload warning:', cloudErr);
      }

      setPublishAboutPageStage('DONE');
      setPublishAboutPagePercent(100);
      setPublishedAboutPageUrl('https://opportunity-system.com/about');
      toast.success('Successfully baked and published to Cloud Media Catalog!');
    } catch (err: any) {
      console.error('Cloud Catalog publish failed:', err);
      setPublishAboutPageError(err.message || 'Failed to publish to Cloud Media Catalog.');
    } finally {
      setIsPublishingAboutPage(false);
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
    setExportProgress(5);

    try {
      const blob = await renderFormattedVideoBlob((pct) => {
        setExportProgress(pct);
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `digitpop_short_${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(false);
      setExportProgress(100);
      toast.success('9:16 Short rendered and downloaded successfully!', 'Export Complete');
    } catch (err: any) {
      console.error('Export recording failed:', err);
      setIsExporting(false);
      toast.error(err.message || 'Browser recording error', 'Video Export Failed');
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
                {isDraftRestored && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    <Check size={12} /> Auto-Saved
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Transform raw recordings into polished 9:16 Shorts with bouncing animated subtitles, viral hooks, and shoppable 1-click checkout.
              </div>
            </div>
            {videoFile && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {saveSuccessMsg && (
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                    {saveSuccessMsg}
                  </span>
                )}
                <button
                  onClick={handleManualSaveShort}
                  className="btn btn--outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#10B981',
                  }}
                  title="Save this formatted short into your library"
                >
                  <Check size={14} /> <span>Save Short</span>
                </button>
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
                  onClick={handleResetDraft}
                  className="btn btn--outline"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  title="Clear current video and start fresh"
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
                        onClick={() => handleSelectProduct(p)}
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
                          background: isActive ? getHighlightColorConfig(highlightColor).hex : 'rgba(255,255,255,0.06)',
                          color: isActive ? '#000' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.1s',
                          boxShadow: isActive ? `0 0 10px ${getHighlightColorConfig(highlightColor).glow}` : 'none',
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

        {/* ✨ AI Video Title & Description Studio */}
        {(videoUrl || words.length > 0) && (
          <div className="surface-panel" style={{ padding: '20px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>AI Video Title & Description Studio</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 600 }}>
                      Cross-Platform Meta
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Review, customize, and optimize your video title, description, and pinned comment before publishing.
                  </div>
                </div>
              </div>

              <button
                onClick={() => generateAiMetadata()}
                disabled={isAiGeneratingMeta}
                className="btn btn--outline"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  color: '#A5B4FC',
                  fontWeight: 600,
                }}
                title="Re-generate AI Title and Description based on transcript"
              >
                <RefreshCw size={13} className={isAiGeneratingMeta ? 'spin' : ''} />
                {isAiGeneratingMeta ? 'Analyzing...' : '⚡ Re-Generate with AI'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Video Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={13} color="var(--accent-amber)" />
                    Video Title & Hook
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: videoTitle.length > 100 ? '#EF4444' : videoTitle.length > 80 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                      {videoTitle.length}/100 chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(videoTitle, 'custom_title')}
                      className="btn btn--outline"
                      style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedKey === 'custom_title' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      {copiedKey === 'custom_title' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => {
                    setVideoTitle(e.target.value);
                    setThumbnailTitle(e.target.value);
                  }}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  placeholder="Enter high-CTR video title / hook..."
                />

                {/* AI Hook Suggestions Chips */}
                {socialTitles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                      AI Suggestions:
                    </span>
                    {socialTitles.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVideoTitle(t);
                          setThumbnailTitle(t);
                        }}
                        style={{
                          background: videoTitle === t ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: videoTitle === t ? '1px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: videoTitle === t ? '#C7D2FE' : 'var(--text-secondary)',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                        title="Click to apply this title"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Video Description & Social Caption */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={13} color="#60A5FA" />
                    Video Description & Social Caption
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: videoDescription.length > 5000 ? '#EF4444' : 'var(--text-muted)' }}>
                      {videoDescription.length}/5000 chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(videoDescription, 'custom_desc')}
                      className="btn btn--outline"
                      style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedKey === 'custom_desc' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      {copiedKey === 'custom_desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#fff',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  placeholder="Enter full video description, product links, and hashtags..."
                />

                {/* Quick Insert Snippet Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Insert:</span>
                  <button
                    onClick={() => {
                      const linkText = '\n👉 Grab the Blueprint & Opportunity OS: https://opportunity-system.com/about';
                      setVideoDescription((prev) => prev + linkText);
                    }}
                    className="btn btn--outline"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#60A5FA', borderColor: 'rgba(96, 165, 250, 0.3)' }}
                  >
                    + Bio Link
                  </button>
                  <button
                    onClick={() => {
                      const productText = `\n⚡ Featured Product: ${selectedProduct?.title || 'AI-Native Software Engineering'}`;
                      setVideoDescription((prev) => prev + productText);
                    }}
                    className="btn btn--outline"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                  >
                    + Product Info
                  </button>
                  <button
                    onClick={() => {
                      const tagsText = '\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS';
                      setVideoDescription((prev) => prev + tagsText);
                    }}
                    className="btn btn--outline"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#F472B6', borderColor: 'rgba(244, 114, 182, 0.3)' }}
                  >
                    + Viral #Tags
                  </button>
                </div>
              </div>

              {/* 3. High-Converting Pinned Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} color="#FFB800" />
                    High-Converting Pinned Comment
                  </label>
                  <button
                    onClick={() => copyToClipboard(pinnedCommentText, 'custom_pinned')}
                    className="btn btn--outline"
                    style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedKey === 'custom_pinned' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    {copiedKey === 'custom_pinned' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <input
                  type="text"
                  value={pinnedCommentText}
                  onChange={(e) => setPinnedCommentText(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#FFB800',
                    fontWeight: 500,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 184, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  placeholder="Enter pinned comment with high-converting call-to-action..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 🖼️ High-CTR Thumbnail Studio & AI Cover Generator */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--accent-amber)" />
                <span>High-CTR Thumbnail Studio</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={captureFrameAtCurrentTime}
                  className="btn btn--outline"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Camera size={14} color="var(--accent-amber)" /> 📸 Grab Current Frame ({Math.floor(currentTime)}s)
                </button>
                <button
                  onClick={() => setIsAiCoverPanelExpanded(!isAiCoverPanelExpanded)}
                  className={`btn ${isAiCoverPanelExpanded ? 'btn--primary' : 'btn--outline'}`}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'var(--accent-cyan)',
                    color: isAiCoverPanelExpanded ? '#000' : 'var(--accent-cyan)',
                    background: isAiCoverPanelExpanded ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.08)',
                  }}
                >
                  <Wand2 size={14} />
                  <span>{isAiCoverPanelExpanded ? 'Hide AI Cover Panel' : '✨ Generate AI Covers'}</span>
                  {isAiCoverPanelExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* 🤖 Expandable AI Visual Cover Generation Panel */}
            {isAiCoverPanelExpanded && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.07) 0%, rgba(15, 23, 42, 0.6) 100%)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                {/* Panel Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wand2 size={14} color="var(--accent-cyan)" />
                      <span>AI Visual Cover Generator (9:16)</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Step 1: Set prompt & choose style ➔ Step 2: Click Generate ➔ Step 3: Pick candidate variation
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        const promptFromVideo = `Futuristic developer workspace and code architecture blueprints for: ${videoTitle || '2026 Software Career Velocity'}`;
                        setAiCoverPrompt(promptFromVideo);
                        toast.info('Auto-synced prompt with video context!');
                      }}
                      className="btn btn--outline"
                      style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--accent-cyan)', borderColor: 'rgba(0,242,254,0.4)' }}
                    >
                      ⚡ Auto-Sync from Video
                    </button>
                    <button
                      onClick={() => setIsAiCoverPanelExpanded(false)}
                      className="btn btn--outline"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Collapse Panel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Step 1: Prompt Input */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    1. Visual Concept & Lighting Prompt:
                  </div>
                  <textarea
                    value={aiCoverPrompt}
                    onChange={(e) => setAiCoverPrompt(e.target.value)}
                    rows={2}
                    placeholder="Describe visual cover scene (e.g. Futuristic holographic terminal with glowing AI neural nodes...)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Step 2: Style Presets */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    2. Select Art Style Preset:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {(Object.keys(AI_COVER_PRESETS) as AiCoverStyle[]).map((stKey) => {
                      const preset = AI_COVER_PRESETS[stKey];
                      const isSelected = aiCoverStyle === stKey;
                      return (
                        <button
                          key={stKey}
                          onClick={() => setAiCoverStyle(stKey)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? `2px solid ${preset.accentColor}` : '1px solid rgba(255,255,255,0.12)',
                            background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title={preset.description}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: preset.accentColor,
                              boxShadow: isSelected ? `0 0 10px ${preset.accentColor}` : 'none',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: isSelected ? '#fff' : 'var(--text-muted)', fontWeight: isSelected ? 800 : 500, textAlign: 'center' }}>
                            {preset.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Prominent Generate Action Button (Sequential order: after options!) */}
                <div>
                  <button
                    onClick={handleGenerateAiCovers}
                    disabled={isGeneratingAiCovers}
                    className="btn btn--primary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                      color: '#000',
                      boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                    }}
                  >
                    <Wand2 size={16} />
                    <span>
                      {isGeneratingAiCovers
                        ? `Generating 4 Covers in ${AI_COVER_PRESETS[aiCoverStyle].label}...`
                        : `✨ Generate 4 Cover Candidates (${AI_COVER_PRESETS[aiCoverStyle].label})`}
                    </span>
                  </button>
                </div>

                {/* Step 4: Candidate Variations Selector Grid */}
                {aiCoverCandidates.length > 0 && (
                  <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>3. Click Any Variation to Apply to Active Thumbnail:</span>
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '10px', fontWeight: 600 }}>4 Variations Ready</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {aiCoverCandidates.map((candUrl, cIdx) => {
                        const isCandSelected = thumbnailImage === candUrl;
                        return (
                          <div
                            key={cIdx}
                            onClick={() => {
                              setThumbnailImage(candUrl);
                              toast.success(`Cover variation #${cIdx + 1} applied to thumbnail!`);
                            }}
                            style={{
                              position: 'relative',
                              aspectRatio: '9/16',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: isCandSelected ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              background: '#000',
                              boxShadow: isCandSelected ? '0 0 16px rgba(0, 242, 254, 0.5)' : '0 4px 10px rgba(0,0,0,0.5)',
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            <img
                              src={candUrl}
                              alt={`Variation ${cIdx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {isCandSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'var(--accent-cyan)',
                                  color: '#000',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  fontSize: '11px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                                }}
                              >
                                ✓
                              </div>
                            )}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 700,
                                textAlign: 'center',
                                padding: '6px 2px 3px',
                              }}
                            >
                              Option {cIdx + 1} {isCandSelected && '• Active'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: '20px', alignItems: 'start' }}>
              {/* Left Column: Typography & Overlay Controls */}
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

                {/* Typography Style Presets */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Typography & Glow Color Style:
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={handleOpenRealSizeInspector}
                  title="Click to inspect real 1080x1920 scale"
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
                    cursor: 'pointer',
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
                      Click "Grab Current Frame" or "Generate AI Covers"
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

                  {/* Hover / Corner Magnifier Overlay Tag */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Maximize2 size={10} color="var(--accent-amber)" /> 1080p
                  </div>
                </div>

                {/* Inspect Real Size Button */}
                <button
                  onClick={handleOpenRealSizeInspector}
                  disabled={isInspectingRealSize}
                  className="btn btn--outline"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderColor: 'var(--accent-amber)',
                    color: 'var(--accent-amber)',
                  }}
                >
                  <Eye size={13} /> 🔍 Inspect Real Size
                </button>

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

        {/* 🚀 Multi-Channel Distribution & Embed Generator */}
        {videoUrl && (
          <div className="surface-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--accent-cyan)" />
                <span>Multi-Channel Distribution & Embed Generator</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveDistTab('EMBED_WEB')}
                  className={`btn ${activeDistTab === 'EMBED_WEB' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Globe size={14} /> Web Layer (opportunity-system.com)
                </button>
                <button
                  onClick={() => setActiveDistTab('SOCIAL_CHANNELS')}
                  className={`btn ${activeDistTab === 'SOCIAL_CHANNELS' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Social Channels (YouTube, TikTok, X)
                </button>
              </div>
            </div>

            {/* TAB 1: WEB LAYER EMBED GENERATOR */}
            {activeDistTab === 'EMBED_WEB' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Deploy this shoppable 9:16 short directly to <strong style={{ color: '#fff' }}>opportunity-system.com/about</strong> or any landing page with 1-click checkout and zero platform fee friction.
                </div>

                {/* Embed Mode Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'FLOATING_BUBBLE', label: 'Floating Video Bubble', desc: 'Sleek TikTok-style corner avatar that pops out on click (Recommended)' },
                    { key: 'INLINE_CARD', label: 'Inline 9:16 Frame', desc: 'Responsive interactive video card embedded directly in page layout' },
                    { key: 'REACT_NATIVE', label: 'React / Next.js Component', desc: 'Clean TypeScript import for Next.js app router' },
                  ].map((m) => {
                    const isSelected = embedMode === m.key;
                    return (
                      <div
                        key={m.key}
                        onClick={() => setEmbedMode(m.key as any)}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)', marginBottom: '4px' }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {m.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Embed Customization Controls */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  {embedMode === 'FLOATING_BUBBLE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Position:</span>
                      <button
                        onClick={() => setEmbedPosition('BOTTOM_RIGHT')}
                        className={`btn ${embedPosition === 'BOTTOM_RIGHT' ? 'btn--primary' : 'btn--outline'}`}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Bottom Right
                      </button>
                      <button
                        onClick={() => setEmbedPosition('BOTTOM_LEFT')}
                        className={`btn ${embedPosition === 'BOTTOM_LEFT' ? 'btn--primary' : 'btn--outline'}`}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Bottom Left
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Theme:</span>
                    <button
                      onClick={() => setEmbedTheme('dark')}
                      className={`btn ${embedTheme === 'dark' ? 'btn--primary' : 'btn--outline'}`}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Dark Obsidian
                    </button>
                    <button
                      onClick={() => setEmbedTheme('glass')}
                      className={`btn ${embedTheme === 'glass' ? 'btn--primary' : 'btn--outline'}`}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Glassmorphic
                    </button>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={embedAutoplay}
                      onChange={(e) => setEmbedAutoplay(e.target.checked)}
                    />
                    <span>Autoplay Muted</span>
                  </label>
                </div>

                {/* Generated Code Display with 1-Click Copy */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Code size={14} />
                      <span>Embed Code Snippet (Paste into opportunity-system.com/about):</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedEmbedCode, 'embed_code')}
                      className="btn btn--primary"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedKey === 'embed_code' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedKey === 'embed_code' ? 'Copied to Clipboard!' : 'Copy Embed Code'}
                    </button>
                  </div>

                  <pre
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      color: '#00F2FE',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      overflowX: 'auto',
                      lineHeight: '1.5',
                      margin: 0,
                    }}
                  >
                    {generatedEmbedCode}
                  </pre>
                </div>
              </div>
            ) : (
              /* TAB 2: SOCIAL CHANNELS DISTRIBUTION HUB */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Pre-packaged viral metadata, tags, and direct publishing payloads tailored to each platform's algorithm requirements.
                </div>

                {/* Platform Selector Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'YOUTUBE', label: 'YouTube Shorts', icon: '▶️' },
                    { key: 'TIKTOK', label: 'TikTok', icon: '🎵' },
                    { key: 'INSTAGRAM', label: 'IG Reels', icon: '📸' },
                    { key: 'TWITTER', label: 'X (Twitter)', icon: '✖️' },
                    { key: 'ABOUT_PAGE', label: 'About Page', icon: '🌐' },
                  ].map((p) => {
                    const isSelected = selectedSocialPlatform === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setSelectedSocialPlatform(p.key as any)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.2)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{p.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Platform-Specific Publishing Package */}
                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* YouTube Shorts View */}
                  {selectedSocialPlatform === 'YOUTUBE' && (
                    <>
                      {/* OAuth Connection Status & Direct Dispatch */}
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: youtubeAccount ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', border: youtubeAccount ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: youtubeAccount ? '#10B981' : '#64748B' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: youtubeAccount ? '#10B981' : 'var(--text-secondary)' }}>
                              {youtubeAccount ? `Connected: @${youtubeAccount.accountName || (youtubeAccount as any).account_name || 'Channel'}` : 'YouTube Channel Not Connected'}
                            </span>
                          </div>
                          {youtubeAccount ? (
                            <button
                              onClick={handleDisconnectYouTube}
                              className="btn btn--outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
                              title="Disconnect YouTube Channel"
                            >
                              <LogOut size={12} style={{ marginRight: '4px' }} />
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={handleConnectYouTube}
                              className="btn btn--outline"
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60A5FA', fontWeight: 600 }}
                            >
                              ▶️ Connect YouTube
                            </button>
                          )}
                        </div>

                        {youtubeConnectSuccessMsg && (
                          <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            {youtubeConnectSuccessMsg}
                          </div>
                        )}

                        {publishYouTubeError && (
                          <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            {publishYouTubeError}
                          </div>
                        )}

                        {publishedYouTubeUrl && (
                          <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Live on YouTube Shorts!</span>
                            </div>
                            <a
                              href={publishedYouTubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00F2FE', textDecoration: 'underline', fontWeight: 700 }}
                            >
                              View Short <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {youtubeAccount && (
                          isPublishingYouTube ? (
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <RefreshCw size={13} className="spin" />
                                  {publishYouTubeStage === 'RENDERING' && `🎨 [1/4] Baking 1080x1920 Short with Kinetic Subtitles...`}
                                  {publishYouTubeStage === 'INITIALIZING' && '⚡ [2/4] Initializing YouTube Session...'}
                                  {publishYouTubeStage === 'UPLOADING' && `🚀 [3/4] Streaming to YouTube: ${publishYouTubePercent}% (${publishYouTubeLoadedMb} MB / ${publishYouTubeTotalMb} MB)`}
                                  {publishYouTubeStage === 'SETTING_THUMBNAIL' && '🎨 [4/4] Attaching Custom High-CTR Thumbnail...'}
                                  {publishYouTubeStage === 'DONE' && '🎉 Finalizing Live Short...'}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                                  {publishYouTubePercent}%
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${publishYouTubePercent}%`,
                                    background: 'linear-gradient(90deg, #6366F1 0%, #00F2FE 100%)',
                                    borderRadius: '4px',
                                    transition: 'width 0.2s ease',
                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Direct Google Cloud Stream • High Velocity • Resumable Protocol
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handlePublishDirectToYouTube}
                              disabled={!videoFile && !videoUrl}
                              className="btn btn--primary"
                              style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '13px',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <Send size={14} color="#fff" />
                              🚀 Publish Directly to YouTube Shorts (1-Click)
                            </button>
                          )
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Optimized Video Title (with #Shorts):</span>
                          <button
                            onClick={() => copyToClipboard(videoTitle ? (videoTitle.toLowerCase().includes('#shorts') ? videoTitle : `${videoTitle} #Shorts`) : `${thumbnailTitle} #Shorts`, 'yt_title')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'yt_title' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'yt_title' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                          {videoTitle ? (videoTitle.toLowerCase().includes('#shorts') ? videoTitle : `${videoTitle} #Shorts`) : `${thumbnailTitle} #Shorts`}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Full Description & Conversion Links:</span>
                          <button
                            onClick={() => copyToClipboard(videoDescription || `${editableTranscript.slice(0, 240)}...\n\n👉 Grab the Blueprint & Opportunity OS: https://opportunity-system.com/about\n⚡ Featured Product: ${selectedProduct?.title || 'Opportunity OS'}\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS`, 'yt_desc')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'yt_desc' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'yt_desc' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {videoDescription || `${editableTranscript.slice(0, 240)}...\n\n👉 Grab the Blueprint & Opportunity OS: https://opportunity-system.com/about\n⚡ Featured Product: ${selectedProduct?.title || 'Opportunity OS'}\n\n#Shorts #Programming #SoftwareEngineering #AI #TechCareers #OpportunityOS`}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Pinned Comment (Auto-Copy):</span>
                          <button
                            onClick={() => copyToClipboard(pinnedCommentText || `👉 Access the blueprint & software tools: https://opportunity-system.com/about (Link in Bio ⚡)`, 'yt_pin')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'yt_pin' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'yt_pin' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#FFB800', fontSize: '12px', fontWeight: 600 }}>
                          {pinnedCommentText || `👉 Access the blueprint & software tools: https://opportunity-system.com/about (Link in Bio ⚡)`}
                        </div>
                      </div>
                    </>
                  )}

                  {/* TikTok View */}
                  {selectedSocialPlatform === 'TIKTOK' && (
                    <>
                      {/* OAuth Connection Status & Direct Dispatch */}
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: tiktokAccount ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', border: tiktokAccount ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tiktokAccount ? '#10B981' : '#64748B' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: tiktokAccount ? '#10B981' : 'var(--text-secondary)' }}>
                              {tiktokAccount ? `Connected: @${tiktokAccount.accountName || (tiktokAccount as any).account_name || 'Creator'}` : 'TikTok Account Not Connected'}
                            </span>
                          </div>
                          {tiktokAccount ? (
                            <button
                              onClick={handleDisconnectTikTok}
                              className="btn btn--outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
                              title="Disconnect TikTok Account"
                            >
                              <LogOut size={12} style={{ marginRight: '4px' }} />
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={handleConnectTikTok}
                              className="btn btn--outline"
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60A5FA', fontWeight: 600 }}
                            >
                              🎵 Connect TikTok
                            </button>
                          )}
                        </div>

                        {tiktokConnectSuccessMsg && (
                          <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            {tiktokConnectSuccessMsg}
                          </div>
                        )}

                        {publishTikTokError && (
                          <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            {publishTikTokError}
                          </div>
                        )}

                        {publishedTikTokUrl && (
                          <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Live on TikTok Creator Hub!</span>
                            </div>
                            <a
                              href={publishedTikTokUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#60A5FA', textDecoration: 'underline', fontWeight: 700 }}
                            >
                              View TikTok <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {tiktokAccount && (
                          isPublishingTikTok ? (
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <RefreshCw size={13} className="spin" />
                                  {publishTikTokStage === 'RENDERING' && `🎨 [1/3] Baking 1080x1920 Short with Kinetic Subtitles...`}
                                  {publishTikTokStage === 'INITIALIZING' && '⚡ [2/3] Initializing TikTok Upload Session...'}
                                  {publishTikTokStage === 'UPLOADING' && `🚀 [3/3] Streaming to TikTok: ${publishTikTokPercent}% (${publishTikTokLoadedMb} MB / ${publishTikTokTotalMb} MB)`}
                                  {publishTikTokStage === 'DONE' && '🎉 Live on TikTok!'}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                                  {publishTikTokPercent}%
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${publishTikTokPercent}%`,
                                    background: 'linear-gradient(90deg, #6366F1 0%, #00F2FE 100%)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handlePublishToTikTok}
                              disabled={isPublishingTikTok || isExporting}
                              className="btn btn--primary"
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <Send size={14} color="#fff" />
                              🚀 Publish Directly to TikTok (1-Click)
                            </button>
                          )
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>TikTok Viral Caption & Hashtags:</span>
                          <button
                            onClick={() => {
                              const caption = videoTitle
                                ? `${videoTitle}\n\n${videoDescription || ''}`.trim()
                                : `${thumbnailTitle} 🔥 Watch till the end! Link in bio for full blueprint ⚡ #coding #ai #softwareengineer #tech #developer #opportunityos`;
                              copyToClipboard(caption, 'tt_cap');
                            }}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'tt_cap' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'tt_cap' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#fff', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {videoTitle
                            ? `${videoTitle}\n\n${videoDescription || ''}`
                            : `${thumbnailTitle} 🔥 Watch till the end! Link in bio for full blueprint ⚡ #coding #ai #softwareengineer #tech #developer #opportunityos`}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Bio Link Call-to-Action:</span>
                          <button
                            onClick={() => copyToClipboard(`👉 https://opportunity-system.com/about`, 'tt_bio')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'tt_bio' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'tt_bio' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#60A5FA', fontSize: '12px', fontWeight: 600 }}>
                          👉 https://opportunity-system.com/about
                        </div>
                      </div>
                    </>
                  )}

                  {/* Instagram View */}
                  {selectedSocialPlatform === 'INSTAGRAM' && (
                    <>
                      {/* OAuth Connection Status & Direct Dispatch */}
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: instagramAccount ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', border: instagramAccount ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: instagramAccount ? '#10B981' : '#64748B' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: instagramAccount ? '#10B981' : 'var(--text-secondary)' }}>
                              {instagramAccount ? `Connected: @${instagramAccount.accountName || (instagramAccount as any).account_name || 'Account'}` : 'Instagram Account Not Connected'}
                            </span>
                          </div>
                          {instagramAccount ? (
                            <button
                              onClick={handleDisconnectInstagram}
                              className="btn btn--outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
                              title="Disconnect Instagram Account"
                            >
                              <LogOut size={12} style={{ marginRight: '4px' }} />
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={handleConnectInstagram}
                              className="btn btn--outline"
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60A5FA', fontWeight: 600 }}
                            >
                              📸 Connect Instagram
                            </button>
                          )}
                        </div>

                        {instagramConnectSuccessMsg && (
                          <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            {instagramConnectSuccessMsg}
                          </div>
                        )}

                        {publishInstagramError && (
                          <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            {publishInstagramError}
                          </div>
                        )}

                        {publishedInstagramUrl && (
                          <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Live on Instagram Reels!</span>
                            </div>
                            <a
                              href={publishedInstagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#60A5FA', textDecoration: 'underline', fontWeight: 700 }}
                            >
                              View Reels <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {instagramAccount && (
                          isPublishingInstagram ? (
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <RefreshCw size={13} className="spin" />
                                  {publishInstagramStage === 'RENDERING' && `🎨 [1/3] Baking 1080x1920 Reel with Subtitles...`}
                                  {publishInstagramStage === 'INITIALIZING' && '⚡ [2/3] Initializing Instagram Container...'}
                                  {publishInstagramStage === 'UPLOADING' && `🚀 [3/3] Publishing to Instagram: ${publishInstagramPercent}%`}
                                  {publishInstagramStage === 'DONE' && '🎉 Live on Instagram!'}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                                  {publishInstagramPercent}%
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${publishInstagramPercent}%`,
                                    background: 'linear-gradient(90deg, #6366F1 0%, #00F2FE 100%)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handlePublishToInstagram}
                              disabled={isPublishingInstagram || isExporting}
                              className="btn btn--primary"
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <Send size={14} color="#fff" />
                              🚀 Publish Directly to Instagram Reels (1-Click)
                            </button>
                          )
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Instagram Reels Caption:</span>
                          <button
                            onClick={() => copyToClipboard(`${thumbnailTitle} 🚀 Grab the free Chapter 1 blueprint via link in bio! #reels #ai #coding #softwarevelocity #developer`, 'ig_cap')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'ig_cap' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'ig_cap' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#fff', fontSize: '13px', lineHeight: '1.5' }}>
                          {thumbnailTitle} 🚀 Grab the free Chapter 1 blueprint via link in bio! <span style={{ color: '#60A5FA' }}>#reels #ai #coding #softwarevelocity #developer</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Twitter / X View */}
                  {selectedSocialPlatform === 'TWITTER' && (
                    <>
                      {/* OAuth Connection Status & Direct Dispatch */}
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: twitterAccount ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)', border: twitterAccount ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: twitterAccount ? '#10B981' : '#64748B' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: twitterAccount ? '#10B981' : 'var(--text-secondary)' }}>
                              {twitterAccount ? `Connected: @${twitterAccount.accountName || (twitterAccount as any).account_name || 'Account'}` : 'X / Twitter Account Not Connected'}
                            </span>
                          </div>
                          {twitterAccount ? (
                            <button
                              onClick={handleDisconnectTwitter}
                              className="btn btn--outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
                              title="Disconnect X Account"
                            >
                              <LogOut size={12} style={{ marginRight: '4px' }} />
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={handleConnectTwitter}
                              className="btn btn--outline"
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60A5FA', fontWeight: 600 }}
                            >
                              ✖️ Connect X (Twitter)
                            </button>
                          )}
                        </div>

                        {twitterConnectSuccessMsg && (
                          <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            {twitterConnectSuccessMsg}
                          </div>
                        )}

                        {publishTwitterError && (
                          <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            {publishTwitterError}
                          </div>
                        )}

                        {publishedTwitterUrl && (
                          <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Live on X / Twitter!</span>
                            </div>
                            <a
                              href={publishedTwitterUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#60A5FA', textDecoration: 'underline', fontWeight: 700 }}
                            >
                              View Post <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {twitterAccount && (
                          isPublishingTwitter ? (
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <RefreshCw size={13} className="spin" />
                                  {publishTwitterStage === 'RENDERING' && `🎨 [1/3] Baking Video with Kinetic Subtitles...`}
                                  {publishTwitterStage === 'INITIALIZING' && '⚡ [2/3] Initializing X Media Upload...'}
                                  {publishTwitterStage === 'UPLOADING' && `🚀 [3/3] Publishing to X: ${publishTwitterPercent}%`}
                                  {publishTwitterStage === 'DONE' && '🎉 Live on X!'}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                                  {publishTwitterPercent}%
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${publishTwitterPercent}%`,
                                    background: 'linear-gradient(90deg, #6366F1 0%, #00F2FE 100%)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handlePublishToTwitter}
                              disabled={isPublishingTwitter || isExporting}
                              className="btn btn--primary"
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <Send size={14} color="#fff" />
                              🚀 Publish Directly to X / Twitter (1-Click)
                            </button>
                          )
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>X / Twitter Post Payload:</span>
                          <button
                            onClick={() => copyToClipboard(`${thumbnailTitle}\n\nThe old way of memorizing syntax is dead. AI-native engineering is about architecture, velocity, and leverage.\n\n👉 Full blueprint: https://opportunity-system.com/about ⚡`, 'x_post')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'x_post' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'x_post' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#fff', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {thumbnailTitle}
                          {'\n\n'}The old way of memorizing syntax is dead. AI-native engineering is about architecture, velocity, and leverage.
                          {'\n\n'}👉 Full blueprint: <span style={{ color: '#00F2FE' }}>https://opportunity-system.com/about</span> ⚡
                        </div>
                      </div>
                    </>
                  )}

                  {/* Opportunity OS About Page View */}
                  {selectedSocialPlatform === 'ABOUT_PAGE' && (
                    <>
                      {/* Connection & Network Status */}
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                              Opportunity OS Video Network Showcase (Active)
                            </span>
                          </div>
                          <a
                            href="https://opportunity-system.com/about"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#60A5FA', textDecoration: 'underline', fontWeight: 600 }}
                          >
                            Open Live Page <ExternalLink size={11} />
                          </a>
                        </div>

                        {publishAboutPageError && (
                          <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            {publishAboutPageError}
                          </div>
                        )}

                        {publishedAboutPageUrl && (
                          <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Live on Opportunity OS About Page Shorts Showcase!</span>
                            </div>
                            <a
                              href={publishedAboutPageUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#60A5FA', textDecoration: 'underline', fontWeight: 700 }}
                            >
                              View on About Page <ExternalLink size={11} />
                            </a>
                          </div>
                        )}

                        {isPublishingAboutPage ? (
                          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(59, 130, 246, 0.45)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--accent-teal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <RefreshCw size={13} className="spin" />
                                {publishAboutPageStage === 'RENDERING' && '🎬 [1/4] Rendering 1080x1920 Short & Kinetic Subtitles...'}
                                {publishAboutPageStage === 'INITIALIZING' && '🖼️ [2/4] Baking 9:16 High-CTR Cover Art...'}
                                {publishAboutPageStage === 'UPLOADING' && `☁️ [3/4] Uploading HD Video: ${publishAboutPageLoadedMb} MB / ${publishAboutPageTotalMb} MB...`}
                                {publishAboutPageStage === 'SAVING' && '🚀 [4/4] Registering in Media Catalog & Going Live...'}
                                {publishAboutPageStage === 'DONE' && '🎉 Live on About Page!'}
                              </span>
                              <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-mono, monospace)' }}>
                                {publishAboutPagePercent}%
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${publishAboutPagePercent}%`,
                                  background: 'linear-gradient(90deg, #6366F1 0%, #00F2FE 50%, #10B981 100%)',
                                  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              />
                            </div>
                            {publishAboutPageStage === 'UPLOADING' && parseFloat(publishAboutPageTotalMb) > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span>High-Definition 1080x1920 Video Stream</span>
                                <span style={{ color: '#38BDF8', fontWeight: 600 }}>{Math.round((parseFloat(publishAboutPageLoadedMb) / parseFloat(publishAboutPageTotalMb)) * 100) || 0}% Uploaded</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handlePublishToAboutPage}
                            disabled={isPublishingAboutPage || isExporting}
                            className="btn btn--primary"
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <Send size={14} color="#fff" />
                            🚀 Publish Directly to About Page Shorts Showcase (1-Click)
                          </button>
                        )}
                      </div>

                      {/* Showcase Shelf Preview */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>About Page 9:16 Card Preview:</span>
                          <button
                            onClick={() => copyToClipboard(`https://opportunity-system.com/about`, 'about_url')}
                            className="btn btn--outline"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {copiedKey === 'about_url' ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                            {copiedKey === 'about_url' ? 'Copied Link' : 'Copy Page Link'}
                          </button>
                        </div>
                        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#fff', fontSize: '13px', lineHeight: '1.5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ background: '#ff0000', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' }}>SHORTS</span>
                            <span style={{ fontWeight: 700 }}>{videoTitle || thumbnailTitle}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {videoDescription || 'Interactive Shoppable Short featuring AI-Native Software Engineering'}
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#60A5FA', display: 'flex', gap: '12px' }}>
                            <span>⚡ Featured in The Video Network</span>
                            <span>🎯 Shoppable Product Drawer Enabled</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
                          color: isWordActive ? getHighlightColorConfig(highlightColor).hex : '#ffffff',
                          textShadow: isWordActive
                            ? `0 0 20px ${getHighlightColorConfig(highlightColor).glow}, 0 4px 12px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000`
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
                    border: `1.5px solid ${getHighlightColorConfig(highlightColor).hex}`,
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
                  <span style={{ fontSize: '8px', fontWeight: 900, color: getHighlightColorConfig(highlightColor).hex, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
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

      {/* 🔍 Full-Resolution (1080x1920) Lightbox Inspector Modal */}
      {isRealSizeModalOpen && realSizeModalUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '24px',
            overflow: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRealSizeModalOpen(false);
          }}
        >
          {/* Top Bar Controls */}
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px 20px',
              background: 'rgba(20, 20, 28, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={20} color="var(--accent-amber)" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  Full-Resolution Thumbnail Inspector (1080 × 1920)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Crisp native pixel preview of the active composite cover
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setRealSizeZoom100(!realSizeZoom100)}
                className={`btn ${realSizeZoom100 ? 'btn--primary' : 'btn--outline'}`}
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Toggle between Fit-to-Window and 100% Native Pixel Scale"
              >
                {realSizeZoom100 ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                {realSizeZoom100 ? 'Fit Window' : '100% Actual Scale'}
              </button>

              <button
                onClick={handleCopyRealSizeImage}
                className="btn btn--outline"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={14} /> Copy Image
              </button>

              <button
                onClick={() => downloadThumbnail('9:16')}
                className="btn btn--primary"
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> ⬇️ Download JPEG
              </button>

              <button
                onClick={() => setIsRealSizeModalOpen(false)}
                className="btn btn--outline"
                style={{ padding: '6px 10px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Image Viewport */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: realSizeZoom100 ? 'none' : '960px',
              paddingBottom: '40px',
            }}
          >
            <img
              src={realSizeModalUrl}
              alt="Full Resolution 1080x1920 Thumbnail"
              style={
                realSizeZoom100
                  ? {
                      width: '1080px',
                      height: '1920px',
                      borderRadius: '12px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.95)',
                      border: '2px solid var(--accent-amber)',
                    }
                  : {
                      maxHeight: 'calc(88vh - 100px)',
                      maxWidth: '100%',
                      aspectRatio: '9/16',
                      objectFit: 'contain',
                      borderRadius: '16px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.95)',
                      border: '2px solid var(--accent-amber)',
                    }
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
