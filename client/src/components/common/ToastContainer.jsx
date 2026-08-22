import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        let Icon = Info;
        let bgColor = 'var(--bg-card)';
        let borderColor = 'var(--border-color)';
        let iconColor = 'var(--color-accent)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'rgba(34, 197, 94, 0.4)';
          iconColor = '#22c55e';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'rgba(239, 68, 68, 0.4)';
          iconColor = '#ef4444';
        }

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              color: 'var(--text-main)',
              animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Icon size={20} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                padding: '2px',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
