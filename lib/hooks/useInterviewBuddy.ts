import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  InterviewSession, 
  InterviewQuestion, 
  mapDbToInterviewSession, 
  mapInterviewSessionToDb 
} from '@/types/interview';

export function useInterviewBuddy() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  /**
   * Generate an interview session with questions and answers
   */
  const generateInterview = async (params: {
    resumeId: string;
    jobTitle: string;
    jobDescription?: string;
    interviewType: 'technical' | 'behavioral' | 'mixed';
    difficulty: 'basic' | 'intermediate' | 'advanced';
    questionCount?: number;
  }): Promise<InterviewSession | null> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interview questions');
      }
      
      const data = await response.json();
      
      // Create interview session object
      const session: InterviewSession = {
        resumeId: params.resumeId,
        resumeTitle: data.resumeTitle,
        jobTitle: data.jobTitle || params.jobTitle,
        jobDescription: params.jobDescription,
        interviewType: params.interviewType,
        difficulty: params.difficulty,
        questions: data.questions,
        createdAt: new Date().toISOString(),
      };
      
      setInterviewSession(session);
      
      toast({
        title: "Interview Generated",
        description: `${data.questions.length} interview questions have been generated.`,
      });
      
      return session;
    } catch (error: any) {
      console.error('Error generating interview:', error);
      setError(error.message || 'Failed to generate interview. Please try again.');
      
      toast({
        title: "Generation Failed",
        description: error.message || "There was an error generating your interview questions.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Save an interview session
   */
  const saveInterviewSession = async (session: InterviewSession): Promise<InterviewSession | null> => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('/api/interview/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapInterviewSessionToDb(session)),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save interview session');
      }
      
      const data = await response.json();
      
      // Update the interview session with the saved data
      const savedSession: InterviewSession = {
        ...session,
        id: data.id,
        createdAt: data.created_at,
      };
      
      setInterviewSession(savedSession);
      
      toast({
        title: "Interview Saved",
        description: "Your interview session has been saved successfully.",
      });
      
      return savedSession;
    } catch (error: any) {
      console.error('Error saving interview session:', error);
      setError(error.message || 'Failed to save interview session. Please try again.');
      
      toast({
        title: "Save Failed",
        description: error.message || "There was an error saving your interview session.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Get a single interview session by ID
   */
  const getInterviewSession = async (id: string): Promise<InterviewSession | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id,
          user_id,
          resume_id,
          job_title,
          job_description,
          interview_type,
          difficulty,
          questions_answers,
          created_at,
          updated_at,
          notes,
          tags,
          resumes(title)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Interview session not found');
      }
      
      // Map from database format to application format
      const session = mapDbToInterviewSession(data);
      setInterviewSession(session);
      
      return session;
    } catch (error: any) {
      console.error('Error fetching interview session:', error);
      setError(error.message || 'Failed to fetch interview session');
      
      toast({
        title: "Error",
        description: error.message || "Failed to load interview session",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get interview history
   */
  const getInterviewHistory = async (resumeId?: string): Promise<InterviewSession[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construct the URL with optional resumeId filter
      const url = resumeId 
        ? `/api/interview/history?resumeId=${resumeId}`
        : '/api/interview/history';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch interview history');
      }
      
      const data = await response.json();
      
      // Map sessions from database format to application format
      const sessions = (data.sessions || []).map(mapDbToInterviewSession);
      setInterviewHistory(sessions);
      
      return sessions;
    } catch (error: any) {
      console.error('Error fetching interview history:', error);
      setError(error.message || 'Failed to fetch interview history');
      
      toast({
        title: "Error",
        description: error.message || "Failed to load interview history",
        variant: "destructive",
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Update a question in the current interview session
   */
  const updateQuestion = (questionId: string, updates: Partial<InterviewQuestion>) => {
    if (!interviewSession) return;
    
    const updatedQuestions = interviewSession.questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    
    setInterviewSession({
      ...interviewSession,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };
  
  /**
   * Update interview session notes
   */
  const updateSessionNotes = async (id: string, notes: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!interviewSession) {
        throw new Error('No active interview session');
      }
      
      const { error } = await supabase
        .from('interview_sessions')
        .update({ 
          notes, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setInterviewSession({
        ...interviewSession,
        notes,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Notes Saved",
        description: "Your interview session notes have been updated.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating session notes:', error);
      setError(error.message || 'Failed to update notes');
      
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Delete an interview session
   */
  const deleteInterviewSession = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from history if present
      setInterviewHistory(interviewHistory.filter(session => session.id !== id));
      
      // Clear current session if it's the one being deleted
      if (interviewSession?.id === id) {
        setInterviewSession(null);
      }
      
      toast({
        title: "Interview Deleted",
        description: "The interview session has been deleted successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting interview session:', error);
      setError(error.message || 'Failed to delete interview session');
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete interview session",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    interviewSession,
    interviewHistory,
    isLoading,
    isGenerating,
    isSaving,
    error,
    generateInterview,
    saveInterviewSession,
    getInterviewSession,
    getInterviewHistory,
    updateQuestion,
    updateSessionNotes,
    deleteInterviewSession
  };
}