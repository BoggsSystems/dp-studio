import { 
  Film, 
  Sparkles, 
  HelpCircle, 
  Share2, 
  Save 
} from 'lucide-react';
import { Project } from '../types';

interface HeaderProps {
  activeTab: 'vod' | 'clips' | 'quiz';
  setActiveTab: (tab: 'vod' | 'clips' | 'quiz') => void;
  project: Project;
  onSave: () => void;
  onOpenDeploy: () => void;
  isSaving: boolean;
  onNewProject: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  project,
  onSave,
  onOpenDeploy,
  isSaving,
  onNewProject,
}: HeaderProps) {
  return (
    <header className="studio-header">
      <div className="header-inner">
        {/* Brand & Project Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="brand-badge">
            <div className="brand-icon">
              <span>DP</span>
            </div>
            <div>
              <div className="brand-title">DigitPop Studio</div>
              <div className="brand-subtitle">AI-Native Shoppable Video Engine</div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* Current Project Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.name || 'Untitled Project'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ({project.productGroups?.length || 0} Pins)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="studio-tabs">
          <button
            className={`tab-btn ${activeTab === 'vod' ? 'active' : ''}`}
            onClick={() => setActiveTab('vod')}
          >
            <Film size={15} />
            <span>Shoppable VOD Timeline</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'clips' ? 'active' : ''}`}
            onClick={() => setActiveTab('clips')}
          >
            <Sparkles size={15} />
            <span>AI Viral Clips (9:16)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={15} />
            <span>Watch-to-Earn Quizzes</span>
          </button>
        </div>

        {/* Actions & CDN Status */}
        <div className="header-actions">
          <div className="pill-status" title="Cloudflare R2 Edge CDN Active">
            <span className="pill-dot online" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>R2 EDGE CDN</span>
          </div>

          <button className="btn btn-secondary" onClick={onNewProject} title="Start New Project">
            <span>New</span>
          </button>

          <button className="btn btn-secondary" onClick={onSave} disabled={isSaving}>
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenDeploy}>
            <Share2 size={14} />
            <span>Deploy & Embed</span>
          </button>
        </div>
      </div>
    </header>
  );
}
