import React, { useState, useEffect } from 'react';
import { Plus, Video, Play, Edit3, ExternalLink, Trash2, Layers, ShoppingBag, CheckCircle, Sparkles, Smartphone, CheckCircle2, Film, Radio, Loader2, FileText } from 'lucide-react';
import { Project, FormattedShortProject, StreamSession, Product } from '../types';
import ProjectWizardModal from './ProjectWizardModal';
import ConfirmModal from './ConfirmModal';
import { toast } from '../services/toast';
import { api } from '../services/api';
import { getAllShortProjects, getShortProject, loadShortProjectIntoActiveDraft, deleteShortProject, setShortPublishedInCloud, deleteVodProjectFromCloud } from '../services/videoStorage';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenShort?: (short?: FormattedShortProject) => void;
  onOpenLiveStudio?: (session: StreamSession) => void;
  onOpenPreProduction?: (project?: Project) => void;
  availableProducts?: Product[];
}

const getResolvedThumbnailUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProjectList({
  projects,
  onSelectProject,
  onProjectCreated,
  onDeleteProject,
  onOpenShort,
  onOpenLiveStudio,
  onOpenPreProduction,
  availableProducts = [],
}: ProjectListProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VOD' | 'SHORTS' | 'SCRIPTS'>('ALL');
  const [savedShorts, setSavedShorts] = useState<FormattedShortProject[]>([]);
  const [deletingShortId, setDeletingShortId] = useState<string | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);
  const [deletingVodId, setDeletingVodId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);

  useEffect(() => { setLocalProjects(projects); }, [projects]);

  const [isCreatingSample, setIsCreatingSample] = useState(false);

  const handleCreateSampleShowcase = async () => {
    try {
      setIsCreatingSample(true);
      const sampleProj: Project = {
        id: `proj_showcase_${Date.now()}`,
        name: 'DigitPop Interactive Showcase',
        description: 'Experience frame-synchronized product hotspots, interactive overlays, and immersive video commerce.',
        category: 'Technology & SaaS',
        channel: 'about',
        mediaType: 'VOD',
        thumbnailBadge: '16:9 VOD',
        masterVodUrl: 'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/raw_videos/opportunity_os_showcase.mp4',
        status: 'READY',
        isActive: true,
        productGroups: [],
        baskets: [],
      };
      try {
        const saved = await api.saveProject(sampleProj);
        if (saved) {
          onProjectCreated(saved);
          onSelectProject(saved);
          toast.success('Sample showcase project loaded!');
          return;
        }
      } catch (e) {
        console.warn('API save fallback for sample project:', e);
      }
      onProjectCreated(sampleProj);
      onSelectProject(sampleProj);
      toast.success('Sample showcase project loaded!');
    } catch (err) {
      toast.error('Could not load sample project');
    } finally {
      setIsCreatingSample(false);
    }
  };

  useEffect(() => {
    setSavedShorts(getAllShortProjects());
  }, []);

  const handleOpenPlayer = (project: Project) => {
    const playerBase = (import.meta.env.VITE_PLAYER_URL || 'http://localhost:4201').replace(/\/+$/, '');
    window.open(`${playerBase}/?projectId=${project.id}`, '_blank');
  };

  const handleOpenShortInStudio = async (short: FormattedShortProject) => {
    try {
      const full = await getShortProject(short.id);
      const effectiveShort = full?.project
        ? {
            ...short,
            ...full.project,
            videoUrl: short.videoUrl || full.project.videoUrl || (full.project as any)?.cloudVideoUrl,
            youtubeSelectedProductId: full.project.youtubeSelectedProductId || short.youtubeSelectedProductId || null,
          }
        : short;
      await loadShortProjectIntoActiveDraft(effectiveShort, full?.blob);
      if (onOpenShort) {
        onOpenShort(effectiveShort);
      }
    } catch (e) {
      if (onOpenShort) {
        onOpenShort(short);
      }
    }
  };

  const handleDeleteShort = (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    setDeletingShortId(shortId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingShortId) return;
    await deleteShortProject(deletingShortId);
    setSavedShorts(getAllShortProjects());
    setDeletingShortId(null);
    toast.success('Short removed from library and cloud', 'Deleted');
  };

  const handleTogglePublish = async (e: React.MouseEvent, short: FormattedShortProject) => {
    e.stopPropagation();
    if (togglingPublishId === short.id) return;
    const willPublish = short.status !== 'PUBLISHED';
    setTogglingPublishId(short.id);
    const result = await setShortPublishedInCloud(short.id, willPublish);
    if (result.success) {
      setSavedShorts((prev) =>
        prev.map((s) =>
          s.id === short.id ? { ...s, status: willPublish ? 'PUBLISHED' : 'DRAFT' } : s,
        ),
      );
      toast.success(willPublish ? 'Short published to About page' : 'Short unpublished from About page', willPublish ? 'Published' : 'Unpublished');
    } else {
      toast.error('Failed to update publish status', 'Error');
    }
    setTogglingPublishId(null);
  };

  const handleDeleteVod = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeletingVodId(projectId);
  };

  const handleConfirmDeleteVod = async () => {
    if (!deletingVodId) return;
    const result = await deleteVodProjectFromCloud(deletingVodId);
    if (result.success) {
      setLocalProjects((prev) => prev.filter((p) => p.id !== deletingVodId));
      if (onDeleteProject) onDeleteProject(deletingVodId);
      toast.success('Project permanently deleted', 'Deleted');
    } else {
      toast.error('Failed to delete project from server', 'Error');
    }
    setDeletingVodId(null);
  };

  const isScriptProject = (proj: Project): boolean => {
    return (
      proj.mediaType === 'SCRIPT' ||
      proj.status === 'SCRIPTING' ||
      (!proj.masterVodUrl && !!(proj.metadata as any)?.preproductionScript)
    );
  };

  const isShortProject = (proj: Project): boolean => {
    if (isScriptProject(proj)) return false;
    return (
      proj.mediaType === 'SHORT' ||
      (proj.masterVodUrl ? proj.masterVodUrl.includes('/shorts/') || proj.masterVodUrl.includes('_SHORT') : false) ||
      proj.channel === 'shorts'
    );
  };

  const scriptProjects = localProjects.filter((p) => isScriptProject(p));
  const vodProjects = localProjects.filter((p) => !isShortProject(p) && !isScriptProject(p));
  const shortProjects = localProjects.filter((p) => isShortProject(p));
  const totalCount = localProjects.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Header */}
      <div className="surface-panel">
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="var(--accent-teal)" />
              <span>Shoppable Video & Shorts Catalog</span>
              <span className="badge badge--teal" style={{ fontSize: '12px' }}>
                {totalCount} Projects
              </span>
            </div>
            <div className="panel-desc">
              Manage interactive 16:9 shoppable video catalogs and viral 9:16 Shorts in one unified hub.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`btn ${categoryFilter === 'ALL' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('VOD')}
                className={`btn ${categoryFilter === 'VOD' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Film size={12} />
                <span>16:9 VODs ({vodProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('SHORTS')}
                className={`btn ${categoryFilter === 'SHORTS' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Sparkles size={12} />
                <span>9:16 Shorts ({shortProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('SCRIPTS')}
                className={`btn ${categoryFilter === 'SCRIPTS' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <FileText size={12} color="#38bdf8" />
                <span>Scripts ({scriptProjects.length})</span>
              </button>
            </div>

            {onOpenPreProduction && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenPreProduction()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                }}
              >
                <Smartphone size={15} />
                <span>Script & Prompter</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsWizardOpen(true)}
            >
              <Plus size={16} />
              <span>New Video Project</span>
            </button>
          </div>
        </div>

        {/* Project Grid or Sleek Center CTA */}
        {localProjects.filter((proj) => {
          if (categoryFilter === 'VOD') return !isShortProject(proj) && !isScriptProject(proj);
          if (categoryFilter === 'SHORTS') return isShortProject(proj);
          if (categoryFilter === 'SCRIPTS') return isScriptProject(proj);
          return true;
        }).length === 0 ? (
          <div
            style={{
              margin: '36px auto',
              maxWidth: '680px',
              padding: '48px 36px',
              background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.75) 0%, rgba(10, 15, 29, 0.95) 100%)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(16px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Film size={28} color="#818cf8" strokeWidth={1.8} />
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#f8fafc',
                margin: '0 0 10px 0',
              }}
            >
              {categoryFilter === 'SCRIPTS'
                ? 'Create Your First Script & Pitch'
                : categoryFilter === 'SHORTS'
                ? 'Create Your First Shoppable Short'
                : categoryFilter === 'VOD'
                ? 'Create Your First Interactive 16:9 Video'
                : 'Create Your First Shoppable Video'}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: 1.6,
                maxWidth: '460px',
                margin: '0 0 28px 0',
              }}
            >
              {categoryFilter === 'SCRIPTS'
                ? 'Select catalog products, generate AI pitch scripts with shoppable cues, and shoot with the zero eye-line drift mobile prompter.'
                : categoryFilter === 'SHORTS'
                ? 'Transform vertical video with AI captions, dynamic animated product cards, and instant mobile checkout.'
                : categoryFilter === 'VOD'
                ? 'Upload a 16:9 master video to place frame-accurate product hotspots, interactive overlays, and synchronized drawers.'
                : 'Upload a 16:9 master video, format a viral 9:16 short, or start from a showcase sample to begin placing frame-accurate product hotspots.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  padding: '11px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Plus size={16} strokeWidth={2.2} />
                <span>Create Video Project</span>
              </button>

              {onOpenPreProduction && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenPreProduction()}
                  style={{
                    padding: '11px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                  }}
                >
                  <Smartphone size={15} />
                  <span>Script & Prompter</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCreateSampleShowcase}
                disabled={isCreatingSample}
                style={{
                  padding: '11px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-hairline)',
                  color: '#e2e8f0',
                }}
              >
                {isCreatingSample ? (
                  <Loader2 size={15} className="spinner" />
                ) : (
                  <Sparkles size={15} color="#38bdf8" />
                )}
                <span>{isCreatingSample ? 'Loading Demo...' : 'Load Showcase Sample'}</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginTop: '36px',
                width: '100%',
                borderTop: '1px solid var(--border-hairline)',
                paddingTop: '24px',
                textAlign: 'left',
              }}
            >
              <div
                onClick={() => onOpenPreProduction?.()}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  cursor: onOpenPreProduction ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                  <Smartphone size={13} />
                  <span>Script & Prompter</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                  AI recipe prep, stage cues & mobile teleprompter.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#93c5fd', fontSize: '12px', fontWeight: 600 }}>
                  <Film size={13} />
                  <span>16:9 VOD</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  Frame-synced hotspots, product drawers & interactive player.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#c084fc', fontSize: '12px', fontWeight: 600 }}>
                  <Sparkles size={13} />
                  <span>9:16 Shorts</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  Viral captions, mobile shopping drawer & multi-platform publish.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#f472b6', fontSize: '12px', fontWeight: 600 }}>
                  <Radio size={13} />
                  <span>Live Stream</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  Real-time product drops, stream overlays & viewer checkout.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
              marginTop: '16px',
            }}
          >
            {localProjects
              .filter((proj) => {
                if (categoryFilter === 'VOD') return !isShortProject(proj) && !isScriptProject(proj);
                if (categoryFilter === 'SHORTS') return isShortProject(proj);
                if (categoryFilter === 'SCRIPTS') return isScriptProject(proj);
                return true;
              })
              .map((proj) => {
                const isScript = isScriptProject(proj);
                const isShort = isShortProject(proj);
                const pinCount = proj.productGroups?.length || 0;
                const basketCount = proj.baskets?.length || 0;
                const thumbSrc = getResolvedThumbnailUrl(proj.thumbnailUrl);

                const handleCardClick = () => {
                  if (isScript && onOpenPreProduction) {
                    onOpenPreProduction(proj);
                  } else {
                    onSelectProject(proj);
                  }
                };

                return (
                  <div
                    key={proj.id}
                    style={{
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {/* Thumbnail / Preview Area */}
                    <div
                      style={{
                        height: '180px',
                        position: 'relative',
                        background: '#0a0f1d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={handleCardClick}
                    >
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={proj.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            color: isScript ? '#38bdf8' : 'var(--text-muted)',
                          }}
                        >
                          {isScript ? (
                            <>
                              <FileText size={36} color="#38bdf8" />
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>Script & Prompter</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Shoot on phone when ready</span>
                            </>
                          ) : isShort ? (
                            <>
                              <Smartphone size={36} color="var(--accent-teal)" />
                              <span style={{ fontSize: '12px' }}>9:16 Short Video</span>
                            </>
                          ) : (
                            <>
                              <Play size={32} color="var(--accent-teal)" />
                              <span style={{ fontSize: '12px' }}>Interactive Video Stream</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Media Type Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: isScript
                            ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                            : isShort
                            ? 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)'
                            : 'rgba(0,0,0,0.75)',
                          boxShadow: isScript
                            ? '0 2px 8px rgba(2, 132, 199, 0.4)'
                            : isShort
                            ? '0 2px 8px rgba(99, 102, 241, 0.4)'
                            : undefined,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {isScript ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={11} /> Pre-Production
                          </span>
                        ) : isShort ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} /> 9:16 Short
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Film size={11} /> 16:9 VOD
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background:
                            proj.status === 'READY'
                              ? 'rgba(16, 185, 129, 0.9)'
                              : isScript || proj.status === 'SCRIPTING'
                              ? 'rgba(56, 189, 248, 0.9)'
                              : 'rgba(255, 184, 0, 0.9)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#000',
                        }}
                      >
                        {proj.status === 'READY'
                          ? 'Published'
                          : isScript || proj.status === 'SCRIPTING'
                          ? 'Scripting'
                          : 'Draft'}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      <div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.4,
                            cursor: 'pointer',
                          }}
                          onClick={handleCardClick}
                        >
                          {proj.name}
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            margin: '4px 0 0 0',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {proj.description ||
                            (isScript
                              ? 'Pre-production script & teleprompter recording setup.'
                              : isShort
                              ? '9:16 Shoppable Short Video.'
                              : 'Interactive shoppable video project.')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Layers size={12} color={isScript ? '#38bdf8' : 'var(--accent-teal)'} />
                          <span>{pinCount} {isScript ? 'Cues' : 'Pins'}</span>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShoppingBag size={12} color="var(--accent-emerald)" />
                          <span>{basketCount} Baskets</span>
                        </div>
                        <div style={{ marginLeft: 'auto', color: isScript ? '#38bdf8' : 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> {isScript ? 'Ready to Shoot' : 'Ready'}
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                        {isScript ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px', color: '#38bdf8' }}
                              onClick={handleCardClick}
                            >
                              <Smartphone size={12} />
                              <span>Mobile Prompter</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', border: 'none' }}
                              onClick={handleCardClick}
                            >
                              <FileText size={12} />
                              <span>Continue Script</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => handleOpenPlayer(proj)}
                            >
                              <Play size={12} />
                              <span>Launch Player</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => onSelectProject(proj)}
                            >
                              <Edit3 size={12} />
                              <span>{isShort ? 'Open in Shorts Studio' : 'Edit Project'}</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)' }}
                          onClick={(e) => handleDeleteVod(e, proj.id)}
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Project Wizard Modal */}
      <ProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        availableProducts={availableProducts}
        onProjectCreated={(newProj) => {
          onProjectCreated(newProj);
          if (newProj.mediaType !== 'SCRIPT' && newProj.status !== 'SCRIPTING') {
            onSelectProject(newProj);
          }
        }}
        onOpenShortStudio={(draftId) => {
          if (onOpenShort) {
            onOpenShort();
          }
        }}
        onOpenLiveStudio={(session) => {
          if (onOpenLiveStudio) {
            onOpenLiveStudio(session);
          }
        }}
        onOpenPreProduction={(createdProj) => {
          if (onOpenPreProduction) {
            onOpenPreProduction(createdProj);
          }
        }}
      />

      {/* Delete Short Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingShortId}
        title="Delete Short Project"
        message="Are you sure you want to delete this short? This action cannot be undone and will remove the video from your device and the cloud."
        confirmText="Delete Short"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingShortId(null)}
      />

      {/* Delete VOD Project Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingVodId}
        title="Delete Project"
        message="Are you sure you want to permanently delete this project? This will remove it from the cloud and cannot be undone."
        confirmText="Delete Project"
        variant="danger"
        onConfirm={handleConfirmDeleteVod}
        onClose={() => setDeletingVodId(null)}
      />
    </div>
  );
}
