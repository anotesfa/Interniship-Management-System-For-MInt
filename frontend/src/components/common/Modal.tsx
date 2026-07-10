import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = { sm: 420, md: 560, lg: 720, xl: 960 };

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, children, size = 'md',
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: sizeMap[size] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F2040' }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#8898B4' }}>{subtitle}</p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: '#f0f4fa', border: '1px solid #e8edf5',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4A5568', flexShrink: 0, transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e0e7f0'; e.currentTarget.style.color = '#0F2040'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0f4fa'; e.currentTarget.style.color = '#4A5568'; }}
            aria-label="Close"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
