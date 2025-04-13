// LinkedInToResumeConverter.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { LinkedInProfile } from "@/components/LinkedInManager";
import { createBrowserClient } from "@/lib/supabase";
import { Linkedin, FileText, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LinkedInToResumeConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createBrowserClient();

  // Fetch the user's LinkedIn profile on component mount
  useEffect(() => {
    fetchLinkedInProfile();
  }, []);

  // Fetch LinkedIn profile from the database
  const fetchLinkedInProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to use this feature");
        return;
      }

      const { data, error } = await supabase
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // This error means no rows found, which is expected if they haven't connected
          setLinkedInProfile(null);
        } else {
          throw error;
        }
      } else {
        setLinkedInProfile(data);
      }
    } catch (err: any) {
      console.error("Error fetching LinkedIn profile:", err);
      setError(err.message || "Failed to load LinkedIn profile");
      toast({
        title: "Error",
        description: "Failed to load your LinkedIn profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect LinkedIn profile (initiate OAuth flow)
  const connectLinkedIn = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/linkedin/auth');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate LinkedIn authentication");
      }
      
      const { authUrl } = await response.json();
      
      // Redirect to LinkedIn auth page
      window.location.href = authUrl;
    } catch (err: any) {
      console.error("Error connecting LinkedIn:", err);
      setError(err.message || "Failed to connect LinkedIn");
      toast({
        title: "Connection Failed",
        description: "There was an error connecting to LinkedIn. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Convert LinkedIn profile to resume
  const convertToResume = async () => {
    if (!linkedInProfile) return;
    
    try {
      setIsConverting(true);
      setError(null);
      
      // Call the API to convert LinkedIn profile to resume
      const response = await fetch('/api/resumes/from-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedInProfileId: linkedInProfile.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create resume from LinkedIn profile");
      }
      
      const data = await response.json();
      
      toast({
        title: "Resume Created",
        description: "Your resume has been successfully created from your LinkedIn profile.",
      });
      
      // Redirect to the newly created resume
      router.push(`/dashboard/resumes/${data.resumeId}`);
    } catch (err: any) {
      console.error("Error converting LinkedIn to resume:", err);
      setError(err.message || "Failed to create resume from LinkedIn profile");
      toast({
        title: "Conversion Failed",
        description: "There was an error creating your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Handle refreshing LinkedIn data
  const refreshLinkedInData = async () => {
    if (!linkedInProfile) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API to refresh LinkedIn profile data
      const response = await fetch('/api/linkedin/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: linkedInProfile.profile_url.split('/').pop()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh LinkedIn profile");
      }
      
      // Refresh the profile data from the database
      await fetchLinkedInProfile();
      
      toast({
        title: "LinkedIn Refreshed",
        description: "Your LinkedIn profile data has been refreshed.",
      });
    } catch (err: any) {
      console.error("Error refreshing LinkedIn data:", err);
      setError(err.message || "Failed to refresh LinkedIn profile");
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing your LinkedIn data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner className="mb-4" />
            <p>Loading your LinkedIn profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If not connected to LinkedIn yet
  if (!linkedInProfile || linkedInProfile.status !== "connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Linkedin className="mr-2 h-5 w-5" />
            Generate Resume from LinkedIn
          </CardTitle>
          <CardDescription>
            Connect your LinkedIn profile to automatically create a professional resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Linkedin className="h-12 w-12 text-[#0A66C2]" />
            <p className="text-center max-w-md">
              Connect your LinkedIn profile to quickly generate a professional resume with your experience, education, and skills.
            </p>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={connectLinkedIn} 
            className="w-full bg-[#0A66C2] hover:bg-[#084482]"
          >
            <Linkedin className="mr-2 h-4 w-4" />
            Connect LinkedIn Profile
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If connected to LinkedIn
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Linkedin className="mr-2 h-5 w-5" />
          Generate Resume from LinkedIn
        </CardTitle>
        <CardDescription>
          Create a professional resume using your LinkedIn profile data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-slate-50 rounded-md">
            <div className="mr-4 p-2 bg-[#0A66C2] rounded-full text-white">
              <Linkedin className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{linkedInProfile.name || "Your LinkedIn Profile"}</h3>
              {linkedInProfile.headline && (
                <p className="text-sm text-muted-foreground">{linkedInProfile.headline}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(linkedInProfile.last_synced).toLocaleDateString()}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshLinkedInData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center">
              <div className="p-2 bg-[#0A66C2] rounded-full text-white">
                <Linkedin className="h-5 w-5" />
              </div>
              <ArrowRight className="mx-4 text-muted-foreground" />
              <div className="p-2 bg-green-100 rounded-full text-green-700">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground px-4">
            With one click, we'll extract your professional experience, education, and skills from LinkedIn 
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
        <Button 
          onClick={convertToResume} 
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <LoadingSpinner className="mr-2" />
              Creating Resume...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Resume Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}