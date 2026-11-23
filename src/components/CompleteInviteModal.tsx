import { useState } from 'react';
import { Lock, Eye, EyeOff, User as UserIcon, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CompleteInviteModalProps {
  inviteToken: string;
  initialEmail?: string;
  initialFullName?: string;
  invitedBy?: string;
  role?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CompleteInviteModal({
  inviteToken,
  initialEmail = '',
  initialFullName = '',
  invitedBy = 'ShopVideo Team',
  role = 'PUBLISHER',
  onSuccess,
  onCancel,
}: CompleteInviteModalProps) {
  const { setToken, setUser, setIsNewInviteUser } = useAuth();
  const [fullName, setFullName] = useState(initialFullName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Accept invite and save password on server
      const res = await api.acceptInvite(inviteToken, password, fullName.trim() || undefined);

      if (res.token && res.user) {
        localStorage.setItem('dp_studio_token', res.token);
        localStorage.setItem('dp_studio_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        setIsNewInviteUser(true);
        onSuccess();
      } else {
        throw new Error('Could not establish session.');
      }
    } catch (err: any) {
      console.error('Failed to complete invite onboarding:', err);
      setError(err.message || 'Failed to complete account setup. Please try again or request a new invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
          width: '92%',
          background: 'var(--bg-secondary, #111827)',
          border: '1px solid var(--border-color, #1f2937)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          padding: '32px 28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '14px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px', color: '#f3f4f6' }}>
            Complete Your Account
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
            You've been invited by <strong style={{ color: '#e5e7eb' }}>{invitedBy}</strong> as{' '}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.5px',
              }}
            >
              {role}
            </span>
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Read-only Email display */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
              Account Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={initialEmail}
                disabled
                className="input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9ca3af',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
              Your Name
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rosalind Vance"
                className="input"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color, #1f2937)',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* New Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
              Create Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input"
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 38px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color, #1f2937)',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color, #1f2937)',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>
            💡 You will use this password alongside your email to sign in to ShopVideo Studio whenever you log out.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{ flex: 1, padding: '10px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                'Setting Up...'
              ) : (
                <>
                  Enter Studio <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
