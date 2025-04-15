// components/LinkedInToResumeConverter.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
// FIXED: Removed incorrect type import from component
// import { LinkedInProfile } from "@/components/LinkedInManager";
import { createBrowserClient } from "@/lib/supabase";
import { Linkedin, FileText, ArrowRight, RefreshCw, AlertCircle, ExternalLink } from "lucide-react"; // Added ExternalLink
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Database } from "@/types/supabase"; // Import Supabase types

// FIXED: Define profile type based on Supabase schema
type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

// Removed unused service import (using direct fetch or hook actions is preferred now)
// import { syncLinkedInProfile, fetchLinkedInProfile, extractLinkedInUsername } from "@/services/LinkedinProfileService";

export function LinkedInToResumeConverter() {
    const [isLoading, setIsLoading] = useState(false); // General loading for fetch/refresh
    const [isConnecting, setIsConnecting] = useState(false); // For OAuth redirect
    const [isConverting, setIsConverting] = useState(false); // For resume generation call
    const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createBrowserClient();

    // Fetch LinkedIn profile from the database (wrapped in useCallback)
    const fetchLinkedInProfile = useCallback(async () => {
        // Ensure setIsLoading and setLinkedInProfile are defined before use
        setIsLoading(true); // Start loading
        setError(null);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                // Don't set error for non-logged in state, just return
                console.log("No session found for fetching profile.");
                setLinkedInProfile(null); // Ensure profile is null
                return;
            }

            const { data, error: dbError } = await supabase
                .from("linkedin_profiles")
                .select("*")
                .eq("user_id", session.user.id)
                // Fetch regardless of status maybe? Or only connected? Assuming only connected.
                .eq("status", "connected")
                .maybeSingle(); // Use maybeSingle handles "no rows" gracefully

            if (dbError && dbError.code !== "PGRST116") { // Throw actual DB errors
                throw dbError;
            }

            setLinkedInProfile(data); // Set profile (null if not found)

        } catch (err: any) {
            console.error("Error fetching LinkedIn profile:", err);
            setError(err.message || "Failed to load LinkedIn profile status");
            setLinkedInProfile(null); // Clear profile on error
            toast({
                title: "Error Loading Profile",
                description: "Failed to load your LinkedIn profile status. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false); // Stop loading
        }
        // Dependencies for useCallback
    }, [supabase, toast]); // Assuming supabase client is stable, toast likely stable

    // Fetch the user's LinkedIn profile on component mount
    useEffect(() => {
        fetchLinkedInProfile();
        // FIXED: Added fetchLinkedInProfile to dependency array
    }, [fetchLinkedInProfile]);

    // Connect LinkedIn profile (initiate OAuth flow)
    const connectLinkedIn = async () => {
        setIsConnecting(true); // Use specific loading state
        setError(null);
        try {
            // Assuming initiateLinkedInAuth service function correctly calls '/api/linkedin/auth'
            // Or call fetch directly here:
             const response = await fetch('/api/linkedin/auth');
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to initiate LinkedIn authentication");
             }
             const { authUrl } = await response.json();
             if (!authUrl) throw new Error('Auth URL not provided by the response');

             window.location.href = authUrl; // Redirect user to LinkedIn auth page
        } catch (err: any) {
            console.error("Error connecting LinkedIn:", err);
            setError(err.message || "Failed to connect LinkedIn");
            toast({
                title: "Connection Failed",
                description: "There was an error starting the connection to LinkedIn.",
                variant: "destructive",
            });
            setIsConnecting(false); // Reset loading state on error
        }
         // No finally here as page redirects on success
    };

    // Convert LinkedIn profile to resume
    const convertToResume = async () => {
        if (!linkedInProfile || linkedInProfile.status !== 'connected') {
             setError("Please connect your LinkedIn profile first.");
             return;
        }
        setIsConverting(true);
        setError(null);
        try {
            // Call the API route (ensure it's refactored to use resumeUtils)
            const response = await fetch('/api/resumes/from-linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ linkedInProfileId: linkedInProfile.id }),
            });

            const data = await response.json(); // Always try to parse
            if (!response.ok) {
                throw new Error(data.error || "Failed to create resume from LinkedIn profile");
            }

            toast({
                title: "Resume Created",
                description: "Your resume has been successfully created.",
            });
            router.push(`/dashboard/resumes/${data.resumeId}`); // Redirect on success

        } catch (err: any) {
            console.error("Error converting LinkedIn to resume:", err);
            setError(err.message || "Failed to create resume.");
            toast({
                title: "Conversion Failed",
                description: err.message || "There was an error creating your resume.",
                variant: "destructive",
            });
        } finally {
            setIsConverting(false);
        }
    };

    // Handle refreshing LinkedIn data
    const refreshLinkedInData = async () => {
        if (!linkedInProfile || linkedInProfile.status !== 'connected') {
             toast({ title: "Cannot Refresh", description: "No connected profile to refresh.", variant: "default" });
            return;
        }
        setIsLoading(true); // Use general loading state
        setError(null);
        try {
            // Call the API route (ensure it's refactored to update DB)
            const response = await fetch('/api/linkedin/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Backend should get user from session, might not need body
                body: JSON.stringify({}), // Send empty body or needed identifier
            });

            const data = await response.json(); // Always try to parse
            if (!response.ok) {
                 // Handle specific errors like 401
                if (response.status === 401) {
                    setError("LinkedIn connection expired or invalid. Please reconnect.");
                    setLinkedInProfile(null); // Clear local profile
                     toast({ title: "Connection Expired", description: data.error || "Please reconnect LinkedIn.", variant: "default" });
                 } else {
                     throw new Error(data.error || "Failed to refresh LinkedIn profile");
                 }
            } else {
                // Refresh the profile data from the database
                await fetchLinkedInProfile(); // Re-fetch after successful backend sync/update
                toast({ title: "LinkedIn Refreshed", description: "Stored profile data has been refreshed." });
            }
        } catch (err: any) {
            console.error("Error refreshing LinkedIn data:", err);
            setError(err.message || "Failed to refresh LinkedIn profile");
            toast({ title: "Refresh Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false); // Stop general loading
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-10 flex items-center justify-center">
                    <LoadingSpinner className="mr-2" /> Loading LinkedIn Status...
                </CardContent>
            </Card>
        );
    }

    // If not connected to LinkedIn yet
    if (!linkedInProfile || linkedInProfile.status !== "connected") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Linkedin className="mr-2 h-5 w-5" /> Generate Resume from LinkedIn</CardTitle>
                    <CardDescription>Connect your LinkedIn profile to automatically create a professional resume</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <Linkedin className="h-12 w-12 text-[#0A66C2]" />
                        <p className="text-center max-w-md">Connect your LinkedIn profile to quickly generate a professional resume with your experience, education, and skills.</p>
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    {/* Use isConnecting state for this button */}
                    <Button onClick={connectLinkedIn} className="w-full bg-[#0A66C2] hover:bg-[#084482]" disabled={isConnecting}>
                         {isConnecting ? <LoadingSpinner className="mr-2" /> : <Linkedin className="mr-2 h-4 w-4" />}
                         {isConnecting ? 'Redirecting...' : 'Connect LinkedIn Profile'}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // If connected to LinkedIn
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Linkedin className="mr-2 h-5 w-5" /> Generate Resume from LinkedIn</CardTitle>
                <CardDescription>Create a professional resume using your connected LinkedIn profile data</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Alert className="bg-green-100 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                         <AlertTitle>Profile Connected</AlertTitle>
                         <AlertDescription>
                             {linkedInProfile.name || 'Profile'} is connected.
                             {linkedInProfile.last_synced && (
                                 <span className="text-xs block opacity-80">
                                     Last Synced: {new Date(linkedInProfile.last_synced).toLocaleString()}
                                 </span>
                             )}
                         </AlertDescription>
                         <div className="mt-2">
                              <Button variant="outline" size="sm" onClick={refreshLinkedInData} disabled={isLoading} className="mr-2">
                                  {isLoading ? <LoadingSpinner className="mr-1 h-4 w-4"/> : <RefreshCw className="h-4 w-4 mr-1" />}
                                 {isLoading ? 'Refreshing...' : 'Refresh Data'}
                             </Button>
                              {linkedInProfile.profile_url && (
                                 <Button variant="outline" size="sm" onClick={() => window.open(linkedInProfile.profile_url!, "_blank")}>
                                     <ExternalLink className="h-4 w-4 mr-1" /> View Profile
                                 </Button>
                              )}
                              {/* Add Disconnect button if needed */}
                         </div>
                    </Alert>

                    <div className="flex items-center justify-center py-4">
                        <div className="flex items-center">
                            <div className="p-2 bg-[#0A66C2] rounded-full text-white"><Linkedin className="h-5 w-5" /></div>
                            <ArrowRight className="mx-4 text-muted-foreground" />
                            <div className="p-2 bg-green-100 rounded-full text-green-700"><FileText className="h-5 w-5" /></div>
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground px-4">
                         {/* FIXED: Escaped apostrophe */}
                         With one click, we&apos;ll extract your professional experience, education, and skills from LinkedIn
                         to create a complete resume that you can customize further.
                    </p>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={convertToResume} disabled={isConverting} className="w-full">
                    {isConverting ? ( <><LoadingSpinner className="mr-2" /> Creating Resume...</> ) :
                     ( <><FileText className="mr-2 h-4 w-4" /> Generate Resume Now</> )}
                </Button>
            </CardFooter>
        </Card>
    );
}