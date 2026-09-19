import React, { useState, useEffect } from 'react';
import { Plus, Video, Play, Edit3, ExternalLink, Trash2, Layers, ShoppingBag, CheckCircle, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { Project, FormattedShortProject } from '../types';
import ProjectWizardModal from './ProjectWizardModal';
import { getAllShortProjects, getShortProject, loadShortProjectIntoActiveDraft, deleteShortProject } from '../services/videoStorage';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenShort?: (short: FormattedShortProject) => void;
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
}: ProjectListProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VOD' | 'SHORTS'>('ALL');
  const [savedShorts, setSavedShorts] = useState<FormattedShortProject[]>([]);

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

  const handleDeleteShort = async (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this short project? This cannot be undone.')) {
      await deleteShortProject(shortId);
      setSavedShorts(getAllShortProjects());
    }
  };

  const totalCount = projects.length + savedShorts.length;

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
                🎬 16:9 VODs ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('SHORTS')}
                className={`btn ${categoryFilter === 'SHORTS' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                ⚡ 9:16 Shorts ({savedShorts.length})
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
          {/* 1. Render 16:9 VOD Projects */}
          {categoryFilter !== 'SHORTS' &&
            projects.map((proj) => {
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
                        <Play size={32} color="var(--accent-teal)" />
                        <span style={{ fontSize: '12px' }}>Interactive Video Stream</span>
                      </div>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.75)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--accent-teal)',
                      }}
                    >
                      🎬 16:9 VOD
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
                        {proj.description || 'Interactive shoppable video project.'}
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
                        <span>Edit Project</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* 2. Render 9:16 Shorts Projects */}
          {categoryFilter !== 'VOD' &&
            savedShorts.map((short) => {
              const isPublished = short.status === 'PUBLISHED' || !!short.publishedYouTubeUrl;

              return (
                <div
                  key={short.id}
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
                    onClick={() => handleOpenShortInStudio(short)}
                  >
                    {short.thumbnailUrl ? (
                      <img
                        src={short.thumbnailUrl}
                        alt={short.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Smartphone size={36} color="var(--accent-teal)" />
                        <div style={{ fontSize: '11px', marginTop: '6px' }}>9:16 Short Video</div>
                      </div>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      ⚡ 9:16 Short
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: isPublished ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 184, 0, 0.9)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#000',
                      }}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{short.thumbnailTitle || short.title}</div>
                      {short.productTitle && (
                        <div style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShoppingBag size={11} /> <span>{short.productTitle}</span>
                        </div>
                      )}
                    </div>

                    {short.publishedYouTubeUrl && (
                      <a
                        href={short.publishedYouTubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        <ExternalLink size={12} /> View on YouTube Shorts
                      </a>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => handleOpenShortInStudio(short)}
                      >
                        <Edit3 size={12} />
                        <span>Open in Shorts Studio</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)' }}
                        onClick={(e) => handleDeleteShort(e, short.id)}
                        title="Delete Short Project"
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
        onProjectCreated={(newProj) => {
          onProjectCreated(newProj);
          onSelectProject(newProj);
        }}
      />
    </div>
  );
}
