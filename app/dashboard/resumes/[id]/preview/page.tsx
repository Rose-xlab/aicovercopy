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
import { DEFAULT_RESUME_TEMPLATES } from '@/lib/default-resume-templates';
import { mapDatabaseToResumeData } from '@/lib/resume-mappers'; // Import the mapper function

/**
 * Ensures the resume data has the correct structure expected by the template renderer
 */
const validateResumeData = (resumeData: any) => {
  if (!resumeData) return null;
  
  console.log("Validating resume data:", resumeData);
  
  const validatedResume = { ...resumeData };
  
  // First, check if we have snake_case fields and convert them
  if (validatedResume.personal_info && !validatedResume.personalInfo) {
    console.log("Converting personal_info to personalInfo");
    validatedResume.personalInfo = validatedResume.personal_info;
  }
  
  if (validatedResume.work_experience && !validatedResume.workExperience) {
    console.log("Converting work_experience to workExperience");
    validatedResume.workExperience = validatedResume.work_experience;
  }
  
  if (validatedResume.custom_sections && !validatedResume.customSections) {
    validatedResume.customSections = validatedResume.custom_sections;
  }
  
  // Ensure personalInfo exists and has firstName, lastName
  if (!validatedResume.personalInfo) {
    validatedResume.personalInfo = {
      firstName: validatedResume.title?.split(' ')[0] || 'First',
      lastName: validatedResume.title?.split(' ').slice(1).join(' ') || 'Last',
      title: validatedResume.title || 'Resume',
      contact: { email: '', phone: '', location: '' }
    };
  } else if (!validatedResume.personalInfo.firstName || !validatedResume.personalInfo.lastName) {
    validatedResume.personalInfo = {
      ...validatedResume.personalInfo,
      firstName: validatedResume.personalInfo.firstName || validatedResume.title?.split(' ')[0] || 'First',
      lastName: validatedResume.personalInfo.lastName || validatedResume.title?.split(' ').slice(1).join(' ') || 'Last',
    };
  }
  
  // Ensure contact info exists
  if (!validatedResume.personalInfo.contact) {
    validatedResume.personalInfo.contact = { email: '', phone: '', location: '' };
  }
  
  // Ensure all required arrays exist
  if (!validatedResume.workExperience || !Array.isArray(validatedResume.workExperience)) {
    validatedResume.workExperience = [];
  }
  
  if (!validatedResume.education || !Array.isArray(validatedResume.education)) {
    validatedResume.education = [];
  }
  
  if (!validatedResume.skills || !Array.isArray(validatedResume.skills)) {
    validatedResume.skills = [];
  }
  
  if (!validatedResume.projects || !Array.isArray(validatedResume.projects)) {
    validatedResume.projects = [];
  }
  
  if (!validatedResume.languages || !Array.isArray(validatedResume.languages)) {
    validatedResume.languages = [];
  }
  
  if (!validatedResume.certifications || !Array.isArray(validatedResume.certifications)) {
    validatedResume.certifications = [];
  }
  
  if (!validatedResume.interests || !Array.isArray(validatedResume.interests)) {
    validatedResume.interests = [];
  }
  
  if (!validatedResume.internships || !Array.isArray(validatedResume.internships)) {
    validatedResume.internships = [];
  }
  
  if (!validatedResume.references || !Array.isArray(validatedResume.references)) {
    validatedResume.references = [];
  }
  
  if (!validatedResume.customSections || !Array.isArray(validatedResume.customSections)) {
    validatedResume.customSections = [];
  }
  
  return validatedResume;
};

/**
 * Normalizes a template object to ensure it has the expected properties
 */
const normalizeTemplate = (template: any): any => {
  if (!template) return null;
  
  // Make sure we have htmlContent and cssContent for the renderer
  return {
    ...template,
    // Map database fields to ResumeTemplate fields needed by the renderer
    htmlContent: template.htmlContent || template.html_content || '',
    cssContent: template.cssContent || template.css_content || '',
    // For fallback templates that might use different naming
    id: template.id || 'fallback-template',
    name: template.name || 'Fallback Template',
    description: template.description || 'Basic resume template',
  };
};

/**
 * Creates a fallback template compatible with your renderer
 */
const getFallbackTemplate = () => {
  // Try to use a default template first if available
  if (DEFAULT_RESUME_TEMPLATES && DEFAULT_RESUME_TEMPLATES.length > 0) {
    const defaultTemplate = DEFAULT_RESUME_TEMPLATES[0];
    // Normalize the template properties
    return normalizeTemplate({
      id: defaultTemplate.id,
      name: defaultTemplate.name,
      description: defaultTemplate.description,
      htmlContent: defaultTemplate.htmlContent,
      cssContent: defaultTemplate.cssContent,
    });
  }
  
  // Create a minimal template that works with your renderer
  return normalizeTemplate({
    id: 'fallback-template',
    name: 'Fallback Template',
    description: 'Basic fallback template',
    htmlContent: `
      <div class="container">
        <header>
          <h1>{{name}}</h1>
          <p>{{title}}</p>
          <div>
            <p>{{email}}</p>
            <p>{{phone}}</p>
            <p>{{address}}</p>
          </div>
        </header>
        
        {{professional-summary}}
        {{work-experience}}
        {{education}}
        {{skills}}
        {{projects}}
        {{certifications}}
        {{languages}}
        {{interests}}
        {{references}}
      </div>
    `,
    cssContent: `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        border: 1px solid #ddd;
        padding: 20px;
      }
      
      h1, h2, h3 {
        margin-top: 0;
        color: #2c3e50;
      }
      
      .section-heading {
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
        margin-top: 20px;
        font-size: 18px;
      }
      
      .section-content {
        margin-bottom: 20px;
      }
    `
  });
};

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
        
        // Transform data from database format to UI format
        const mappedResume = mapDatabaseToResumeData(resumeData);
        console.log("Mapped resume data for preview:", mappedResume);
        
        // Validate and fix resume data structure
        const validatedResume = validateResumeData(mappedResume);
        console.log('Validated resume data:', validatedResume);
        setResume(validatedResume);
        
        try {
          // Try to get template from database if template_id exists
          if (resumeData.template_id) {
            // First check resume_templates table
            const { data: templateData, error: templateError } = await supabase
              .from('resume_templates')
              .select('*')
              .eq('id', resumeData.template_id)
              .maybeSingle();
            
            if (!templateError && templateData) {
              console.log('Found template in resume_templates table:', templateData.name);
              setTemplate(normalizeTemplate(templateData));
              return;
            }
            
            // If not found in resume_templates, check templates table
            const { data: oldTemplateData, error: oldTemplateError } = await supabase
              .from('templates')
              .select('*')
              .eq('id', resumeData.template_id)
              .maybeSingle();
            
            if (!oldTemplateError && oldTemplateData) {
              console.log('Found template in templates table:', oldTemplateData.name);
              setTemplate(normalizeTemplate(oldTemplateData));
              return;
            }
          }
          
          // If no template_id or template not found by ID, try to get any template
          
          // Try resume_templates first
          const { data: anyTemplate, error: anyError } = await supabase
            .from('resume_templates')
            .select('*')
            .limit(1)
            .maybeSingle();
          
          if (!anyError && anyTemplate) {
            console.log('Using random template from resume_templates table');
            setTemplate(normalizeTemplate(anyTemplate));
            return;
          }
          
          // Then try templates table
          const { data: anyOldTemplate, error: anyOldError } = await supabase
            .from('templates')
            .select('*')
            .limit(1)
            .maybeSingle();
          
          if (!anyOldError && anyOldTemplate) {
            console.log('Using random template from templates table');
            setTemplate(normalizeTemplate(anyOldTemplate));
            return;
          }
          
          // Use fallback template as last resort
          console.log('Using fallback template');
          setTemplate(getFallbackTemplate());
          
        } catch (templateErr: any) {
          console.error('Error fetching templates:', templateErr);
          // Use fallback template when errors occur
          console.log('Using fallback template after error');
          setTemplate(getFallbackTemplate());
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
        console.log('Rendering template with resume:', resume);
        console.log('Using template:', template);
        const renderedHtml = renderResumeTemplate(template, resume);
        setHtml(renderedHtml);
      } catch (err: any) {
        console.error('Error rendering template:', err);
        setError(`Failed to render resume: ${err.message}`);
        
        // Try to display a simple error page in the iframe
        setHtml(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .error { color: #e53e3e; margin-bottom: 20px; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
            </style>
          </head>
          <body>
            <h1>Error rendering resume template</h1>
            <p class="error">${err.message}</p>
            <pre>${JSON.stringify({
              resumeTitle: resume.title,
              hasPersonalInfo: !!resume.personalInfo,
              personalInfoKeys: resume.personalInfo ? Object.keys(resume.personalInfo) : [],
              templateId: template.id,
              templateName: template.name
            }, null, 2)}</pre>
          </body>
          </html>
        `);
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
          {user && user.id === resume.userId && (
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