import { 
  Film, 
  Sparkles, 
  HelpCircle, 
  Share2, 
  Save, 
  Radio, 
  Target, 
  FolderGit2, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';

export type StudioTab = 'projects' | 'vod' | 'products' | 'live' | 'campaigns' | 'clips' | 'quiz';

interface HeaderProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  project: Project;
  onSave: () => void;
  onOpenDeploy: () => void;
  isSaving: boolean;
  onNewProject: () => void;
  onOpenAuth: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  project,
  onSave,
  onOpenDeploy,
  isSaving,
  onNewProject,
  onOpenAuth,
}: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="studio-header">
      <div className="header-inner" style={{ flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand & Project Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            className="brand-badge"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('projects')}
          >
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('projects')}
            title="Click to view all projects"
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.name || 'Untitled Project'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ({project.productGroups?.length || 0} Pins)
            </span>
            <ChevronDown size={13} color="var(--text-muted)" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="studio-tabs" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <button
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderGit2 size={14} />
            <span>Projects</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'vod' ? 'active' : ''}`}
            onClick={() => setActiveTab('vod')}
          >
            <Film size={14} />
            <span>Timeline Editor</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={14} color={activeTab === 'products' ? 'var(--accent-teal)' : undefined} />
            <span>Products</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Radio size={14} color={activeTab === 'live' ? 'var(--accent-red)' : undefined} />
            <span>Livestream Hub</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <Target size={14} />
            <span>Campaigns</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'clips' ? 'active' : ''}`}
            onClick={() => setActiveTab('clips')}
          >
            <Sparkles size={14} />
            <span>AI Shorts (9:16)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={14} />
            <span>Quizzes</span>
          </button>
        </div>

        {/* Actions, User Auth & CDN Status */}
        <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="pill-status" title="Cloudflare R2 Edge CDN Active">
            <span className="pill-dot online" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>R2 EDGE</span>
          </div>

          {activeTab === 'vod' && (
            <>
              <button className="btn btn-secondary" onClick={onNewProject} title="Start New Project" style={{ padding: '6px 10px', fontSize: '12px' }}>
                <span>New</span>
              </button>

              <button className="btn btn-secondary" onClick={onSave} disabled={isSaving} style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Save size={13} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button className="btn btn-primary" onClick={onOpenDeploy} style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Share2 size={13} />
                <span>Deploy & Embed</span>
              </button>
            </>
          )}

          {/* User Authentication Menu */}
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName || user.email.split('@')[0]}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--accent-teal)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenAuth}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
