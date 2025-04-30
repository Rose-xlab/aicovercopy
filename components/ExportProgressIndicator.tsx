"use client";

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ExportProgressIndicatorProps {
  /**
   * Progress value (0-100)
   */
  progress: number;
  
  /**
   * Current status message
   */
  status: string;
  
  /**
   * Whether the export is complete
   */
  isComplete?: boolean;
  
  /**
   * Whether the export failed
   */
  isError?: boolean;
  
  /**
   * Error message to display if failed
   */
  errorMessage?: string;
  
  /**
   * File format being exported
   */
  format?: string;
  
  /**
   * Callback to retry the export
   */
  onRetry?: () => void;
  
  /**
   * Callback when the indicator is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Whether the indicator has a close button
   */
  dismissable?: boolean;
  
  /**
   * Auto-dismiss after completion (ms, 0 to disable)
   */
  autoDismissDelay?: number;
}

/**
 * A progress indicator component for export operations
 */
const ExportProgressIndicator: React.FC<ExportProgressIndicatorProps> = ({
  progress,
  status,
  isComplete = false,
  isError = false,
  errorMessage = '',
  format = '',
  onRetry,
  onDismiss,
  dismissable = true,
  autoDismissDelay = 5000,
}) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-dismiss logic
  useEffect(() => {
    if (isComplete && !isError && autoDismissDelay > 0 && onDismiss) {
      const id = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      
      setTimeoutId(id);
      
      return () => {
        if (id) clearTimeout(id);
      };
    }
  }, [isComplete, isError, autoDismissDelay, onDismiss]);
  
  // Cancel auto-dismiss on hover
  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };
  
  // Restart auto-dismiss on mouse leave
  const handleMouseLeave = () => {
    if (isComplete && !isError && autoDismissDelay > 0 && onDismiss && !timeoutId) {
      const id = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      
      setTimeoutId(id);
    }
  };
  
  // Get icon based on state
  const getStatusIcon = () => {
    if (isError) return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (isComplete) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };
  
  return (
    <div
      className="rounded-lg border p-4 shadow-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <h4 className="text-sm font-medium">
              {isError ? 'Export Failed' : isComplete ? `${format.toUpperCase()} Ready` : 'Exporting'}
              {!isError && !isComplete && format ? ` as ${format.toUpperCase()}` : ''}
            </h4>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
        </div>
        
        {dismissable && onDismiss && !isError && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss} 
            className="h-8 w-8 p-0 rounded-full"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {!isComplete && !isError && (
        <Progress value={progress} className="h-2 mt-2" />
      )}
      
      {isError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'An error occurred during export. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {(isError || isComplete) && (
        <div className="mt-3 flex gap-2 justify-end">
          {isError && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry} 
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          )}
          
          {isComplete && (
            <Button 
              size="sm" 
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
          )}
          
          {isError && onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportProgressIndicator;