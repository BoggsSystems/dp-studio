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
  ShoppingBag,
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
  // Wizard Steps: 1 = Format Selection, 2 = Assets & Details, 3 = Catalog Linking
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<ExperienceFormat>('VOD');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & SaaS');
  const [channel, setChannel] = useState('about');
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Execution State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setFormat('VOD');
    setTitle('');
    setDescription('');
    setCategory('Technology & SaaS');
    setChannel('about');
    setSourceType('upload');
    setVideoUrl('');
    setSelectedFile(null);
    setSelectedProductIds([]);
    setIsSubmitting(false);
    setError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleToggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your experience.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. LIVE BROADCAST CREATION FLOW
      if (format === 'LIVE') {
        const session = await api.createStreamSession(title);
        toast.success(`Live Broadcast "${title}" scheduled!`, 'Live Deck Ready');
        if (onOpenLiveStudio) {
          onOpenLiveStudio(session);
        }
        handleReset();
        return;
      }

      // 2. 9:16 VERTICAL SHORT CREATION FLOW
      if (format === 'SHORT') {
        let finalVideoUrl = videoUrl;
        const shortDraftId = `short_${Date.now()}`;

        if (selectedFile) {
          await saveDraftVideoBlob(selectedFile, selectedFile.name);

          try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('creatorSlug', 'opportunity-system');

            const apiBase = (
              (import.meta as any).env?.VITE_API_URL ||
              (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:9000'
                : 'https://digitpop.opportunity-system.com')
            ).replace(/\/+$/, '');

            const uploadRes = await fetch(`${apiBase}/api/publisher/shorts/upload-direct`, {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              if (uploadData.url) {
                finalVideoUrl = uploadData.url;
              }
            }
          } catch (uploadErr) {
            console.warn('Direct upload warning (draft stored in IndexedDB):', uploadErr);
          }
        }

        const initialDraft = {
          id: shortDraftId,
          title: title,
          videoFileName: selectedFile?.name || 'short_video.mp4',
          videoUrl: finalVideoUrl,
          words: [],
          editableTranscript: '',
          highlightColor: '#FFE600',
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
          selectedProductId: selectedProductIds[0] || null,
          thumbnailTitle: title,
          thumbnailStyle: 'VIRAL_WHITE',
          thumbnailFontSize: 54,
          thumbnailPosition: 45,
          thumbnailBadge: '⚡ MUST WATCH',
          status: 'DRAFT',
          updatedAt: Date.now(),
        };
        localStorage.setItem('digitpop_shorts_formatter_draft_v1', JSON.stringify(initialDraft));

        toast.success(`Short "${title}" created! Opening Shorts Studio...`, 'Shorts Ready');
        if (onOpenShortStudio) {
          onOpenShortStudio(shortDraftId);
        }
        handleReset();
        return;
      }

      // 3. 16:9 INTERACTIVE VOD CREATION FLOW
      let resolvedVodUrl = videoUrl;

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('creatorSlug', 'opportunity-system');

          const apiBase = (
            (import.meta as any).env?.VITE_API_URL ||
            (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? 'http://localhost:9000'
              : 'https://digitpop.opportunity-system.com')
          ).replace(/\/+$/, '');

          const uploadRes = await fetch(`${apiBase}/api/publisher/shorts/upload-direct`, {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              resolvedVodUrl = uploadData.url;
            }
          }
        } catch (upErr) {
          console.warn('VOD Upload warning:', upErr);
        }
      }

      const linkedProducts = availableProducts.filter((p) => selectedProductIds.includes(p.id));

      const newProjectPayload: Partial<Project> = {
        name: title,
        description,
        category,
        channel,
        mediaType: 'VOD',
        masterVodUrl: resolvedVodUrl || 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/raw_videos/opportunity_os_showcase.mp4',
        hlsManifestUrl: resolvedVodUrl?.endsWith('.m3u8') ? resolvedVodUrl : undefined,
        status: 'READY',
        isActive: true,
        productGroups:
          linkedProducts.length > 0
            ? [
                {
                  id: `pg_${Date.now()}`,
                  title: 'Featured Collection',
                  subtitle: 'In-Stream Offer',
                  timestampSeconds: 5.0,
                  viewingMode: 'SIDE_PANEL',
                  products: linkedProducts,
                },
              ]
            : [],
        baskets: [],
      };

      const created = await api.saveProject(newProjectPayload);
      onProjectCreated(created);
      toast.success(`Project "${created.name}" created! Opening Timeline Studio...`, 'VOD Ready');
      handleReset();
    } catch (err: any) {
      setError(err.message || 'Failed to create experience');
    } finally {
      setIsSubmitting(false);
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
          maxWidth: step === 1 ? '780px' : '620px',
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
                    ? '🎬 Configure 16:9 Interactive VOD'
                    : format === 'SHORT'
                    ? '⚡ Configure 9:16 Vertical Short'
                    : '📡 Schedule Live Shopping Broadcast')}
                {step === 3 && '📦 Link Products from Store Catalog'}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Step {step} of {format === 'LIVE' ? 2 : 3} •{' '}
                {step === 1 ? 'Select Format' : step === 2 ? 'Details & Assets' : 'Catalog Pins'}
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
                Select the shoppable format you want to create. Each experience provides a dedicated studio workspace:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* 1. 16:9 VOD Card */}
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
                    Timeline Scrubber + Pin Drop
                  </div>
                </div>

                {/* 2. 9:16 Shorts Card */}
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
                    Groq Turbo + AI Hook Studio
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
                    On-Air Broadcast Deck
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: ASSETS & METADATA ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label
                  className="form-label"
                  style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  {format === 'LIVE' ? 'Broadcast Event Title *' : 'Project Title *'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={
                    format === 'VOD'
                      ? 'e.g. ATS Autofill Engine Walkthrough'
                      : format === 'SHORT'
                      ? 'e.g. Web3 Scams You Must Avoid'
                      : 'e.g. Black Friday Live Launch Event'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {format !== 'LIVE' && (
                <div>
                  <label
                    className="form-label"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Video Asset Source
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setSourceType('upload')}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: sourceType === 'upload' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${sourceType === 'upload' ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: sourceType === 'upload' ? 'var(--accent-teal)' : 'var(--text-secondary)',
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
                        background: sourceType === 'url' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${sourceType === 'url' ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: sourceType === 'url' ? 'var(--accent-teal)' : 'var(--text-secondary)',
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
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed rgba(255, 255, 255, 0.15)',
                          borderRadius: 'var(--radius-md)',
                          padding: '24px 16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: selectedFile ? 'rgba(20, 184, 166, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <UploadCloud size={28} color={selectedFile ? 'var(--accent-teal)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px auto' }} />
                        {selectedFile ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{selectedFile.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-teal)', marginTop: '2px' }}>
                              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for ingestion
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              Click or drag video file here
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              MP4, MOV, or WebM up to 2GB
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://pub-...r2.dev/video.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        Supports MP4, WebM, and HLS .m3u8 adaptive bitrate manifests.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    className="form-label"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Technology & SaaS">Technology & SaaS</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Education & Careers">Education & Careers</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Target Channel
                  </label>
                  <select
                    className="input-field"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="about">About / Showcase</option>
                    <option value="tech">Tech / Engineering</option>
                    <option value="keynotes">Keynotes & Demos</option>
                    <option value="store">Storefront</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Overview of the video and product promotions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: CATALOG LINKING ================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Select initial products to link to this video. You can fine-tune timestamps and overlay styles in the studio workspace:
              </div>

              {availableProducts.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  <ShoppingBag size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div>No products found in catalog. You can add them later inside the studio.</div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '10px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {availableProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProduct(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'rgba(20, 184, 166, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isSelected ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>
                            ${p.price.toFixed(2)}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="var(--accent-teal)" />}
                      </div>
                    );
                  })}
                </div>
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
              onClick={() => setStep((prev) => (prev - 1) as any)}
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

            {step === 2 && format === 'LIVE' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                <span>{isSubmitting ? 'Scheduling...' : 'Create & Open Live Deck'}</span>
              </button>
            )}

            {step === 2 && format !== 'LIVE' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!title.trim()) {
                    setError('Title is required.');
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
              >
                <span>Select Products</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating & Uploading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Create & Open Studio</span>
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

