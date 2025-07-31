"use client";

import { useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  FollowUpEmail, 
  FollowUpEmailRecord, 
  mapDbToAppFollowUp,
  mapAppToDbFollowUp,
  FollowUpEmailGenerationResult 
} from '@/types/follow-up';
import followUpEmailService, { FollowUpEmailParams } from '@/lib/follow-up-email-service';

interface UseFollowUpEmailsOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useFollowUpEmails(options: UseFollowUpEmailsOptions = {}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [emails, setEmails] = useState<FollowUpEmail[]>([]);
  const [currentEmail, setCurrentEmail] = useState<FollowUpEmail | null>(null);
  
  const supabase = createBrowserClient();
  const { toast } = useToast();

  /**
   * Fetch all follow-up emails for the current user
   */
  const getUserEmails = async (): Promise<FollowUpEmail[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follow_up_emails')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map all results from snake_case to camelCase
      const mappedEmails = (data as FollowUpEmailRecord[]).map(mapDbToAppFollowUp);
      setEmails(mappedEmails);
      
      return mappedEmails;
    } catch (err: any) {
      console.error('Error fetching follow-up emails:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to load follow-up emails. Please try again.",
        variant: "destructive",
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a specific follow-up email by ID
   */
  const getEmail = async (id: string): Promise<FollowUpEmail | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('follow_up_emails')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Map from snake_case DB fields to camelCase app fields
      const mappedEmail = mapDbToAppFollowUp(data as FollowUpEmailRecord);
      setCurrentEmail(mappedEmail);
      
      return mappedEmail;
    } catch (err: any) {
      console.error('Error fetching follow-up email:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to load follow-up email. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new follow-up email
   */
  const createEmail = async (params: FollowUpEmailParams): Promise<FollowUpEmailGenerationResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate the follow-up email using the service
      const result = await followUpEmailService.generateFollowUpEmail(params);
      
      // If user is authenticated, save to database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Insert into the database
        const { data, error } = await supabase
          .from('follow_up_emails')
          .insert({
            user_id: session.user.id,
            job_title: params.jobTitle,
            company_name: params.companyName,
            contact_name: params.contactName || null,
            application_date: params.applicationDate,
            subject: result.subject,
            greeting: result.greeting,
            body: result.body,
            signature: result.signature,
            style: params.followUpStyle,
            tone: params.tone || null,
            related_cover_letter_id: params.relatedCoverLetterId || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Convert back to app format and update state
        const newEmail = mapDbToAppFollowUp(data as FollowUpEmailRecord);
        setEmails(prevEmails => [newEmail, ...prevEmails]);
        setCurrentEmail(newEmail);
      }
      
      toast({
        title: "Success",
        description: "Follow-up email generated successfully",
      });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error generating follow-up email:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to generate follow-up email. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing follow-up email
   */
  const updateEmail = async (emailData: FollowUpEmail): Promise<FollowUpEmail | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert to database format
      const dbData = mapAppToDbFollowUp(emailData);
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('follow_up_emails')
        .update(dbData)
        .eq('id', emailData.id)
        .select()
        .single();

      if (error) throw error;

      // Convert the returned data back to application format
      const updatedEmail = mapDbToAppFollowUp(data as FollowUpEmailRecord);
      
      // Update state
      setCurrentEmail(updatedEmail);
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === updatedEmail.id ? updatedEmail : email
        )
      );
      
      toast({
        title: "Success",
        description: "Follow-up email updated successfully",
      });
      
      if (options.onSuccess) {
        options.onSuccess(updatedEmail);
      }
      
      return updatedEmail;
    } catch (err: any) {
      console.error('Error updating follow-up email:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to update follow-up email. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a follow-up email
   */
  const deleteEmail = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('follow_up_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update state
      setEmails(prevEmails => prevEmails.filter(email => email.id !== id));
      if (currentEmail?.id === id) {
        setCurrentEmail(null);
      }
      
      toast({
        title: "Success",
        description: "Follow-up email deleted successfully",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting follow-up email:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete follow-up email. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark a follow-up email as sent
   */
  const markAsSent = async (id: string, email?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('follow_up_emails')
        .update({
          sent_at: new Date().toISOString(),
          sent_to: email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update state
      const updatedEmail = mapDbToAppFollowUp(data as FollowUpEmailRecord);
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === updatedEmail.id ? updatedEmail : email
        )
      );
      if (currentEmail?.id === id) {
        setCurrentEmail(updatedEmail);
      }
      
      toast({
        title: "Success",
        description: "Follow-up email marked as sent",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error marking follow-up email as sent:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to update follow-up email status. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark that a response was received to a follow-up email
   */
  const markResponseReceived = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('follow_up_emails')
        .update({
          response_received: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update state
      const updatedEmail = mapDbToAppFollowUp(data as FollowUpEmailRecord);
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === updatedEmail.id ? updatedEmail : email
        )
      );
      if (currentEmail?.id === id) {
        setCurrentEmail(updatedEmail);
      }
      
      toast({
        title: "Success",
        description: "Response status updated",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating follow-up email response status:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to update response status. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate a quick follow-up email without saving
   */
  const generateQuickFollowUp = useCallback(async (
    jobTitle: string,
    companyName: string,
    candidateName: string,
    applicationDate?: string
  ): Promise<FollowUpEmailGenerationResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await followUpEmailService.generateQuickFollowUp(
        jobTitle,
        companyName,
        candidateName,
        applicationDate
      );
      
      return result;
    } catch (err: any) {
      console.error('Error generating quick follow-up email:', err);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to generate quick follow-up email. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, options]);

  return {
    emails,
    currentEmail,
    isLoading,
    error,
    getUserEmails,
    getEmail,
    createEmail,
    updateEmail,
    deleteEmail,
    markAsSent,
    markResponseReceived,
    generateQuickFollowUp
  };
}