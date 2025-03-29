"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { renderResumeTemplate } from '@/lib/resume-template-renderer';
import { ArrowLeft, Download, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ResumePreviewPage() {
  const [resume, setResume] = useState<any | null>(null);
  const [template, setTemplate] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string>('');
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Get the resume ID from URL params
  const resumeId = params.id as string;
  
  // Fetch resume and template data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!resumeId) {
          setError('Invalid resume ID');
          return;
        }
        
        // Fetch resume data
        const { data: resumeData, error: resumeError } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();
        
        if (resumeError) throw resumeError;
        
        // Verify user has access to this resume (must be owner or resume is public)
        if (user && user.id !== resumeData.user_id && !resumeData.is_public) {
          setError('You do not have permission to view this resume');
          return;
        }
        
        setResume(resumeData);
        
        // Fetch template data
        const { data: templateData, error: templateError } = await supabase
          .from('resume_templates')
          .select('*')
          .eq('id', resumeData.template_id)
          .single();
        
        if (templateError) {
          console.error('Error fetching template:', templateError);
          // Try to use a default template instead
          const { data: defaultTemplate, error: defaultError } = await supabase
            .from('resume_templates')
            .select('*')
            .eq('is_public', true)
            .limit(1)
            .single();
          
          if (defaultError) throw defaultError;
          setTemplate(defaultTemplate);
        } else {
          setTemplate(templateData);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load resume data');
        toast({
          title: "Error",
          description: "Failed to load resume data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [resumeId, user, supabase, toast]);
  
  // Generate HTML when resume and template are loaded
  useEffect(() => {
    if (resume && template) {
      try {
        const renderedHtml = renderResumeTemplate(template, resume);
        setHtml(renderedHtml);
      } catch (err: any) {
        console.error('Error rendering template:', err);
        setError(err.message || 'Failed to render resume');
      }
    }
  }, [resume, template]);
  
  // Handle export button click
  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    try {
      setError(null);
      
      const response = await fetch('/api/resumes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          templateId: template.id,
          format,
          filename: `${resume.personalInfo.firstName}-${resume.personalInfo.lastName}-Resume`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a link to download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personalInfo.firstName}-${resume.personalInfo.lastName}-Resume.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Your resume has been exported as ${format.toUpperCase()}.`,
      });
    } catch (err: any) {
      console.error('Error exporting resume:', err);
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export resume. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href="/dashboard/resumes">Back to Resumes</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/dashboard/resumes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{resume.title}</h1>
            <p className="text-muted-foreground">Preview your resume</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {user && user.id === resume.user_id && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/resumes/${resumeId}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Resume
              </Link>
            </Button>
          )}
          
          <Button onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0 h-screen max-h-[800px]">
          {html ? (
            <iframe
              srcDoc={html}
              className="w-full h-full"
              title="Resume Preview"
              id="resume-preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/20 border-t p-4">
          <Button variant="outline" onClick={() => document.getElementById('resume-preview')?.requestFullscreen()}>
            <Eye className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('docx')}>
              <Download className="h-4 w-4 mr-2" />
              DOCX
            </Button>
            <Button variant="outline" onClick={() => handleExport('txt')}>
              <Download className="h-4 w-4 mr-2" />
              TXT
            </Button>
            <Button onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}