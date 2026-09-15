import React, { useState } from 'react';
import { Plus, Video, Play, Edit3, ExternalLink, Trash2, Layers, ShoppingBag, CheckCircle } from 'lucide-react';
import { Project } from '../types';
import ProjectWizardModal from './ProjectWizardModal';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
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
}: ProjectListProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleOpenPlayer = (project: Project) => {
    const playerBase = (import.meta.env.VITE_PLAYER_URL || 'http://localhost:4201').replace(/\/+$/, '');
    window.open(`${playerBase}/?projectId=${project.id}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Header */}
      <div className="surface-panel">
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="var(--accent-teal)" />
              <span>Shoppable Video Projects</span>
            </div>
            <div className="panel-desc">
              Create and manage interactive video catalogs with sub-second hotspot beacons, multi-product drawers, and AI tagging.
            </div>
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

        {/* Project Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
            marginTop: '8px',
          }}
        >
          {projects.map((proj) => {
            const hotspotCount = proj.productGroups?.length || 0;
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
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-teal)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {proj.category || 'General'}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#fff',
                    }}
                  >
                    {hotspotCount} Hotspots
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div>
                    <h3
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
                    </h3>
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

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--bg-surface)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Layers size={12} color="var(--accent-teal)" />
                      <span>{hotspotCount} Beacons</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--bg-surface)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <ShoppingBag size={12} color="var(--accent-emerald)" />
                      <span>{basketCount} Baskets</span>
                    </div>

                    <div
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent-emerald)',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle size={12} />
                      <span>Ready</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
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
                      <span>Edit Hotspots</span>
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
