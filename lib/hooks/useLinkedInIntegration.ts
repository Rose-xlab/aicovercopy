// lib/hooks/useLinkedInIntegration.ts
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  initiateLinkedInAuth, 
  handleLinkedInCallback, 
  syncLinkedInProfile,
  extractLinkedInUsername
} from '@/services/LinkedinProfileService';
import type { LinkedInProfileData } from '@/services/LinkedinProfileService';

interface UseLinkedInIntegrationReturn {
  profile: LinkedInProfileData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectLinkedIn: (profileUrl?: string) => Promise<void>;
  refreshLinkedInData: () => Promise<void>;
  disconnectLinkedIn: () => Promise<void>;
  generateResume: () => Promise<string | null>;
  clearError: () => void;
}

export function useLinkedInIntegration(): UseLinkedInIntegrationReturn {
  const [profile, setProfile] = useState<LinkedInProfileData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  // Load LinkedIn profile on mount
  useEffect(() => {
    const fetchLinkedInProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('linkedin_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setProfile(data);
          setIsConnected(true);
        } else {
          setProfile(null);
          setIsConnected(false);
        }
      } catch (err: any) {
        console.error('Error fetching LinkedIn profile:', err);
        setError(err.message || 'Failed to load LinkedIn profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLinkedInProfile();
  }, [user, supabase]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Connect LinkedIn profile
  const connectLinkedIn = useCallback(async (profileUrl?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If a profile URL is provided, validate it
      if (profileUrl) {
        if (!profileUrl.includes('linkedin.com/in/')) {
          setError('Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)');
          return;
        }
        
        const username = extractLinkedInUsername(profileUrl);
        if (!username) {
          setError('Could not extract username from URL');
          return;
        }
      }
      
      // Store the profile URL in session storage if provided
      if (profileUrl) {
        sessionStorage.setItem('linkedInUrl', profileUrl);
      }
      
      // Begin the LinkedIn OAuth flow
      const authUrl = await initiateLinkedInAuth();
      
      // Redirect to LinkedIn for authentication
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('Error connecting LinkedIn:', err);
      setError(err.message || 'Failed to connect LinkedIn profile');
      toast({
        title: 'Connection Failed',
        description: err.message || 'There was an error connecting your LinkedIn profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Refresh LinkedIn data
  const refreshLinkedInData = useCallback(async () => {
    if (!user || !profile) {
      setError('No LinkedIn profile connected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the sync function to update profile data
      const updatedProfile = await syncLinkedInProfile(supabase, user, profile.profile_url);
      
      setProfile(updatedProfile);
      
      toast({
        title: 'LinkedIn Data Refreshed',
        description: 'Your LinkedIn profile information has been updated.',
      });
    } catch (err: any) {
      console.error('Error refreshing LinkedIn data:', err);
      
      // If token expired or invalid, set appropriate error
      if (err.message && (err.message.includes('expired') || err.message.includes('token'))) {
        setError('Your LinkedIn connection has expired. Please reconnect your account.');
        setIsConnected(false);
        setProfile(null);
      } else {
        setError(err.message || 'Failed to refresh LinkedIn profile');
      }
      
      toast({
        title: 'Refresh Failed',
        description: err.message || 'There was an error refreshing your LinkedIn data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, supabase, toast]);

  // Disconnect LinkedIn
  const disconnectLinkedIn = useCallback(async () => {
    if (!user || !profile) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update the profile status in the database
      const { error } = await supabase
        .from('linkedin_profiles')
        .update({
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          token_expires_at: null
        })
        .eq('id', profile.id)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setProfile(null);
      setIsConnected(false);
      
      toast({
        title: 'LinkedIn Disconnected',
        description: 'Your LinkedIn profile has been disconnected.',
      });
    } catch (err: any) {
      console.error('Error disconnecting LinkedIn:', err);
      setError(err.message || 'Failed to disconnect LinkedIn profile');
      toast({
        title: 'Disconnection Failed',
        description: err.message || 'There was an error disconnecting your LinkedIn profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, supabase, toast]);

  // Generate resume from LinkedIn data
  const generateResume = useCallback(async (): Promise<string | null> => {
    if (!user || !profile) {
      setError('Please connect your LinkedIn profile first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API to generate a resume from LinkedIn data
      const response = await fetch('/api/resumes/from-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedInProfileId: profile.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create resume from LinkedIn profile');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Resume Created',
        description: 'Your resume has been successfully created from your LinkedIn profile.',
      });
      
      return data.resumeId;
    } catch (err: any) {
      console.error('Error generating resume:', err);
      setError(err.message || 'Failed to create resume from LinkedIn profile');
      toast({
        title: 'Resume Creation Failed',
        description: err.message || 'There was an error creating your resume.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, toast]);

  return {
    profile,
    isConnected,
    isLoading,
    error,
    connectLinkedIn,
    refreshLinkedInData,
    disconnectLinkedIn,
    generateResume,
    clearError
  };
}