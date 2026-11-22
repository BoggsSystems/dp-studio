import { useState } from 'react';
import { 
  Film, 
  Sparkles, 
  HelpCircle, 
  Share2, 
  Save, 
  Radio, 
  FolderGit2, 
  LogIn, 
  User as UserIcon,
  ChevronDown,
  ShoppingBag,
  BarChart3,
  UserPlus,
  CreditCard
} from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import BillingModal from './BillingModal';
import AccountMenu from './AccountMenu';
import { ShopVideoLogo } from './icons/ShopVideoLogo';

export type StudioTab = 'projects' | 'vod' | 'products' | 'live' | 'campaigns' | 'clips' | 'quiz' | 'analytics';

interface HeaderProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  project: Project;
  onSave: () => void;
  onOpenDeploy: () => void;
  isSaving: boolean;
  onNewProject: () => void;
  onOpenAuth: () => void;
  onOpenInvite?: () => void;
  onOpenIntro?: () => void;
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
  onOpenInvite,
  onOpenIntro,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [showBilling, setShowBilling] = useState(false);

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
            <ShopVideoLogo size={36} />
            <div>
              <div className="brand-title">ShopVideo Studio</div>
              <div className="brand-subtitle">shopvideo.tv • Interactive Video Engine</div>
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
            <span>Projects & Hub</span>
          </button>

          {activeTab === 'vod' && (
            <button
              className="tab-btn active"
              onClick={() => setActiveTab('vod')}
            >
              <Film size={14} color="var(--accent-teal)" />
              <span>16:9 VOD Studio</span>
            </button>
          )}

          {activeTab === 'clips' && (
            <button
              className="tab-btn active"
              onClick={() => setActiveTab('clips')}
            >
              <Sparkles size={14} color="#818CF8" />
              <span>9:16 Shorts Studio</span>
            </button>
          )}

          {activeTab === 'live' && (
            <button
              className="tab-btn active"
              onClick={() => setActiveTab('live')}
            >
              <Radio size={14} color="var(--accent-red)" />
              <span>Live Broadcast Deck</span>
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={14} color={activeTab === 'products' ? 'var(--accent-teal)' : undefined} />
            <span>Products</span>
          </button>

          {/* Note: Campaigns and Quizzes temporarily hidden for creator onboarding polish */}

          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={14} color={activeTab === 'analytics' ? 'var(--accent-teal)' : undefined} />
            <span>Analytics</span>
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

          {onOpenIntro && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenIntro}
              title="Studio Tour & Introduction"
              style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <HelpCircle size={13} color="var(--accent-blue, #6366f1)" />
              <span>Tour</span>
            </button>
          )}

          {user && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowBilling(true)}
              title="Manage Subscription & Billing"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderColor: 'rgba(56, 189, 248, 0.3)',
              }}
            >
              <CreditCard size={13} color="#38bdf8" />
              <span>Plans & Billing</span>
            </button>
          )}

          {user && onOpenInvite && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenInvite}
              title="Invite Collaborator via Resend"
              style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <UserPlus size={13} color="var(--accent-teal, #14b8a6)" />
              <span>Invite</span>
            </button>
          )}

          {/* User Authentication Menu */}
          {user ? (
            <AccountMenu
              user={user}
              logout={logout}
              onOpenBilling={() => setShowBilling(true)}
              onOpenInvite={onOpenInvite}
              onOpenIntro={onOpenIntro}
              onOpenDeploy={onOpenDeploy}
            />
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
      {showBilling && <BillingModal onClose={() => setShowBilling(false)} />}
    </header>
  );
}
