import React, { useState } from 'react';
import { X, Video, UploadCloud, Link as LinkIcon, Sparkles, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';

interface ProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export default function ProjectWizardModal({
  isOpen,
  onClose,
  onProjectCreated,
}: ProjectWizardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & SaaS');
  const [sourceType, setSourceType] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState(
    'https://pub-2af6e082fcb44c58add86361dad9d14b.r2.dev/raw_videos/opportunity_os_showcase.mp4'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newProjectData: Partial<Project> = {
        name,
        description,
        category,
        masterVodUrl: videoUrl,
        hlsManifestUrl: videoUrl.endsWith('.m3u8') ? videoUrl : undefined,
        status: 'READY',
        isActive: true,
        productGroups: [],
        baskets: [],
      };

      const created = await api.saveProject(newProjectData);
      onProjectCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '560px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={20} color="var(--accent-teal)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              New Shoppable Video Project
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Project Title *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. ATS Autofill Engine Walkthrough"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Video Ingest Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setSourceType('url')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: sourceType === 'url' ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-canvas)',
                  border: `1px solid ${sourceType === 'url' ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
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
                <span>R2 / Video URL</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('upload')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: sourceType === 'upload' ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-canvas)',
                  border: `1px solid ${sourceType === 'upload' ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
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
                <span>Cloudflare R2 Direct</span>
              </button>
            </div>

            <input
              type="url"
              className="input-field"
              placeholder="https://pub-...r2.dev/video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Supports MP4, WebM, and HLS .m3u8 adaptive bitrate manifests.
            </span>
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Project Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Optional overview of the shoppable products and video content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Creating Project...' : 'Create & Open Studio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
