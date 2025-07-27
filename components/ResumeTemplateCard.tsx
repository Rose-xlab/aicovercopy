//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\ResumeTemplateCard.tsx

"use client";

import React from 'react';
import { ResumeData, ResumeTemplate } from '@/types/resume';
import { renderResumeTemplate } from '@/lib/resume-template-renderer';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResumeTemplateCardProps {
  resume: ResumeData;
  template: ResumeTemplate | null;
  width?: string;
  height?: string;
  zoom?: number;
  className?: string;
}

/**
 * ResumeTemplateCard - A component that renders a resume preview with guaranteed margins
 */
const ResumeTemplateCard: React.FC<ResumeTemplateCardProps> = ({
  resume,
  template,
  width = "100%",
  height = "100%",
  zoom = 100,
  className = "",
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [renderedHtml, setRenderedHtml] = React.useState<string>('');

  React.useEffect(() => {
    const renderResume = () => {
      try {
        setLoading(true);
        setError(null);

        if (!template) {
          setError('Please select a template');
          setLoading(false);
          return;
        }

        if (!resume.personalInfo?.firstName) {
          setError('Please add your personal information to see a preview');
          setLoading(false);
          return;
        }

        // Render the resume
        const html = renderResumeTemplate(template, resume);
        setRenderedHtml(html);
      } catch (err: any) {
        console.error('Error rendering resume:', err);
        setError(err.message || 'Failed to render resume');
      } finally {
        setLoading(false);
      }
    };

    renderResume();
  }, [resume, template]);

  // Custom styles to enforce margins
  const wrapperStyles: React.CSSProperties = {
    width,
    height,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    backgroundColor: 'white',
  };

  const contentStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
  };

  const resumeStyles: React.CSSProperties = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    margin: '0 auto',
    padding: '0.5in',
    boxSizing: 'border-box',
    minHeight: '11in',
    width: '8.5in', // Standard US Letter size
    backgroundColor: 'white',
  };

  if (loading) {
    return (
      <div
        style={wrapperStyles}
        className={`flex items-center justify-center ${className}`}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={wrapperStyles}
        className={`flex items-center justify-center p-4 ${className}`}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div style={wrapperStyles} className={className}>
      <div style={contentStyles}>
        <div style={resumeStyles}>
          {/* Use a dedicated iframe to properly isolate CSS */}
          <iframe
            srcDoc={renderedHtml}
            title="Resume Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '11in',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateCard;