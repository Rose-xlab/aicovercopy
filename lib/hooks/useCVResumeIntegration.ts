// lib/hooks/useCVResumeIntegration.ts
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createBrowserClient } from '@/lib/supabase';
import { CvFile } from '@/components/CVManager';

/**
 * Hook to manage integration between CVs and resumes
 */
export function useCVResumeIntegration() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const supabase = createBrowserClient();

  /**
   * Get the CV linked to a specific resume
   */
  const getLinkedCV = async (resumeId: string): Promise<CvFile | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          operation: 'get_cv'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch linked CV');
      }
      
      const { success, cv } = await response.json();
      
      if (!success || !cv) {
        return null;
      }
      
      return {
        id: cv.id,
        name: cv.filename,
        size: cv.filesize,
        type: cv.filetype,
        uploadDate: cv.uploaded_at,
        isSelected: cv.is_selected,
        resume_id: cv.resume_id,
        file_url: cv.file_url
      };
    } catch (error) {
      console.error('Error fetching linked CV:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the resume linked to a specific CV
   */
  const getLinkedResume = async (cvId: string): Promise<any | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvId,
          operation: 'get_resume'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch linked resume');
      }
      
      const { success, resume } = await response.json();
      
      if (!success || !resume) {
        return null;
      }
      
      return resume;
    } catch (error) {
      console.error('Error fetching linked resume:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Link a CV to a resume
   */
  const linkCVToResume = async (cvId: string, resumeId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvId,
          resumeId,
          operation: 'link'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link CV to resume');
      }
      
      const { success } = await response.json();
      
      if (success) {
        toast({
          title: "Success",
          description: "CV and resume linked successfully",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error linking CV to resume:', error);
      toast({
        title: "Error",
        description: "Failed to link CV to resume",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unlink a CV from its resume
   */
  const unlinkCV = async (cvId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvId,
          operation: 'unlink'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to unlink CV from resume');
      }
      
      const { success } = await response.json();
      
      if (success) {
        toast({
          title: "Success",
          description: "CV unlinked from resume",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error unlinking CV:', error);
      toast({
        title: "Error",
        description: "Failed to unlink CV from resume",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Import a CV as a resume
   */
  const importCVAsResume = async (cvId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      // First get the CV details
      const { data: cv, error: cvError } = await supabase
        .from('user_cvs')
        .select('*')
        .eq('id', cvId)
        .single();
      
      if (cvError) throw cvError;
      
      if (!cv.file_url) {
        throw new Error('CV file URL not found');
      }
      
      // Fetch the file
      const fileResponse = await fetch(cv.file_url);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch CV file');
      }
      
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], cv.filename, { type: cv.filetype });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', 'cv_upload');
      formData.append('cvId', cvId);
      
      // Send to parser
      const response = await fetch('/api/resumes/parser', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const parsedData = await response.json();
      
      // Create the resume
      const createResponse = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: parsedData,
          source: 'cv_upload',
          sourceCV: cvId
        }),
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create resume from parsed data');
      }
      
      const newResume = await createResponse.json();
      
      toast({
        title: "Success",
        description: "CV imported as resume successfully",
      });
      
      return newResume.id;
    } catch (error) {
      console.error('Error importing CV as resume:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import CV as resume. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getLinkedCV,
    getLinkedResume,
    linkCVToResume,
    unlinkCV,
    importCVAsResume
  };
}