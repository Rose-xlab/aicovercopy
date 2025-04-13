// components/LinkedInToResumeGenerator.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Linkedin, FileText, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { initiateLinkedInAuth, extractLinkedInUsername } from "@/services/LinkedinProfileService";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LinkedInToResumeGenerator() {
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'connect' | 'process' | 'complete'>('connect');
  const [processingStage, setProcessingStage] = useState<string>('');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  // Load LinkedIn profile on mount
  useEffect(() => {
    const checkLinkedInProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const { data, error } = await supabase
          .from("linkedin_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "connected")
          .single();
        
        if (error) {
          if (error.code !== "PGRST116") { // No rows found
            console.error("Error fetching LinkedIn profile:", error);
          }
          return;
        }
        
        if (data) {
          setLinkedInProfile(data);
          setLinkedInUrl(data.profile_url || "");
          setStage('process');
        }
      } catch (err) {
        console.error("Error loading LinkedIn profile:", err);
      }
    };
    
    checkLinkedInProfile();
  }, [supabase]);
  
  // Check for authentication callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinStatus = urlParams.get('linkedin');
    
    if (linkedinStatus === 'connected') {
      // If we just connected LinkedIn, show success toast and refresh profile
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been successfully connected.",
      });
      
      // Check for error parameters from OAuth
      const errorParam = urlParams.get('error');
      if (errorParam) {
        const errorDescription = urlParams.get('error_description') || 'Unknown error';
        setError(`LinkedIn authentication error: ${errorDescription}`);
        
        toast({
          title: "Connection Failed",
          description: errorDescription,
          variant: "destructive",
        });
        
        // Clear the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, '', url.toString());
      } else {
        const fetchUpdatedProfile = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) return;
            
            const { data, error } = await supabase
              .from("linkedin_profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .eq("status", "connected")
              .single();
            
            if (error) {
              console.error("Error fetching updated LinkedIn profile:", error);
              return;
            }
            
            if (data) {
              setLinkedInProfile(data);
              setLinkedInUrl(data.profile_url || "");
              setStage('process');
            }
          } catch (err) {
            console.error("Error loading LinkedIn profile:", err);
          }
        };
        
        fetchUpdatedProfile();
      }
      
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('linkedin');
      window.history.replaceState({}, '', url.toString());
    }
    
    // Check for resumeId parameter (from successful resume creation)
    const resumeIdParam = urlParams.get('resumeId');
    if (resumeIdParam) {
      setResumeId(resumeIdParam);
      setStage('complete');
      
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('resumeId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [toast, supabase]);
  
  // Validate LinkedIn URL
  const validateLinkedInUrl = (url: string): boolean => {
    setError(null);
    
    if (!url || url.trim() === "") {
      setError("LinkedIn URL is required");
      return false;
    }
    
    if (!url.includes("linkedin.com/in/")) {
      setError("Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)");
      return false;
    }
    
    const username = extractLinkedInUsername(url);
    if (!username) {
      setError("Could not extract username from URL");
      return false;
    }
    
    return true;
  };
  
  // Connect LinkedIn profile
  const handleConnectLinkedIn = async () => {
    if (activeTab === "url") {
      if (!validateLinkedInUrl(linkedInUrl)) {
        return;
      }
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Begin the LinkedIn OAuth flow using our LinkedIn service
      const authUrl = await initiateLinkedInAuth();
      
      // Store the LinkedIn URL in session storage to retrieve after auth
      sessionStorage.setItem('linkedInUrl', linkedInUrl);
      
      // Redirect to LinkedIn for authentication
      window.location.href = authUrl;
      
      // The rest of the process will be handled in the callback
    } catch (err: any) {
      console.error("Error connecting LinkedIn:", err);
      setError(err.message || "Failed to connect LinkedIn profile");
      toast({
        title: "Connection Failed",
        description: err.message || "There was an error connecting your LinkedIn profile.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };
  
  // Handle resume generation from LinkedIn
  const handleGenerateResume = async () => {
    if (!linkedInProfile) {
      setError("Please connect your LinkedIn profile first");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setProcessingStage("Preparing LinkedIn data...");
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);
    
    // Update processing stages for user feedback
    const stageUpdates = [
      { stage: "Analyzing profile information...", delay: 1000 },
      { stage: "Processing work experience...", delay: 2000 },
      { stage: "Extracting skills and achievements...", delay: 3000 },
      { stage: "Formatting resume content...", delay: 4000 },
      { stage: "Applying professional template...", delay: 5000 },
      { stage: "Finalizing your resume...", delay: 6000 },
    ];
    
    // Display stage updates
    stageUpdates.forEach(({ stage, delay }) => {
      setTimeout(() => {
        setProcessingStage(stage);
      }, delay);
    });

    try {
      const response = await fetch("/api/resumes/from-linkedin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      
      // Set progress to 100% to indicate completion
      setProgress(100);
      
      setProcessingStage("Resume created successfully!");
      
      // Wait a moment to show the 100% progress
      setTimeout(() => {
        setResumeId(data.resumeId);
        setStage('complete');
        
        toast({
          title: "Resume Created",
          description: "Your resume has been successfully created from your LinkedIn profile.",
        });
      }, 1000);
    } catch (err: any) {
      console.error("Error generating resume:", err);
      setError(err.message || "Failed to create resume from LinkedIn profile");
      toast({
        title: "Resume Creation Failed",
        description: err.message || "There was an error creating your resume.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };
  
  // Handle refresh of LinkedIn data
  const handleRefreshLinkedInData = async () => {
    if (!linkedInProfile) return;
    
    try {
      setIsConnecting(true);
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
        
        // If token expired, prompt to reconnect
        if (response.status === 401) {
          setError("Your LinkedIn connection has expired. Please reconnect.");
          setStage('connect');
          setLinkedInProfile(null);
          return;
        }
        
        throw new Error(errorData.error || "Failed to refresh LinkedIn profile");
      }
      
      const updatedProfile = await response.json();
      setLinkedInProfile(updatedProfile);
      
      toast({
        title: "LinkedIn Data Refreshed",
        description: "Your LinkedIn profile information has been updated.",
      });
    } catch (err: any) {
      console.error("Error refreshing LinkedIn data:", err);
      setError(err.message || "Failed to refresh LinkedIn profile");
      toast({
        title: "Refresh Failed",
        description: err.message || "There was an error refreshing your LinkedIn data.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // View the generated resume
  const handleViewResume = () => {
    if (resumeId) {
      router.push(`/dashboard/resumes/${resumeId}`);
    }
  };
  
  // Create another resume
  const handleCreateAnother = () => {
    setStage('process');
    setResumeId(null);
  };
  
  // Render different stages of the process
  const renderContent = () => {
    switch (stage) {
      case 'connect':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Linkedin className="mr-2 h-5 w-5" />
                LinkedIn to Resume
              </CardTitle>
              <CardDescription>
                Create a professional resume from your LinkedIn profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show an error if there is one */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="w-full">
                  <TabsTrigger value="url" className="flex-1">Provide URL</TabsTrigger>
                  <TabsTrigger value="connect" className="flex-1">Direct Connect</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4">
                  <div className="text-center py-4">
                    <Linkedin className="h-12 w-12 mx-auto mb-2 text-[#0A66C2]" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your LinkedIn profile URL to quickly generate a professional resume with your experience, education, and skills.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="https://www.linkedin.com/in/yourprofile"
                      value={linkedInUrl}
                      onChange={(e) => {
                        setLinkedInUrl(e.target.value);
                        setError(null);
                      }}
                      disabled={isConnecting}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="connect" className="space-y-4">
                  <div className="text-center py-4">
                    <Linkedin className="h-12 w-12 mx-auto mb-2 text-[#0A66C2]" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect directly with your LinkedIn account to quickly create your professional resume.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleConnectLinkedIn}
                className="w-full bg-[#0A66C2] hover:bg-[#084482]"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Linkedin className="mr-2 h-4 w-4" />
                    Connect LinkedIn Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case 'process':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Linkedin className="mr-2 h-5 w-5" />
                Create Resume from LinkedIn
              </CardTitle>
              <CardDescription>
                Your LinkedIn profile is connected and ready to convert
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Alert className="bg-green-500/10 border-green-500/30 mb-4">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <AlertDescription className="text-green-500 font-medium">
                  LinkedIn profile connected
                </AlertDescription>
                {linkedInProfile && (
                  <div className="mt-1">
                    <p className="text-sm text-muted-foreground">
                      {linkedInProfile.name || "User"} •{" "}
                      {linkedInProfile.headline || "Professional"}
                    </p>
                    {linkedInProfile.company && (
                      <p className="text-sm text-muted-foreground">
                        {linkedInProfile.position} at {linkedInProfile.company}
                      </p>
                    )}
                  </div>
                )}
              </Alert>
              
              {isGenerating ? (
                <div className="space-y-4 py-4">
                  <Progress value={progress} className="w-full h-2" />
                  <p className="text-center text-sm text-muted-foreground">{processingStage}</p>
                </div>
              ) : (
                <>
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
                  
                  <p className="text-center text-sm text-muted-foreground px-4 mb-4">
                    One click will create a complete resume with your professional experience, education, and skills.
                  </p>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshLinkedInData}
                      disabled={isConnecting}
                      className="text-xs"
                    >
                      {isConnecting ? (
                        <>
                          <LoadingSpinner className="h-3 w-3 mr-1" />
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span>Refresh LinkedIn Data</span>
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateResume} 
                className="w-full"
                disabled={isGenerating || isConnecting}
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    <span>Creating Resume...</span>
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Resume
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case 'complete':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                Resume Created Successfully
              </CardTitle>
              <CardDescription>
                Your LinkedIn data has been transformed into a professional resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-green-500/10 border-green-500/30 mb-6">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <div>
                  <AlertTitle className="text-green-700">Success!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Your resume has been created from your LinkedIn profile. You can now view and edit it.
                  </AlertDescription>
                </div>
              </Alert>
              
              <div className="flex items-center justify-center py-6">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                  <FileText className="h-12 w-12 text-green-500" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Your resume is now ready. You can view it, edit it further, or create another one.
                </p>
                <p className="text-sm font-medium text-green-600">
                  Resume ID: {resumeId}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={handleCreateAnother}
                className="w-full sm:w-auto"
              >
                Create Another Resume
              </Button>
              <Button 
                onClick={handleViewResume}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                View & Edit Resume
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };
  
  return (
    <div className="py-6">
      {renderContent()}
    </div>
  );
}