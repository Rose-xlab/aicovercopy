"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { renderResumeTemplate } from "@/lib/resume-template-renderer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Info, RefreshCw, AlertCircle, Eye } from "lucide-react";

interface ResumePreviewProps {
  resume: ResumeData;
  template: ResumeTemplate | null;
  height?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resume,
  template,
  height = '500px'
}) => {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Generate HTML preview
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!template) {
          setError('No template selected');
          return;
        }
        
        if (!resume.personalInfo.firstName) {
          setError('Please add your personal information to see a preview');
          return;
        }
        
        // Render the resume with the selected template
        const renderedHtml = renderResumeTemplate(template, resume);
        
        // Add base styles and responsive meta tag to the HTML
        const enhancedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Resume Preview</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.5;
                font-size: 16px;
              }
              
              * {
                box-sizing: border-box;
              }
              
              /* For printing */
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              
              /* Custom scrollbar for WebKit browsers */
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              
              ::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
              }
              
              ::-webkit-scrollbar-track {
                background-color: rgba(0, 0, 0, 0.05);
              }
            </style>
            ${renderedHtml}
            <script>
              // Add a window loaded event to notify parent when fully loaded
              window.onload = function() {
                if (window.parent) {
                  window.parent.postMessage({ type: 'RESUME_PREVIEW_LOADED' }, '*');
                }
              };
            </script>
          </head>
          <body>
            <div id="resume-container"></div>
          </body>
          </html>
        `;
        
        setHtml(enhancedHtml);
      } catch (err: any) {
        console.error('Error generating preview:', err);
        setError(err.message || 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePreview();
  }, [resume, template, retryCount]);
  
  // Listen for iframe load events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RESUME_PREVIEW_LOADED') {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
  };
  
  // Handle fullscreen preview
  const handleFullscreenPreview = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if ((iframe as any).webkitRequestFullscreen) {
          (iframe as any).webkitRequestFullscreen();
        } else if ((iframe as any).msRequestFullscreen) {
          (iframe as any).msRequestFullscreen();
        }
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };
  
  if (isLoading) {
    return (
      <div 
        className="flex justify-center items-center border rounded-md bg-muted/20"
        style={{ height }}
      >
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className="flex justify-center items-center border rounded-md bg-muted/20"
        style={{ height }}
      >
        <div className="text-center p-4">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-hidden" style={{ height }}>
        <iframe
          ref={iframeRef}
          id="preview-iframe"
          srcDoc={html}
          className="w-full h-full"
          title="Resume Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFullscreenPreview}
          className="text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Full Screen
        </Button>
      </div>
    </div>
  );
};

export default ResumePreview;