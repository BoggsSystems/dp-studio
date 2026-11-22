import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  CreditCard, 
  UserPlus, 
  HelpCircle, 
  Share2, 
  LogOut, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { User } from '../types';

interface AccountMenuProps {
  user: User;
  logout: () => void;
  onOpenBilling: () => void;
  onOpenInvite?: () => void;
  onOpenIntro?: () => void;
  onOpenDeploy?: () => void;
}

export default function AccountMenu({
  user,
  logout,
  onOpenBilling,
  onOpenInvite,
  onOpenIntro,
  onOpenDeploy,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idToCopy = user.id || user.email;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const displayName = user.fullName || user.email.split('@')[0];
  const initial = (user.fullName || user.email).charAt(0).toUpperCase();

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Account Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Open Account Menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '4px 10px',
          background: isOpen ? 'var(--bg-surface-elevated)' : 'var(--bg-canvas)',
          border: isOpen ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
        }}
      >
        {/* Avatar */}
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
            flexShrink: 0,
          }}
        >
          {initial}
        </div>

        {/* Name & Role */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              maxWidth: '110px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: '9px',
              color: 'var(--accent-teal)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}
          >
            {user.role}
          </span>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          size={13}
          color="var(--text-muted)"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '2px',
          }}
        />
      </button>

      {/* Account Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '290px',
            backgroundColor: '#0c121e',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 1000,
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header: User Profile Card */}
          <div
            style={{
              padding: '16px 16px 12px 16px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(12, 18, 30, 0) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)',
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(20, 184, 166, 0.15)',
                      color: '#2dd4bf',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      fontWeight: 700,
                    }}
                  >
                    {user.role}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                  title={user.email}
                >
                  {user.email}
                </div>
              </div>
            </div>

            {/* Publisher / User ID Row */}
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={12} color="#38bdf8" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  ID: {user.id ? `${user.id.substring(0, 12)}...` : 'demo-publisher'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy User ID for API & SDK embeds"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: copiedId ? '#10b981' : 'var(--text-muted)',
                  fontSize: '10px',
                }}
              >
                {copiedId ? (
                  <>
                    <Check size={11} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cloud & Edge Status Badge */}
          <div
            style={{
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(17, 24, 39, 0.5)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>R2 Edge CDN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontWeight: 600, fontSize: '10px' }}>
              <Zap size={11} />
              <span>92 EDGE Quota</span>
            </div>
          </div>

          {/* Quick Action Navigation Menu */}
          <div style={{ padding: '6px' }}>
            {/* Plans & Billing */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenBilling();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <CreditCard size={15} color="#38bdf8" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>Plans & Billing</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Manage subscription & invoices</div>
              </div>
            </button>

            {/* Invite Collaborator */}
            {onOpenInvite && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenInvite();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <UserPlus size={15} color="var(--accent-teal, #14b8a6)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Invite Collaborators</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Add team members via email</div>
                </div>
              </button>
            )}

            {/* Deploy & Embed */}
            {onOpenDeploy && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDeploy();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Share2 size={15} color="#818cf8" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Deploy & Embed</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Get player scripts & React snippets</div>
                </div>
              </button>
            )}

            {/* Guided Tour */}
            {onOpenIntro && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenIntro();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <HelpCircle size={15} color="var(--text-secondary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Studio Tour & Guide</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Revisit interactive onboarding</div>
                </div>
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(148, 163, 184, 0.12)' }} />

          {/* Sign Out Footer */}
          <div style={{ padding: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#f87171',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
