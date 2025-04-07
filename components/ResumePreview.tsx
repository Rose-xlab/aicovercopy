"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { renderResumeTemplate } from '@/lib/resume-template-renderer';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RefreshCw, AlertCircle, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

interface ResumePreviewProps {
  resume: ResumeData;
  template: ResumeTemplate | null;
  height?: string;
  responsiveHeight?: boolean;
  defaultZoom?: number;
  removeCard?: boolean;  // Prop to remove card styling
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resume,
  template,
  height = '510px',
  responsiveHeight = false,
  defaultZoom = 65,
  removeCard = false
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update zoom level when defaultZoom prop changes
  useEffect(() => {
    setZoomLevel(defaultZoom);
  }, [defaultZoom]);
  
  // Generate HTML preview
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!template) {
          setError('Choose Template to preview');
          return;
        }
        
        // Check for required template fields
        if (!template.htmlContent || !template.cssContent) {
          console.error('Invalid template:', template);
          setError('Invalid template format');
          return;
        }
        
        // Validate resume data has minimum required fields
        if (!resume.personalInfo?.firstName) {
          setError('Please add your personal information to see a preview');
          return;
        }
        
        // Render the resume with the selected template
        const renderedHtml = renderResumeTemplate(template, resume);
        setRenderedHtml(renderedHtml);
      } catch (err: any) {
        console.error('Error generating preview:', err);
        setError(err.message || 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePreview();
  }, [resume, template, retryCount]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
  };
  
  // Handle fullscreen preview
  const handleFullscreenPreview = () => {
    try {
      const container = containerRef.current;
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(65);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`flex justify-center items-center ${!removeCard ? 'border rounded-md bg-muted/20' : ''}`}
        style={{ height }}
      >
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className={`flex justify-center items-center ${!removeCard ? 'border rounded-md bg-muted/20' : ''}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <Alert className="mb-3">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Retry</span>
          </Button>
        </div>
      </div>
    );
  }
  
  // Main render - with or without card based on prop
  return (
    <div className={removeCard ? '' : 'space-y-1'}>
      <div 
        className={!removeCard ? 'border rounded-md overflow-hidden' : ''}
        style={{ height }}
      >
        <div 
          ref={containerRef}
          id="resume-preview-container" 
          className="w-full h-full overflow-auto flex justify-center bg-gray-100"
        >
          {/* Container for the resume with zoom scaling */}
          <div 
            className="my-3 bg-white shadow-md"
            style={{ 
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: '8.5in', // Standard US Letter width
              minHeight: '11in', // Standard US Letter height
            }}
          >
            {/* Use iframe for isolated CSS rendering */}
            <iframe
              ref={iframeRef}
              srcDoc={renderedHtml}
              title="Resume Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '11in',
              }}
              className="block"
            />
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 40}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="h-8 px-2"
          >
            <span className="text-xs">{zoomLevel}%</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 150}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        {!removeCard && (
          <Button variant="outline" size="sm" onClick={handleFullscreenPreview} className="h-7">
            <Maximize2 className="h-3 w-3 mr-1" />
            <span className="text-xs">Expand</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;