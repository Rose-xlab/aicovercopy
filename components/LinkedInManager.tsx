// components/LinkedInManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // Removed CardFooter - not used
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Linkedin,
    CheckCircle2,
    RefreshCw, // Updated icon name
    ExternalLink,
    AlertCircle,
    UploadCloud, // Icon for import button
    Trash2 // Icon for disconnect
} from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Assuming hook exists
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration"; // Import the updated hook
import { LoadingSpinner } from "@/components/LoadingSpinner"; // Assuming loading spinner exists
import { Database } from "@/types/supabase"; // Assuming generated types

// Define the specific type for profile rows using Supabase types
type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

// LinkedIn colors
const LINKEDIN_BLUE = "#0077B5";
const LINKEDIN_LIGHT_BLUE = "#e1f0fa";
const LINKEDIN_DARK_BLUE = "#0a66c2";

export function LinkedInManager() {
    const { toast } = useToast();

    // Use the hook to manage all state and actions
    const {
        profile,
        isConnected,
        isLoading: isLoadingHook, // General loading state from hook
        isConnecting, // OAuth initiation loading state
        isImporting, // Proxycurl import loading state
        // isGenerating state is not used in this specific component
        error,
        connectLinkedIn, // Action from hook
        importProfileViaUrl, // Action from hook
        refreshLinkedInData, // Action from hook
        disconnectLinkedIn, // Action from hook
        // generateResume is not used in this component
        clearError // Action from hook
    } = useLinkedInIntegration();

    // Local state ONLY for the URL input field
    const [linkedInUrlInput, setLinkedInUrlInput] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);

    // Sync local input field with profile URL from hook when connected
    useEffect(() => {
        if (profile?.profile_url) {
            setLinkedInUrlInput(profile.profile_url);
        }
        // Don't clear input on disconnect, user might want to re-import same URL
    }, [profile?.profile_url]);

    // Clear hook error when component unmounts
    useEffect(() => {
         return () => {
             clearError();
         };
     }, [clearError]);

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
        clearError(); // Clear previous hook errors
        setInputError(null);
        connectLinkedIn(); // Call hook action
    };

    const handleUrlImport = () => {
        clearError(); // Clear previous hook errors
        if (!validateLinkedInUrl(linkedInUrlInput)) return; // Use local inputError state
        importProfileViaUrl(linkedInUrlInput); // Call hook action
    };

    const handleRefresh = () => {
        clearError();
        refreshLinkedInData(); // Call hook action
    };

    const handleDisconnect = () => {
        clearError();
        disconnectLinkedIn(); // Call hook action
    };

    // --- Render Logic ---

    // Show main loading spinner only during initial profile fetch
    if (isLoadingHook && !profile && !error && !isConnected) { // Added !isConnected check
        return (
            <Card className="w-full shadow-md border-t-4" style={{ borderTopColor: LINKEDIN_BLUE }}>
                <CardContent className="py-10 flex items-center justify-center">
                    <LoadingSpinner className="mr-2" /> Loading LinkedIn Status...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-md border-t-4" style={{ borderTopColor: LINKEDIN_BLUE }}>
            <CardHeader className="pb-3" style={{ backgroundColor: LINKEDIN_LIGHT_BLUE }}>
                <CardTitle className="flex items-center text-lg">
                    <Linkedin className="mr-2 h-5 w-5" style={{ color: LINKEDIN_BLUE }} />
                    <span style={{ color: LINKEDIN_DARK_BLUE }}>LinkedIn</span>
                </CardTitle>
                <CardDescription>
                    {isConnected
                        ? "Manage your connected profile for use in generators."
                        : ""}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {/* Display Hook Errors */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isConnected && profile ? (
                    // --- Connected State ---
                    <div className="space-y-4">
                        <Alert className="bg-green-100 border-green-200 text-green-800">
                             <CheckCircle2 className="h-4 w-4" />
                             <AlertTitle className="font-semibold">Profile Connected</AlertTitle>
                             <AlertDescription>
                                 {profile.name || 'Profile'} ({profile.headline || 'No headline'})
                                 <br />
                                 <span className="text-xs opacity-80">
                                     Last Synced: {profile.last_synced ? new Date(profile.last_synced).toLocaleString() : 'Never'}
                                 </span>
                             </AlertDescription>
                             <div className="mt-3 flex flex-wrap gap-2">
                                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingHook} className="w-full sm:w-auto">
                                      {isLoadingHook && !isConnecting && !isImporting ? <LoadingSpinner className="mr-1 h-4 w-4"/> : <RefreshCw className="h-4 w-4 mr-1" />}
                                     {isLoadingHook && !isConnecting && !isImporting ? 'Refreshing...' : 'Refresh Data'}
                                 </Button>
                                  {profile.profile_url && (
                                     <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => window.open(profile.profile_url!, "_blank")}
                                        className="w-full sm:w-auto"
                                        style={{ borderColor: LINKEDIN_BLUE, color: LINKEDIN_BLUE }}
                                     >
                                         <ExternalLink className="h-4 w-4 mr-1" /> View on LinkedIn
                                     </Button>
                                  )}
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={handleDisconnect} 
                                    disabled={isLoadingHook}
                                    className="w-full sm:w-auto"
                                  >
                                      <Trash2 className="h-4 w-4 mr-1" /> Disconnect
                                  </Button>
                             </div>
                        </Alert>
                    </div>
                ) : (
                    // --- Disconnected State ---
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg shadow-sm">
                             <p className="text-sm text-muted-foreground mb-3 text-center">Paste your LinkedIn profile URL to import data.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://www.linkedin.com/in/yourprofile"
                                    value={linkedInUrlInput}
                                    onChange={(e) => { setLinkedInUrlInput(e.target.value); setInputError(null); clearError(); }}
                                    disabled={isConnecting || isImporting || isLoadingHook}
                                    className={`flex-grow ${inputError ? "border-red-500" : ""}`}
                                />
                                <Button
                                    onClick={handleUrlImport}
                                    disabled={isConnecting || isImporting || isLoadingHook || !linkedInUrlInput}
                                    className="w-full sm:w-auto transition-colors hover:bg-opacity-90"
                                    style={{ 
                                        backgroundColor: LINKEDIN_BLUE, 
                                        color: 'white'
                                    }}
                                >
                                    {isImporting ? <LoadingSpinner className="mr-1 h-4 w-4"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                                    {isImporting ? "Importing..." : "Import Profile"}
                                </Button>
                            </div>
                            {inputError && <p className="text-xs text-red-500 mt-1 text-left px-1">{inputError}</p>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}