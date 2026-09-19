import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const accentColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#3B82F6';
  const IconComponent = isDanger ? Trash2 : isWarning ? AlertTriangle : Info;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: isDanger
                ? 'rgba(239, 68, 68, 0.12)'
                : isWarning
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(59, 130, 246, 0.12)',
              border: `1px solid ${isDanger ? 'rgba(239, 68, 68, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={20} color={accentColor} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {title}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {message}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px', color: 'var(--text-muted)', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--bg-canvas)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={isDanger ? 'btn btn-primary' : 'btn btn-primary'}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              background: isDanger
                ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              borderColor: isDanger ? '#EF4444' : '#3B82F6',
              boxShadow: isDanger
                ? '0 4px 14px rgba(239, 68, 68, 0.3)'
                : '0 4px 14px rgba(59, 130, 246, 0.3)',
              color: '#fff',
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
