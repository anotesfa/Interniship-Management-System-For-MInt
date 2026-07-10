import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label, error, helperText, leftIcon, rightIcon,
  className = '', id, ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{
          display: 'block', fontSize: 12, fontWeight: 700, color: '#374151',
          marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {label}
          {props.required && <span style={{ color: '#B91C1C', marginLeft: 3, fontWeight: 400, textTransform: 'none' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#8898B4', pointerEvents: 'none', display: 'flex' }}>
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`input-field${error ? ' error' : ''} ${className}`}
          style={{ paddingLeft: leftIcon ? 40 : 14, paddingRight: rightIcon ? 40 : 14 }}
          {...props}
        />
        {rightIcon && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#8898B4', display: 'flex' }}>
            {rightIcon}
          </div>
        )}
      </div>
      {error      && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#B91C1C' }}>{error}</p>}
      {helperText && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#8898B4' }}>{helperText}</p>}
    </div>
  );
};
