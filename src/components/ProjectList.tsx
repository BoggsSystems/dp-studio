import React, { useState, useEffect } from 'react';
import { Plus, Video, Play, Edit3, ExternalLink, Trash2, Layers, ShoppingBag, CheckCircle, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { Project, FormattedShortProject, StreamSession, Product } from '../types';
import ProjectWizardModal from './ProjectWizardModal';
import ConfirmModal from './ConfirmModal';
import { toast } from '../services/toast';
import { getAllShortProjects, getShortProject, loadShortProjectIntoActiveDraft, deleteShortProject, setShortPublishedInCloud, deleteVodProjectFromCloud } from '../services/videoStorage';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenShort?: (short?: FormattedShortProject) => void;
  onOpenLiveStudio?: (session: StreamSession) => void;
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
  availableProducts = [],
}: ProjectListProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VOD' | 'SHORTS'>('ALL');
  const [savedShorts, setSavedShorts] = useState<FormattedShortProject[]>([]);
  const [deletingShortId, setDeletingShortId] = useState<string | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);
  const [deletingVodId, setDeletingVodId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);

  useEffect(() => { setLocalProjects(projects); }, [projects]);

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
      await loadShortProjectIntoActiveDraft(short, full?.blob);
    } catch (e) {}
    if (onOpenShort) {
      onOpenShort(short);
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

  const isShortProject = (proj: Project): boolean => {
    return (
      proj.mediaType === 'SHORT' ||
      (proj.masterVodUrl ? proj.masterVodUrl.includes('/shorts/') || proj.masterVodUrl.includes('_SHORT') : false) ||
      proj.channel === 'shorts'
    );
  };

  const vodProjects = localProjects.filter((p) => !isShortProject(p));
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
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                🎬 16:9 VODs ({vodProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('SHORTS')}
                className={`btn ${categoryFilter === 'SHORTS' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                ⚡ 9:16 Shorts ({shortProjects.length})
              </button>
            </div>

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

        {/* Project Grid */}
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
              if (categoryFilter === 'VOD') return !isShortProject(proj);
              if (categoryFilter === 'SHORTS') return isShortProject(proj);
              return true;
            })
            .map((proj) => {
              const isShort = isShortProject(proj);
              const pinCount = proj.productGroups?.length || 0;
              const basketCount = proj.baskets?.length || 0;
              const thumbSrc = getResolvedThumbnailUrl(proj.thumbnailUrl);

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
                    onClick={() => onSelectProject(proj)}
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
                          color: 'var(--text-muted)',
                        }}
                      >
                        {isShort ? <Smartphone size={36} color="var(--accent-teal)" /> : <Play size={32} color="var(--accent-teal)" />}
                        <span style={{ fontSize: '12px' }}>{isShort ? '9:16 Short Video' : 'Interactive Video Stream'}</span>
                      </div>
                    )}

                    {/* Media Type Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: isShort
                          ? 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)'
                          : 'rgba(0,0,0,0.75)',
                        boxShadow: isShort ? '0 2px 8px rgba(99, 102, 241, 0.4)' : undefined,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isShort ? '#fff' : 'var(--accent-teal)',
                      }}
                    >
                      {isShort ? '⚡ 9:16 Short' : '🎬 16:9 VOD'}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: proj.status === 'READY' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 184, 0, 0.9)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#000',
                      }}
                    >
                      {proj.status === 'READY' ? 'Published' : 'Draft'}
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
                        onClick={() => onSelectProject(proj)}
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
                        {proj.description || (isShort ? '9:16 Shoppable Short Video.' : 'Interactive shoppable video project.')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} color="var(--accent-teal)" />
                        <span>{pinCount} Pins</span>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShoppingBag size={12} color="var(--accent-emerald)" />
                        <span>{basketCount} Baskets</span>
                      </div>
                      <div style={{ marginLeft: 'auto', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Ready
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
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
      </div>

      {/* Project Wizard Modal */}
      <ProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        availableProducts={availableProducts}
        onProjectCreated={(newProj) => {
          onProjectCreated(newProj);
          onSelectProject(newProj);
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
