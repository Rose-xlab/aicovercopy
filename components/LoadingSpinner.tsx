// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};