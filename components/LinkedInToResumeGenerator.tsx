// components/LinkedInToResumeGenerator.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast"; // Assuming hook exists
import { useRouter } from "next/navigation";
// Removed direct import of createBrowserClient, assuming hook manages client if needed internally for its logic
// import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner"; // Assuming loading spinner exists
import { Linkedin, FileText, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, UploadCloud } from "lucide-react";
// Removed direct service import, using hook's functions instead
// import { initiateLinkedInAuth, extractLinkedInUsername } from "@/services/LinkedinProfileService";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "@/types/supabase"; // Assuming generated types
// Import the hook
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration"; // Assuming path is correct

type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

export function LinkedInToResumeGenerator() {
    // State managed by the hook
     const {
         profile: linkedInProfile, // Renamed state variable from hook
         isConnected,
         isLoading: isLoadingHook, // General loading state from hook
         isConnecting, // OAuth initiation loading state
         isImporting, // Proxycurl import loading state
         isGenerating: isGeneratingHook, // Manual generation loading state from hook
         error, // Error state from hook
         connectLinkedIn, // Action from hook
         importProfileViaUrl, // Action from hook
         refreshLinkedInData, // Action from hook
         disconnectLinkedIn, // Action from hook
         generateResume, // Action from hook
         clearError // Action from hook
     } = useLinkedInIntegration();

    // Local state ONLY for UI control WITHIN this component
    const [linkedInUrl, setLinkedInUrl] = useState("");
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<'connect' | 'process' | 'complete'>('connect');
    const [processingStage, setProcessingStage] = useState<string>('');
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("connect");
    const [inputError, setInputError] = useState<string | null>(null); // Local input validation error

    const { toast } = useToast();
    const router = useRouter();
    // No need for separate supabase client here if all DB interaction is via hook/backend

    // Sync local state with hook state
    useEffect(() => {
        if (isConnected && linkedInProfile) {
            setLinkedInUrl(linkedInProfile.profile_url || "");
            setStage('process');
        } else if (!isConnected && !isLoadingHook) { // Only reset to connect if not loading
            setStage('connect');
        }
    }, [isConnected, linkedInProfile, isLoadingHook]);

     // Clear hook error when component unmounts or stage changes
     useEffect(() => {
          return () => {
              clearError();
          };
      }, [stage, clearError]);

    // Validate LinkedIn URL (basic frontend check)
    const validateLinkedInUrl = (url: string): boolean => {
        setInputError(null); // Use local input error state
        if (!url?.trim()) { setInputError("LinkedIn URL is required"); return false; }
        if (!url.includes("linkedin.com/in/")) { setInputError("Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)"); return false; }
        const parts = url.split('linkedin.com/in/');
        if (parts.length < 2 || !parts[1] || parts[1].includes(' ')) { setInputError("Invalid LinkedIn profile URL format after /in/"); return false; }
        return true;
    };

    // --- Event Handlers using Hook Actions ---

    const handleOAuthConnect = () => {
        clearError(); // Clear hook error state
        setInputError(null);
        connectLinkedIn(); // Call hook action
    };

    const handleUrlImport = () => {
        clearError();
        if (!validateLinkedInUrl(linkedInUrl)) return; // Use local inputError state via validation
        importProfileViaUrl(linkedInUrl); // Call hook action
    };

    const handleManualGenerate = async () => {
         if (isGeneratingHook) return; // Prevent double clicks
         clearError();
         setProgress(0);
         setProcessingStage("Preparing to generate resume...");

         const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 5, 95)), 300);
          // FIXED: Add explicit type for stageUpdates array
         const stageUpdates: { stage: string; delay: number }[] = [
             { stage: "Analyzing profile...", delay: 1000 },
             { stage: "Extracting key details...", delay: 2500 },
             { stage: "Formatting content...", delay: 4000 },
             { stage: "Finalizing...", delay: 5500 },
         ];
         stageUpdates.forEach(({ stage: stageText, delay }) => setTimeout(() => setProcessingStage(stageText), delay));

         const generatedResumeId = await generateResume(); // Call hook action

         clearInterval(progressInterval);

         if (generatedResumeId) {
             setProgress(100);
             setProcessingStage("Resume created successfully!");
             setTimeout(() => {
                 setResumeId(generatedResumeId);
                 setStage('complete');
                 // Toast is handled within the hook now
             }, 1000);
         } else {
             // Error state is set within the hook
             setProgress(0);
             setProcessingStage("Failed to generate resume.");
         }
     };

     const handleRefresh = () => {
         clearError();
         refreshLinkedInData(); // Call hook action
     };

     const handleViewResume = () => { if (resumeId) router.push(`/dashboard/resumes/${resumeId}`); };
     const handleCreateAnother = () => {
         setStage('connect');
         // No need to setLinkedInProfile(null) - hook manages this
         setLinkedInUrl('');
         setResumeId(null);
         clearError();
         setProgress(0);
     };

    // --- Render Logic ---
    const renderConnectContent = () => (
        <>
          {/* Display error state FROM THE HOOK */}
          {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
             <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab} className="mb-4">
                 <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="connect" disabled={isConnecting || isImporting}>Direct Connect</TabsTrigger>
                     <TabsTrigger value="url" disabled={isConnecting || isImporting}>Use Profile URL</TabsTrigger>
                 </TabsList>
                 <TabsContent value="connect" className="text-center py-4 space-y-4">
                     <Linkedin className="h-12 w-12 mx-auto text-[#0A66C2]" />
                     <p className="text-sm text-muted-foreground">Connect directly via LinkedIn OAuth for the most secure and seamless experience (Recommended).</p>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-4 py-4">
                     <Linkedin className="h-12 w-12 mx-auto mb-2 text-[#0A66C2]" />
                      <p className="text-sm text-muted-foreground text-center mb-4">
                          Enter your public LinkedIn profile URL. Data accuracy depends on profile visibility and third-party service (Proxycurl).
                      </p>
                      <Input
                          type="url"
                          placeholder="https://www.linkedin.com/in/yourprofile"
                          value={linkedInUrl}
                          // Clear hook error and local input error on change
                          onChange={(e) => { setLinkedInUrl(e.target.value); setInputError(null); clearError(); }}
                          disabled={isConnecting || isImporting}
                          className={`w-full ${inputError ? "border-red-500" : ""}`}
                      />
                      {/* Display local input validation error */}
                      {inputError && <p className="text-xs text-red-500 mt-1 text-left px-1">{inputError}</p>}
                      <p className="text-xs text-orange-600 text-center px-4">
                          Note: Using URL import relies on scraping via a third-party and carries risks associated with LinkedIn&apos;s Terms of Service.
                      </p>
                 </TabsContent>
             </Tabs>
         </>
    );

     const renderProcessContent = () => (
         <>
              {/* Display error state FROM THE HOOK */}
              {error && (
                 <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
             <Alert className="bg-green-100 border-green-200 text-green-800 mb-4">
                 <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Profile Connected</AlertTitle>
                 <AlertDescription>
                      {linkedInProfile?.name || 'Profile'} is connected. Last synced: {linkedInProfile?.last_synced ? new Date(linkedInProfile.last_synced).toLocaleString() : 'N/A'}
                  </AlertDescription>
             </Alert>

              {isGeneratingHook ? ( // Use hook's generating state
                  <div className="space-y-4 py-4">
                      <Progress value={progress} className="w-full h-2" />
                      <p className="text-center text-sm text-muted-foreground">{processingStage}</p>
                  </div>
              ) : (
                  <>
                      <div className="flex items-center justify-center py-4">
                          <div className="p-2 bg-[#0A66C2] rounded-full text-white"><Linkedin className="h-5 w-5" /></div>
                          <ArrowRight className="mx-4 text-muted-foreground" />
                          <div className="p-2 bg-green-100 rounded-full text-green-700"><FileText className="h-5 w-5" /></div>
                      </div>
                      <p className="text-center text-sm text-muted-foreground px-4 mb-4">
                          Generate a resume using the connected profile data.
                      </p>
                      <div className="flex justify-center pt-2">
                          {/* Use general isLoadingHook state for refresh button */}
                          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingHook || isGeneratingHook} className="text-xs">
                              {isLoadingHook ? <LoadingSpinner className="h-3 w-3 mr-1"/> : <RefreshCw className="h-3 w-3 mr-1" />}
                              {isLoadingHook ? 'Refreshing...' : 'Refresh Stored Data'}
                          </Button>
                      </div>
                  </>
              )}
          </>
     );

     const renderCompleteContent = () => (
          <>
              <Alert className="bg-green-100 border-green-200 text-green-800 mb-6">
                 <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                      Your resume (ID: {resumeId}) was created successfully. View and edit it now.
                  </AlertDescription>
             </Alert>
              <div className="flex items-center justify-center py-6">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                     <FileText className="h-12 w-12 text-green-500" />
                  </div>
              </div>
          </>
      );

     // Main Render based on Stage
     const renderContent = () => {
         // Use isLoadingHook for initial loading state
         if (isLoadingHook && stage === 'connect') {
              return (
                 <Card className="w-full max-w-md mx-auto">
                     <CardContent className="py-10 flex items-center justify-center">
                         <LoadingSpinner className="mr-2" /> Loading Connection Status...
                     </CardContent>
                 </Card>
              );
         }

         switch (stage) {
             case 'connect':
                 return (
                    <Card className="w-full max-w-md mx-auto">
                         <CardHeader>
                            <CardTitle>LinkedIn to Resume</CardTitle>
                             <CardDescription>Choose connection or import method</CardDescription>
                         </CardHeader>
                         <CardContent>{renderConnectContent()}</CardContent>
                         <CardFooter>
                             <Button
                                 onClick={activeTab === 'connect' ? handleOAuthConnect : handleUrlImport}
                                 className="w-full"
                                 // Use specific loading states from hook
                                 disabled={isConnecting || isImporting || isLoadingHook || (activeTab === 'url' && !linkedInUrl)}
                             >
                                 {isConnecting ? <><LoadingSpinner className="mr-2"/>Connecting...</> :
                                 isImporting ? <><LoadingSpinner className="mr-2"/>Importing URL...</> :
                                 activeTab === 'connect' ? <><Linkedin className="mr-2 h-4 w-4"/>Direct Connect</> :
                                 <><UploadCloud className="mr-2 h-4 w-4"/>Import from URL</>}
                             </Button>
                         </CardFooter>
                     </Card>
                 );
             case 'process':
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                             <CardTitle>Create Resume</CardTitle>
                             <CardDescription>Generate from your connected profile</CardDescription>
                         </CardHeader>
                         <CardContent>{renderProcessContent()}</CardContent>
                         <CardFooter>
                             {/* Use specific isGeneratingHook state from hook */}
                            <Button onClick={handleManualGenerate} className="w-full" disabled={isGeneratingHook || isLoadingHook || !isConnected}>
                                {isGeneratingHook ? <><LoadingSpinner className="mr-2"/>Creating...</> : <><FileText className="mr-2 h-4 w-4"/>Generate Resume</>}
                            </Button>
                         </CardFooter>
                    </Card>
                );
            case 'complete':
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Resume Ready</CardTitle>
                             <CardDescription>Your resume has been generated</CardDescription>
                         </CardHeader>
                         <CardContent>{renderCompleteContent()}</CardContent>
                         <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
                            <Button variant="outline" onClick={handleCreateAnother} className="w-full sm:w-auto">Start Over</Button>
                             <Button onClick={handleViewResume} className="w-full sm:w-auto"><FileText className="mr-2 h-4 w-4"/>View & Edit Resume</Button>
                         </CardFooter>
                     </Card>
                 );
            default: return null; // Should not happen
         }
     };

    // Final JSX structure, ensuring correct syntax
    return <div className="py-6">{renderContent()}</div>;
}