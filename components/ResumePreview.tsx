"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { renderResumeTemplate } from "@/lib/resume-template-renderer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Info, RefreshCw } from "lucide-react";

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
  
  // Generate HTML preview
  useEffect(() => {
    const generatePreview = () => {
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
        setHtml(renderedHtml);
      } catch (err: any) {
        console.error('Error generating preview:', err);
        setError(err.message || 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePreview();
  }, [resume, template]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        if (!template) {
          setError('No template selected');
          setIsLoading(false);
          return;
        }
        
        const renderedHtml = renderResumeTemplate(template, resume);
        setHtml(renderedHtml);
        setError(null);
      } catch (err: any) {
        console.error('Error refreshing preview:', err);
        setError(err.message || 'Failed to refresh preview');
      } finally {
        setIsLoading(false);
      }
    }, 500);
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
            <Info className="h-4 w-4" />
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
    <div className="border rounded-md overflow-hidden" style={{ height }}>
      <iframe
        id="preview-iframe"
        srcDoc={html}
        className="w-full h-full"
        title="Resume Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default ResumePreview;