import React, { useState, useRef } from 'react';
import {
  X,
  Film,
  Sparkles,
  Radio,
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Project, Product, StreamSession } from '../types';
import { api } from '../services/api';
import { saveDraftVideoBlob } from '../services/videoStorage';
import { toast } from '../services/toast';

export type ExperienceFormat = 'VOD' | 'SHORT' | 'LIVE';

interface ProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  onOpenShortStudio?: (draftId?: string) => void;
  onOpenLiveStudio?: (session: StreamSession) => void;
  availableProducts?: Product[];
}

export default function ProjectWizardModal({
  isOpen,
  onClose,
  onProjectCreated,
  onOpenShortStudio,
  onOpenLiveStudio,
  availableProducts = [],
}: ProjectWizardModalProps) {
  // Ultra-Clean 2-Step Flow: Step 1 = Format Selection, Step 2 = Drop Asset & Launch
  const [step, setStep] = useState<1 | 2>(1);
  const [format, setFormat] = useState<ExperienceFormat>('SHORT');

  // Form State
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Execution State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [loadedMb, setLoadedMb] = useState<string>('0');
  const [totalMb, setTotalMb] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setFormat('SHORT');
    setTitle('');
    setSourceType('upload');
    setVideoUrl('');
    setSelectedFile(null);
    setIsSubmitting(false);
    setUploadStage('');
    setUploadPercent(0);
    setLoadedMb('0');
    setTotalMb('0');
    setError(null);
    onClose();
  };

  const isGenericFilename = (name: string) => {
    const raw = name.replace(/\.[^/.]+$/, '').trim();
    return /^(IMG|MOV|VID|VIDEO|FILE|DSC|CLIP|RECORDING|SCREEN_RECORDING)[-_0-9\s]*$/i.test(raw);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!isGenericFilename(file.name)) {
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Determine smart effective title
    let effectiveTitle = title.trim();
    if (!effectiveTitle || isGenericFilename(effectiveTitle)) {
      if (selectedFile && !isGenericFilename(selectedFile.name)) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        effectiveTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      } else {
        effectiveTitle = format === 'SHORT' ? 'AI SHOPPABLE SHORT' : (format === 'LIVE' ? 'Live Shopping Stream' : 'Shoppable Video Experience');
      }
    }

    setIsSubmitting(true);
    setError(null);
    setUploadPercent(0);

    try {
      // 1. LIVE BROADCAST CREATION FLOW
      if (format === 'LIVE') {
        setUploadStage('Scheduling real-time broadcast session...');
        const sessionTitle = effectiveTitle || 'Live Shopping Event';
        const session = await api.createStreamSession(sessionTitle);
        toast.success(`Live Broadcast "${sessionTitle}" scheduled!`, 'Live Deck Ready');
        if (onOpenLiveStudio) {
          onOpenLiveStudio(session);
        }
        handleReset();
        return;
      }

      // 2. VIDEO EXPERIENCES (9:16 SHORT OR 16:9 VOD)
      let resolvedVideoUrl = videoUrl;
      const isShort = format === 'SHORT';
      const uploadFolder = isShort ? 'videos/shorts/opportunity-system' : 'raw_videos/opportunity-system';

      if (selectedFile) {
        setUploadStage(`Streaming ${isShort ? '9:16 Short' : '16:9 VOD'} to cloud storage...`);
        const uploadRes = await api.uploadMedia(selectedFile, uploadFolder, (prog) => {
          const pct = typeof prog === 'number' ? prog : prog.percent;
          const lMb = typeof prog === 'number' ? (selectedFile.size * (pct / 100) / (1024 * 1024)).toFixed(1) : prog.loadedMb;
          const tMb = typeof prog === 'number' ? (selectedFile.size / (1024 * 1024)).toFixed(1) : prog.totalMb;
          setUploadPercent(pct);
          setLoadedMb(lMb);
          setTotalMb(tMb);
          setUploadStage(`Uploading video to cloud: ${lMb} MB / ${tMb} MB (${pct}%)`);
        });

        if (uploadRes && uploadRes.url) {
          resolvedVideoUrl = uploadRes.url;
        }

        // Save local backup blob for instant offline editing
        if (isShort) {
          await saveDraftVideoBlob(selectedFile, selectedFile.name);
        }
      }

      setUploadStage('Registering project in database...');
      const newProjectPayload: Partial<Project> = {
        name: effectiveTitle,
        description: isShort ? 'AI-Native Shoppable Short Video' : '',
        category: isShort ? 'Shorts' : 'Technology & SaaS',
        channel: 'about',
        mediaType: format,
        thumbnailBadge: isShort ? '⚡ 9:16 Short' : '🎬 16:9 VOD',
        masterVodUrl: resolvedVideoUrl || (isShort ? '' : 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/raw_videos/opportunity_os_showcase.mp4'),
        hlsManifestUrl: (!isShort && resolvedVideoUrl?.endsWith('.m3u8')) ? resolvedVideoUrl : undefined,
        status: 'READY',
        isActive: true,
        productGroups: [],
        baskets: [],
        metadata: isShort ? {
          creatorSlug: 'opportunity-system',
          channel: 'about',
          highlightColor: 'amber',
          fontSize: 22,
          verticalPosition: 78,
          wordPacing: 'POP_TWO_WORDS',
          autoEmojis: true,
          uppercase: true,
          layoutMode: 'FIT_BLUR',
          showShoppableDrawer: true,
          showQrCode: true,
          qrPlacement: 'TOP_RIGHT',
          thumbnailTitle: effectiveTitle,
          thumbnailStyle: 'VIRAL_WHITE',
          thumbnailFontSize: 54,
          thumbnailPosition: 45,
          thumbnailBadge: '⚡ MUST WATCH',
          thumbnailStrokeWidth: 14,
        } : undefined,
      };

      const created = await api.saveProject(newProjectPayload);
      onProjectCreated(created);

      if (isShort) {
        // Initialize draft for short studio
        const initialDraft = {
          id: created.id,
          title: created.name,
          videoFileName: selectedFile?.name || 'short_video.mp4',
          videoUrl: created.masterVodUrl,
          cloudVideoUrl: created.masterVodUrl,
          words: [],
          editableTranscript: '',
          highlightColor: 'amber',
          fontSize: 22,
          verticalPosition: 78,
          wordPacing: 'POP_TWO_WORDS',
          autoEmojis: true,
          uppercase: true,
          layoutMode: 'FIT_BLUR',
          showShoppableDrawer: true,
          showQrCode: true,
          qrPlacement: 'TOP_RIGHT',
          qrCustomUrl: '',
          selectedProductId: null,
          thumbnailTitle: created.name,
          thumbnailStyle: 'VIRAL_WHITE',
          thumbnailFontSize: 54,
          thumbnailPosition: 45,
          thumbnailBadge: '⚡ MUST WATCH',
          status: 'READY',
          updatedAt: Date.now(),
        };
        localStorage.setItem('digitpop_shorts_formatter_draft_v1', JSON.stringify(initialDraft));
        toast.success(`Short project "${created.name}" created! Opening Shorts Studio...`, 'Shorts Ready');
        if (onOpenShortStudio) {
          onOpenShortStudio(created.id);
        }
      } else {
        toast.success(`Project "${created.name}" created! Opening Timeline Studio...`, 'VOD Ready');
      }

      handleReset();
    } catch (err: any) {
      setError(err.message || 'Failed to create experience');
    } finally {
      setIsSubmitting(false);
      setUploadStage('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="surface-panel"
        style={{
          width: '100%',
          maxWidth: step === 1 ? '760px' : '560px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#0c111d',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background:
                  format === 'VOD'
                    ? 'rgba(20, 184, 166, 0.15)'
                    : format === 'SHORT'
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${
                  format === 'VOD'
                    ? 'var(--accent-teal)'
                    : format === 'SHORT'
                    ? '#6366F1'
                    : 'var(--accent-red)'
                }`,
              }}
            >
              {format === 'VOD' && <Film size={18} color="var(--accent-teal)" />}
              {format === 'SHORT' && <Sparkles size={18} color="#818CF8" />}
              {format === 'LIVE' && <Radio size={18} color="var(--accent-red)" />}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {step === 1 && 'Create New Shoppable Experience'}
                {step === 2 &&
                  (format === 'VOD'
                    ? '🎬 Upload 16:9 Master Video'
                    : format === 'SHORT'
                    ? '⚡ Upload 9:16 Video Asset'
                    : '📡 Schedule Live Shopping Event')}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Step {step} of 2 • {step === 1 ? 'Choose Experience Format' : 'Asset Ingestion & AI Auto-Match'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={handleReset}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: FORMAT SELECTION ================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Select the shoppable format you want to create:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* 1. 9:16 Shorts Card (Default & Recommended) */}
                <div
                  onClick={() => setFormat('SHORT')}
                  style={{
                    padding: '20px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background:
                      format === 'SHORT'
                        ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.04) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: `1.5px solid ${format === 'SHORT' ? '#6366F1' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818CF8',
                      }}
                    >
                      <Sparkles size={22} />
                    </div>
                    {format === 'SHORT' && <CheckCircle2 size={18} color="#818CF8" />}
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>9:16 Vertical Short</div>
                    <div style={{ fontSize: '11px', color: '#818CF8', fontWeight: 600, marginTop: '2px' }}>
                      Mobile Portrait Clip
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Auto-subtitles with active word glow, pinned product drawer, QR buy badges, and AI 35mm CTR covers.
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Groq Turbo + AI Hook
                  </div>
                </div>

                {/* 2. 16:9 VOD Card */}
                <div
                  onClick={() => setFormat('VOD')}
                  style={{
                    padding: '20px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background:
                      format === 'VOD'
                        ? 'linear-gradient(180deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0.04) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: `1.5px solid ${format === 'VOD' ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'rgba(20, 184, 166, 0.2)',
                        color: 'var(--accent-teal)',
                      }}
                    >
                      <Film size={22} />
                    </div>
                    {format === 'VOD' && <CheckCircle2 size={18} color="var(--accent-teal)" />}
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>16:9 Interactive VOD</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 600, marginTop: '2px' }}>
                      Landscape / Keynote
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Long-form video with timestamped product pin drops, chapter overlays, and interactive checkout drawers.
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Timeline Scrubber + Pins
                  </div>
                </div>

                {/* 3. Live Broadcast Card */}
                <div
                  onClick={() => setFormat('LIVE')}
                  style={{
                    padding: '20px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background:
                      format === 'LIVE'
                        ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: `1.5px solid ${format === 'LIVE' ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: 'var(--accent-red)',
                      }}
                    >
                      <Radio size={22} />
                    </div>
                    {format === 'LIVE' && <CheckCircle2 size={18} color="var(--accent-red)" />}
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Live Shopping Stream</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: 600, marginTop: '2px' }}>
                      Real-Time Ingestion
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Low-latency RTMP/WebRTC broadcast deck with live overlay synchronizer and 1-click buy triggers.
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Broadcast Deck
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: DROP ASSET & LAUNCH ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {format === 'LIVE' ? (
                <div>
                  <label
                    className="form-label"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Broadcast Event Title *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Black Friday Live Launch Event"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label
                      className="form-label"
                      style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                    >
                      Video Asset Source
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() => setSourceType('upload')}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          background: sourceType === 'upload' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${sourceType === 'upload' ? '#6366F1' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: sourceType === 'upload' ? '#818CF8' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <UploadCloud size={14} />
                        <span>Upload Video File (2GB Limit)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSourceType('url')}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          background: sourceType === 'url' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${sourceType === 'url' ? '#6366F1' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: sourceType === 'url' ? '#818CF8' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <LinkIcon size={14} />
                        <span>Direct CDN / R2 URL</span>
                      </button>
                    </div>

                    {sourceType === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="video/mp4,video/quicktime,video/webm"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />
                        <div
                          onClick={() => !isSubmitting && fileInputRef.current?.click()}
                          style={{
                            border: `2px dashed ${selectedFile ? '#6366F1' : 'rgba(99, 102, 241, 0.35)'}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: '30px 20px',
                            textAlign: 'center',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            background: selectedFile ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <UploadCloud size={36} color={selectedFile ? '#818CF8' : 'var(--text-muted)'} style={{ margin: '0 auto 12px auto' }} />
                          {selectedFile ? (
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{selectedFile.name}</div>
                              <div style={{ fontSize: '12px', color: '#818CF8', marginTop: '4px', fontWeight: 600 }}>
                                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Direct Cloud-Native Pipeline
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                Click or drag your video file here
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                High-throughput direct upload (MP4, MOV, WebM up to 2GB)
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Real-Time Upload & Ingestion Progress Bar */}
                        {isSubmitting && (
                          <div
                            style={{
                              marginTop: '16px',
                              padding: '14px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader2 size={16} className="animate-spin" color="#818CF8" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                  {uploadStage || 'Processing video ingestion...'}
                                </span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#818CF8', fontFamily: 'var(--font-mono)' }}>
                                {uploadPercent > 0 ? `${uploadPercent}%` : ''}
                              </span>
                            </div>

                            {/* Progress track */}
                            <div
                              style={{
                                width: '100%',
                                height: '6px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.max(5, uploadPercent)}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #6366F1 0%, #38BDF8 100%)',
                                  borderRadius: '3px',
                                  transition: 'width 0.2s ease',
                                }}
                              />
                            </div>

                            {loadedMb !== '0' && totalMb !== '0' && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                <span>Uploaded: {loadedMb} MB</span>
                                <span>Total: {totalMb} MB</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://pub-...r2.dev/video.mp4"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          Supports MP4, WebM, and HLS .m3u8 adaptive bitrate manifests.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* AI Value-Add Callout */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <Sparkles size={18} color="#818CF8" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: '#fff' }}>AI Auto-Synthesis on Launch:</strong> Groq Whisper will transcribe audio in ~0.4s, extract the primary speech hook for your title, auto-match the best catalog product, and generate descriptions, captions, and buy QR badges.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Cancel
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {step === 1 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(2)}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting || (format !== 'LIVE' && !selectedFile && !videoUrl)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading & Initializing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Launch Studio 🚀</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

