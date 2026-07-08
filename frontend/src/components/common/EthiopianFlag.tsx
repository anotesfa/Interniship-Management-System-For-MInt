import React from 'react';

interface EthiopianFlagProps {
  variant?: 'full' | 'accent' | 'header';
  className?: string;
}

export const EthiopianFlag: React.FC<EthiopianFlagProps> = ({ 
  variant = 'full',
  className = '' 
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'accent':
        return 'h-[5px] w-14 rounded-[3px]';
      case 'header':
        return 'h-1 w-full';
      case 'full':
      default:
        return 'h-[5px] w-full';
    }
  };

  return (
    <div className={`eth-flag-stripe ${getStyles()} ${className}`}>
      <div />
      <div />
      <div />
    </div>
  );
};
