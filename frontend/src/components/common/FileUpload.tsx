// File upload component with validation — MInT IMS Design System
import React, { useRef, useState } from 'react';
import { validateDocumentFile } from '../../utils/validation';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  helperText?: string;
  currentFile?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.docx',
  onChange,
  error,
  required = false,
  helperText,
  currentFile,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setValidationError('');

    if (file) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        onChange(null);
        return;
      }
    }

    onChange(file);
  };

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setValidationError('');
    onChange(null);
  };

  const displayError = error || validationError;
  const inputId = `file-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
        {label}
        {required && <span className="text-eth-red ml-1">*</span>}
      </label>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
        />

        <label
          htmlFor={inputId}
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 h-[38px] border rounded-lg text-body-sm font-medium transition-all
            ${displayError
              ? 'border-eth-red text-eth-red bg-status-rejected-bg hover:bg-status-rejected-bg/80'
              : 'border-border-default text-text-primary bg-white hover:bg-mint-pale hover:border-mint-blue'
            }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {currentFile ? 'Change File' : 'Choose File'}
        </label>

        {currentFile && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-eth-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-body-sm text-status-approved-text font-medium max-w-[180px] truncate">
              {currentFile.name}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-status-approved-text/60 hover:text-eth-red transition-colors ml-1"
              aria-label="Remove file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-eth-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-caption text-eth-red">{displayError}</p>
        </div>
      )}
      {helperText && !displayError && (
        <p className="mt-1 text-caption text-text-muted">{helperText}</p>
      )}
    </div>
  );
};
