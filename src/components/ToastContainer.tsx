import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toast, ToastItem } from '../services/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updated) => {
      setToasts(updated);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        const borderColor = isSuccess
          ? '#10B981'
          : isError
          ? '#EF4444'
          : isWarning
          ? '#F59E0B'
          : '#3B82F6';

        const bgColor = isSuccess
          ? 'rgba(6, 78, 59, 0.95)'
          : isError
          ? 'rgba(127, 29, 29, 0.95)'
          : isWarning
          ? 'rgba(120, 53, 15, 0.95)'
          : 'rgba(17, 24, 39, 0.95)';

        const IconComponent = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : isWarning
          ? AlertTriangle
          : Info;

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              color: '#fff',
              animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <IconComponent size={20} color={borderColor} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title && (
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                  {t.title}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                {t.message}
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
