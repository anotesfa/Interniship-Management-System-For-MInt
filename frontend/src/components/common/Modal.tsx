// Modal component — MInT IMS Design System
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-mint-navy/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={`relative bg-white rounded-md shadow-level-3 w-full ${sizeClasses[size]} border border-border-default max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-text-primary leading-tight">{title}</h3>
            {subtitle && <p className="text-caption text-text-hint mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-7 h-7 flex items-center justify-center rounded text-text-hint hover:text-text-primary hover:bg-surface-page transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
};