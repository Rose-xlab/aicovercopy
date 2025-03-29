// hooks/useResume.ts
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { 
  ResumeData, 
  DatabaseResumeData,
  mapDatabaseToResumeData, 
  mapResumeToDatabase 
} from '@/types/resume';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface UseResumeOptions {
  onSuccess?: (data: ResumeData) => void;
  onError?: (error: Error) => void;
}

export function useResume(options: UseResumeOptions = {}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const supabase = createBrowserClient();
  const { toast } = useToast();

  /**
   * Fetch a resume by its ID
   */
  const getResume = async (id: string): Promise<ResumeData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        return null;
      }

      // Map from snake_case DB fields to camelCase app fields
      const mappedResume = mapDatabaseToResumeData(data as DatabaseResumeData);
      setResume(mappedResume);
      
      if (options.onSuccess) {
        options.onSuccess(mappedResume);
      }
      
      return mappedResume;
    } catch (err: any) {
      console.error('Error fetching resume:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to load resume. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch all resumes for the current user
   */
  const getUserResumes = async (): Promise<ResumeData[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Map all results from snake_case to camelCase
      const mappedResumes = (data as DatabaseResumeData[]).map(mapDatabaseToResumeData);
      
      return mappedResumes;
    } catch (err: any) {
      console.error('Error fetching user resumes:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to load resumes. Please try again.",
        variant: "destructive",
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new resume
   */
  const createResume = async (resumeData: Omit<ResumeData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ResumeData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Create a new resume with generated ID and timestamps
      const newResume: ResumeData = {
        ...resumeData,
        id: uuidv4(),
        userId: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Convert to database format (snake_case)
      const dbResume = mapResumeToDatabase(newResume);

      const { data, error } = await supabase
        .from('resumes')
        .insert(dbResume)
        .select()
        .single();

      if (error) throw error;

      // Convert the returned data back to application format
      const createdResume = mapDatabaseToResumeData(data as DatabaseResumeData);
      setResume(createdResume);
      
      toast({
        title: "Success",
        description: "Resume created successfully",
      });
      
      if (options.onSuccess) {
        options.onSuccess(createdResume);
      }
      
      return createdResume;
    } catch (err: any) {
      console.error('Error creating resume:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to create resume. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing resume
   */
  const updateResume = async (resumeData: ResumeData): Promise<ResumeData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure the user is authorized to update this resume
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      if (resumeData.userId !== session.user.id) {
        throw new Error('Unauthorized to update this resume');
      }

      // Update the timestamp
      const updatedResume: ResumeData = {
        ...resumeData,
        updatedAt: new Date().toISOString()
      };

      // Convert to database format
      const dbResume = mapResumeToDatabase(updatedResume);

      const { data, error } = await supabase
        .from('resumes')
        .update(dbResume)
        .eq('id', resumeData.id)
        .select()
        .single();

      if (error) throw error;

      // Convert the returned data back to application format
      const result = mapDatabaseToResumeData(data as DatabaseResumeData);
      setResume(result);
      
      toast({
        title: "Success",
        description: "Resume updated successfully",
      });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error updating resume:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to update resume. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a resume by ID
   */
  const deleteResume = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure the user is authorized to delete this resume
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // First verify the resume belongs to the user
      const { data: resumeToDelete, error: fetchError } = await supabase
        .from('resumes')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      
      if (resumeToDelete.user_id !== session.user.id) {
        throw new Error('Unauthorized to delete this resume');
      }

      // Delete the resume
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // If the deleted resume is the current one, clear it
      if (resume && resume.id === id) {
        setResume(null);
      }
      
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting resume:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Duplicate an existing resume
   */
  const duplicateResume = async (id: string): Promise<ResumeData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the resume to duplicate
      const resumeToDuplicate = await getResume(id);
      
      if (!resumeToDuplicate) {
        throw new Error('Resume not found');
      }

      // Create a new resume with the same data but a new ID
      const newResume: ResumeData = {
        ...resumeToDuplicate,
        id: uuidv4(),
        title: `${resumeToDuplicate.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Convert to database format
      const dbResume = mapResumeToDatabase(newResume);

      const { data, error } = await supabase
        .from('resumes')
        .insert(dbResume)
        .select()
        .single();

      if (error) throw error;

      // Convert the returned data back to application format
      const createdResume = mapDatabaseToResumeData(data as DatabaseResumeData);
      
      toast({
        title: "Success",
        description: "Resume duplicated successfully",
      });
      
      if (options.onSuccess) {
        options.onSuccess(createdResume);
      }
      
      return createdResume;
    } catch (err: any) {
      console.error('Error duplicating resume:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to duplicate resume. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resume,
    isLoading,
    error,
    getResume,
    getUserResumes,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume
  };
}