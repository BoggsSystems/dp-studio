import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Edit3,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Send,
  Video,
  Share2,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { toast } from '../services/toast';
import { FormattedShortProject } from '../types';
import {
  getAllShortProjects,
  deleteShortProject,
  loadShortProjectIntoActiveDraft,
  getShortProject,
  fetchCloudLibraryShorts,
} from '../services/videoStorage';

interface SavedShortsManagerProps {
  onOpenInStudio: (short: FormattedShortProject) => void;
  onNewShort: () => void;
}

export default function SavedShortsManager({ onOpenInStudio, onNewShort }: SavedShortsManagerProps) {
  const [shorts, setShorts] = useState<FormattedShortProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadShorts = async () => {
    // 1. Instant local read
    const localList = getAllShortProjects();
    setShorts(localList);

    // 2. Authoritative cloud library merge & local draft cleanup
    try {
      const cloudList = await fetchCloudLibraryShorts('opportunity-system');
      if (cloudList && cloudList.length > 0) {
        const cloudIds = new Set(cloudList.map((c) => c.id));
        const cloudClientIds = new Set(cloudList.map((c) => c.clientShortId).filter(Boolean));
        const cloudTitles = new Set(cloudList.map((c) => (c.title || '').trim().toLowerCase()));

        // Keep only local drafts that do NOT exist in the cloud library
        const uniqueLocal = localList.filter((local) => {
          if (!local || !local.id) return false;
          if (cloudIds.has(local.id)) return false;
          if (local.clientShortId && cloudClientIds.has(local.clientShortId)) return false;
          if (cloudClientIds.has(local.id)) return false;
          const normTitle = (local.title || '').trim().toLowerCase();
          if (normTitle && cloudTitles.has(normTitle)) return false;
          return true;
        });

        // Clean up stale local storage so duplicate drafts are permanently eliminated
        if (uniqueLocal.length !== localList.length) {
          localStorage.setItem('digitpop_saved_shorts_library_v1', JSON.stringify(uniqueLocal));
        }

        const merged = [...cloudList, ...uniqueLocal].sort((a, b) => {
          const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return tB - tA;
        });

        setShorts(merged);
      }
    } catch (e) {
      console.warn('Could not fetch cloud library shorts:', e);
    }
  };

  useEffect(() => {
    loadShorts();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteShortProject(deletingId);
    loadShorts();
    setDeletingId(null);
    toast.success('Short project deleted', 'Deleted');
  };

  const handleEdit = async (short: FormattedShortProject) => {
    setLoadingId(short.id);
    try {
      const full = await getShortProject(short.id);
      await loadShortProjectIntoActiveDraft(short, full?.blob);
      onOpenInStudio(short);
    } catch (e) {
      console.error('Failed to load short into studio:', e);
      onOpenInStudio(short);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredShorts = shorts.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.editableTranscript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.productTitle && s.productTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'PUBLISHED') {
      return matchesSearch && (s.status === 'PUBLISHED' || !!s.publishedYouTubeUrl);
    }
    if (filterStatus === 'DRAFT') {
      return matchesSearch && s.status !== 'PUBLISHED' && !s.publishedYouTubeUrl;
    }
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Toolbar */}
      <div className="surface-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              <Video size={20} color="var(--accent-teal)" />
              <span>My Shorts & Published Library</span>
              <span className="badge badge--teal" style={{ fontSize: '12px' }}>
                {shorts.length} Total Shorts
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              Manage, edit, re-publish, and track your 9:16 shoppable viral shorts across YouTube and social channels.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`btn ${filterStatus === 'ALL' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                All ({shorts.length})
              </button>
              <button
                onClick={() => setFilterStatus('PUBLISHED')}
                className={`btn ${filterStatus === 'PUBLISHED' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                🟢 Published ({shorts.filter((s) => s.status === 'PUBLISHED' || !!s.publishedYouTubeUrl).length})
              </button>
              <button
                onClick={() => setFilterStatus('DRAFT')}
                className={`btn ${filterStatus === 'DRAFT' ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
              >
                📝 Drafts ({shorts.filter((s) => s.status !== 'PUBLISHED' && !s.publishedYouTubeUrl).length})
              </button>
            </div>

            <button
              onClick={onNewShort}
              className="btn btn--primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
              }}
            >
              <Plus size={16} />
              <span>Create New Short</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '16px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, transcript keywords, or featured products..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* Shorts Grid */}
      {filteredShorts.length === 0 ? (
        <div
          className="surface-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 184, 0, 0.1)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={28} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {searchQuery ? 'No matching shorts found' : 'No saved shorts yet'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px' }}>
            {searchQuery
              ? 'Try adjusting your search terms or filter.'
              : 'Create your first 9:16 short with kinetic subtitles, layout framing, and 1-click shoppable checkout.'}
          </div>
          {!searchQuery && (
            <button onClick={onNewShort} className="btn btn--primary" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Create Your First Short
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredShorts.map((short) => {
            const isPublished = short.status === 'PUBLISHED' || !!short.publishedYouTubeUrl;

            return (
              <div
                key={short.id}
                onClick={() => handleEdit(short)}
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-teal)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 9:16 Aspect Thumbnail Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    background: '#0a0f1d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {short.thumbnailUrl ? (
                    <img
                      src={short.thumbnailUrl}
                      alt={short.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Video size={36} />
                      <div style={{ fontSize: '11px', marginTop: '6px' }}>9:16 Short Video</div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />

                  {/* Badges Top Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      right: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: isPublished ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 184, 0, 0.9)',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isPublished ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {isPublished ? 'Published' : 'Draft'}
                    </span>

                    {short.durationSeconds && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                        }}
                      >
                        {Math.floor(short.durationSeconds / 60)}:
                        {String(Math.floor(short.durationSeconds % 60)).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Center Play / Edit Hover Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <Edit3 size={20} color="#fff" />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                      {short.thumbnailTitle || short.title}
                    </div>
                    {short.editableTranscript && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {short.editableTranscript}
                      </div>
                    )}
                  </div>

                  {/* Tagged Product Pill */}
                  {short.productTitle && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        background: 'rgba(255, 184, 0, 0.08)',
                        border: '1px solid rgba(255, 184, 0, 0.25)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-amber)',
                      }}
                    >
                      <ShoppingBag size={12} />
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {short.productTitle}
                      </span>
                      {short.productPrice !== undefined && (
                        <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#10B981' }}>
                          ${short.productPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* YouTube Published Link */}
                  {short.publishedYouTubeUrl && (
                    <a
                      href={short.publishedYouTubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-teal)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>View Live on YouTube Shorts</span>
                    </a>
                  )}

                  {/* Action Footer */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(short.updatedAt || short.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(short);
                        }}
                        disabled={loadingId === short.id}
                        className="btn btn--primary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {loadingId === short.id ? 'Opening...' : 'Open Studio'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, short.id)}
                        className="btn btn--ghost"
                        style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
                        title="Delete Short"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Short Project"
        message="Are you sure you want to delete this short? This action cannot be undone and will remove the cached video from your device."
        confirmText="Delete Short"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
