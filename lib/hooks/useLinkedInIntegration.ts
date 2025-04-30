// lib/hooks/useLinkedInIntegration.ts
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from './useAuth'; // Assuming useAuth provides { user }
import { useToast } from '@/hooks/use-toast'; // Assuming you have this hook
import {
    initiateLinkedInAuth,
    extractLinkedInUsername,
    importProfileViaProxycurlAPI, // Assuming these are defined in the service
    refreshStoredLinkedInProfile,
    generateResumeFromStoredProfile
} from '@/services/LinkedinProfileService'; // Use the simplified service functions
import { Database } from '@/types/supabase'; // Assuming your generated types

// Define the specific type for profile rows using Supabase types
type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

// Define the return type of the hook for clarity
interface UseLinkedInIntegrationReturn {
    profile: LinkedInProfile | null;
    isConnected: boolean;
    isLoading: boolean; // General loading for initial fetch/refresh/disconnect
    isConnecting: boolean; // Specifically for OAuth connection redirect
    isImporting: boolean; // Specifically for Proxycurl import
    isGenerating: boolean; // Specifically for manual resume generation
    error: string | null;
    connectLinkedIn: () => Promise<void>;
    importProfileViaUrl: (profileUrl: string) => Promise<void>;
    refreshLinkedInData: () => Promise<void>;
    disconnectLinkedIn: () => Promise<void>;
    generateResume: () => Promise<string | null>;
    clearError: () => void;
}

// Custom Error class to potentially pass status code from service
class ServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

export function useLinkedInIntegration(): UseLinkedInIntegrationReturn {
    const [profile, setProfile] = useState<LinkedInProfile | null>(null);
    // State indicating if a profile is loaded and considered 'connected'
    const [isConnected, setIsConnected] = useState<boolean>(false);
    // General loading state for non-specific async operations like initial load, refresh, disconnect
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // Specific loading state for the OAuth redirect process
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    // Specific loading state for the Proxycurl import process
    const [isImporting, setIsImporting] = useState<boolean>(false);
    // Specific loading state for the manual resume generation process
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const supabase = createBrowserClient();

    // --- Core Logic ---

    // Fetch profile state from DB
    const fetchLinkedInProfile = useCallback(async () => {
        // Ensure setIsLoading and setIsConnected are defined before use
        if (!user) {
            setIsLoading(false); // Stop loading
            setProfile(null);
            setIsConnected(false);
            return;
        }

        setIsLoading(true); // Start loading
        setError(null);
        try {
            console.log("Hook: Fetching LinkedIn profile from DB...");
            const { data, error: dbError } = await supabase
                .from('linkedin_profiles')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'connected')
                .maybeSingle();

            if (dbError && dbError.code !== 'PGRST116') { throw dbError; }

            if (data) {
                console.log("Hook: Profile found in DB.");
                setProfile(data as LinkedInProfile);
                setIsConnected(true); // Update connection status
            } else {
                console.log("Hook: No connected profile found in DB.");
                setProfile(null);
                setIsConnected(false); // Update connection status
            }
        } catch (err: any) {
            console.error('Hook Error fetching LinkedIn profile:', err);
            setError(err.message || 'Failed to load LinkedIn profile status');
            setProfile(null);
            setIsConnected(false); // Update connection status
        } finally {
            setIsLoading(false); // Stop loading
        }
    }, [user, supabase]); // supabase client assumed stable

    // Load LinkedIn profile on mount or when user changes
    useEffect(() => {
        fetchLinkedInProfile();
    }, [user, fetchLinkedInProfile]);

    // Clear error state
    const clearError = useCallback(() => { setError(null); }, []);

    // Initiate OAuth connection
    const connectLinkedIn = useCallback(async () => {
        setIsConnecting(true); setError(null);
        try {
            const authUrl = await initiateLinkedInAuth(); // Uses service
            window.location.href = authUrl;
        } catch (err: any) {
            console.error('Hook Error connecting LinkedIn:', err);
            setError(err.message || 'Failed to start LinkedIn connection');
            toast({ title: 'Connection Failed', description: err.message, variant: 'destructive' });
            setIsConnecting(false);
        }
    }, [toast]);

    // Import via Proxycurl URL
    const importProfileViaUrl = useCallback(async (profileUrl: string) => {
        if (!profileUrl || !profileUrl.includes('linkedin.com/in/')) {
            setError('Please enter a valid LinkedIn profile URL.');
            // FIXED: Changed variant to "default"
            toast({ title: 'Invalid URL', description: 'Please provide a valid LinkedIn profile URL.', variant: 'default' });
            return;
        }
        setIsImporting(true); setError(null);
        try {
            // Use service function that calls the backend API
            await importProfileViaProxycurlAPI(profileUrl);
            toast({ title: "Import Successful", description: 'Profile data imported.' });
            await fetchLinkedInProfile(); // Refresh state from DB
        } catch (err: any) {
            console.error("Hook: Proxycurl Import error:", err);
            setError(err.message || "An error occurred during URL import.");
            toast({ title: "Import Failed", description: err.message, variant: "destructive" });
        } finally { setIsImporting(false); }
    }, [toast, fetchLinkedInProfile]); // Depends on fetchLinkedInProfile

    // Refresh stored LinkedIn data using OFFICIAL API token (via backend)
    const refreshLinkedInData = useCallback(async () => {
        // NOTE: Relies on '/api/linkedin/profile' backend route being refactored correctly.
        if (!user) { setError('User not logged in.'); return; }
        if (!profile) { setError('No connected LinkedIn profile to refresh.'); return; }

        setIsLoading(true); setError(null); // Use general loading state
        try {
            // Use service function that calls the backend API
            await refreshStoredLinkedInProfile();
            await fetchLinkedInProfile(); // Re-fetch profile from DB after successful sync
            toast({ title: 'LinkedIn Data Refreshed', description: 'Stored profile data has been updated.' });
        } catch (err: any) {
            console.error('Hook Error refreshing LinkedIn data:', err);
             // Check if error has status code (set by ServiceError)
            if (err instanceof ServiceError && err.status === 401) {
                setError("Your LinkedIn connection has expired or is invalid. Please reconnect.");
                setIsConnected(false); // Update connection status
                setProfile(null);
                // FIXED: Changed variant to "default"
                toast({ title: "Connection Expired", description: err.message || "Please reconnect LinkedIn.", variant: "default" });
            } else {
                setError(err.message || 'Failed to refresh LinkedIn profile');
                toast({ title: 'Refresh Failed', description: err.message || 'Unknown error', variant: 'destructive' });
            }
        } finally { setIsLoading(false); }
    }, [user, profile, toast, fetchLinkedInProfile]); // Depends on user, profile, fetchUserProfile

    // Disconnect LinkedIn
    const disconnectLinkedIn = useCallback(async () => {
        if (!user || !profile) return;
        setIsLoading(true); setError(null); // Use general loading state
        try {
            console.log(`Hook: Disconnecting profile ID ${profile.id}`);
            const { error: updateError } = await supabase
                .from('linkedin_profiles')
                .update({ status: 'disconnected', access_token: null, refresh_token: null, token_expires_at: null })
                .eq('id', profile.id)
                .eq('user_id', user.id);
            if (updateError) throw updateError;
            setProfile(null);
            setIsConnected(false); // Update connection status
            toast({ title: 'LinkedIn Disconnected' });
        } catch (err: any) {
            console.error('Hook Error disconnecting LinkedIn:', err);
            setError(err.message || 'Failed to disconnect LinkedIn profile');
            toast({ title: 'Disconnection Failed', description: err.message, variant: 'destructive' });
        } finally { setIsLoading(false); }
    }, [user, profile, supabase, toast]); // supabase needed for direct call

    // Generate resume from stored LinkedIn data
    const generateResume = useCallback(async (): Promise<string | null> => {
        // NOTE: Relies on '/api/resumes/from-linkedin' backend route being refactored correctly.
        if (!user || !profile?.id) {
            setError('Cannot generate resume: LinkedIn profile not connected or missing ID.');
            return null;
        }
        setIsGenerating(true); setError(null);
        try {
            // Use service function that calls the backend API
            const resumeIdResult = await generateResumeFromStoredProfile(profile.id);
            toast({ title: 'Resume Created', description: 'Resume generated from stored profile data.' });
            return resumeIdResult;
        } catch (err: any) {
            console.error('Hook Error generating resume manually:', err);
            setError(err.message || 'Failed to create resume.');
            toast({ title: 'Resume Creation Failed', description: err.message, variant: 'destructive' });
            return null;
        } finally { setIsGenerating(false); }
    }, [user, profile, toast]); // Depends on user, profile

    // Return hook state and functions
    return {
        profile, isConnected, isLoading, isConnecting, isImporting, isGenerating,
        error, connectLinkedIn, importProfileViaUrl, refreshLinkedInData,
        disconnectLinkedIn, generateResume, clearError
    };
}