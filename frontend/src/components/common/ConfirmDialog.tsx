// Confirmation dialog — MInT IMS Design System
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  icon?: 'warning' | 'danger' | 'info';
}

const ICONS = {
  warning: {
    bg:    'bg-status-pending-bg',
    color: 'text-status-pending-text',
    path: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  },
  danger: {
    bg:    'bg-status-rejected-bg',
    color: 'text-status-rejected-text',
    path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
  info: {
    bg:    'bg-mint-pale',
    color: 'text-mint-navy',
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  variant     = 'primary',
  isLoading   = false,
  icon,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {icon && (() => {
          const cfg = ICONS[icon];
          return (
            <div className={`w-11 h-11 rounded-full ${cfg.bg} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.path} />
              </svg>
            </div>
          );
        })()}

        <p className="text-body-sm text-text-muted leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
