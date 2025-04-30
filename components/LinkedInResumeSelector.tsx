// components/LinkedInResumeSelector.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BadgeCheck, Linkedin, ArrowRightCircle, Eye, FileText, AlertCircle } from "lucide-react";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";
import { formatDistance } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/types/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Ensure Alert components are imported

// Define type for Resumes based on Supabase schema
type Resume = Database['public']['Tables']['resumes']['Row'];

// Define expected structure within the personal_info JSON column
interface ResumePersonalInfo {
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    // Add other expected fields inside personal_info if needed for display
}

interface LinkedInResumeProps {
    // For Prop Serialization Warning (ts 71007): Ensure the functions passed here
    // from the parent component are wrapped in useCallback.
    onSelect: (resumeId: string, resumeData: Resume) => void;
    onCancel: () => void;
}

export function LinkedInResumeSelector({ onSelect, onCancel }: LinkedInResumeProps) {
    const [linkedInResumes, setLinkedInResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Local loading state for fetching resumes list
    const [isCreating, setIsCreating] = useState(false); // Local loading state for creation action
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createBrowserClient();
    const { isConnected, connectLinkedIn, generateResume, isLoading: isHookLoading, isGenerating: isHookGenerating } = useLinkedInIntegration();

    // Fetch LinkedIn-sourced resumes
    const fetchLinkedInResumes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // setError("Please log in to access your LinkedIn resumes"); // Or handle silently
                console.log("No session for fetching resumes.");
                setLinkedInResumes([]); // Ensure empty list if not logged in
                return;
            }

            const { data, error: dbError } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_imported', true) // Flag for LinkedIn-sourced resumes
                .order('updated_at', { ascending: false });

            if (dbError) throw dbError;
            setLinkedInResumes(data || []);
        } catch (err: any) {
            console.error('Error fetching LinkedIn resumes:', err);
            setError(err.message || 'Failed to load LinkedIn resumes');
            // Toast might be redundant if parent shows error state
            // toast({ title: "Error", description: "Failed to load LinkedIn resumes.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [supabase]); // Removed toast dependency if error is displayed locally

    // Load resumes on mount
    useEffect(() => {
        fetchLinkedInResumes();
    }, [fetchLinkedInResumes]);

    // Create a new resume from LinkedIn
    const handleCreateLinkedInResume = async () => {
        setIsCreating(true);
        setError(null);
        try {
            if (!isConnected) {
                await connectLinkedIn(); // This redirects, handled by hook/page reload
                return;
            }
            // If already connected, trigger resume generation via the hook
            const resumeId = await generateResume(); // Hook handles toast/errors

            if (resumeId) {
                // Fetch the newly created resume details to pass back up
                const { data: newResume, error: fetchNewError } = await supabase
                    .from('resumes')
                    .select('*')
                    .eq('id', resumeId)
                    .single();

                if (fetchNewError) throw fetchNewError;

                if (newResume) {
                    setLinkedInResumes([newResume, ...linkedInResumes]);
                    onSelect(resumeId, newResume); // Select the newly created one
                } else {
                    throw new Error("Newly created resume could not be retrieved.");
                }
            }
            // If resumeId is null, the hook should have set an error state already
        } catch (err: any) {
            console.error('Error in handleCreateLinkedInResume:', err);
            setError(err.message || "Failed to create or connect for resume generation.");
        } finally {
            setIsCreating(false);
        }
    };

    // Handle selecting an existing resume
    const handleSelectResume = (resumeId: string, resumeData: Resume) => {
        onSelect(resumeId, resumeData);
    };

    // Handle view resume action
    const handleViewResume = (resumeId: string) => {
        router.push(`/dashboard/resumes/${resumeId}`);
    };

    // --- Render Logic ---

    const EmptyState = () => (
        <div className="text-center py-8">
            <Linkedin className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-70" />
            <h3 className="text-lg font-medium mb-2">No LinkedIn resumes yet</h3>
            {/* Escaped apostrophe */}
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create a resume from your LinkedIn profile to use it for your cover letter. This helps personalize your application with your professional experience.
            </p>
            {/* Ensure correct loading state check */}
            <Button
                onClick={handleCreateLinkedInResume}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isCreating || isHookLoading || isHookGenerating} // Use combined relevant loading states
            >
                {isCreating || isHookGenerating ? <LoadingSpinner className="mr-2 h-4 w-4" /> : // Use hook's generating state too
                 isConnected ? <FileText className="mr-2 h-4 w-4" /> :
                 <Linkedin className="mr-2 h-4 w-4" />
                }
                {isCreating || isHookGenerating ? 'Processing...' : isConnected ? 'Create New Resume from LinkedIn' : 'Connect LinkedIn to Create'}
            </Button>
        </div>
    );

     // Loading skeleton UI
     if (isLoading && linkedInResumes.length === 0) {
         return (
            <Card className="w-full">
                 <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                 <CardContent className="space-y-4"><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></CardContent>
            </Card>
         );
     }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Linkedin className="mr-2 h-5 w-5 text-blue-500" /> LinkedIn Resumes
                </CardTitle>
                <CardDescription>Select a resume previously created from your LinkedIn profile</CardDescription>
            </CardHeader>
            <CardContent>
                {error ? (
                     <Alert variant="destructive"><AlertCircle className="h-4 w-4 mr-2" /><AlertDescription>{error}</AlertDescription></Alert>
                ) : linkedInResumes.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4">
                        {linkedInResumes.map((resume) => {
                            // Safely access personal_info with type assertion and optional chaining
                            const pInfo = resume.personal_info as ResumePersonalInfo | null;
                            return (
                                <div
                                    key={resume.id}
                                    className="border p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                                    onClick={() => handleSelectResume(resume.id, resume)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 p-2 bg-blue-100 rounded-md"><Linkedin className="h-4 w-4 text-blue-600" /></div>
                                            <div>
                                                <h3 className="font-medium">{resume.title || `Resume ${resume.id.substring(0, 6)}`}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {/* Safely access nested properties */}
                                                    {pInfo?.firstName || ''} {pInfo?.lastName || ''}
                                                    {(pInfo?.title) && ` • ${pInfo.title}`}
                                                </p>
                                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                                    <BadgeCheck className="mr-1 h-3 w-3 text-blue-500" />
                                                    <span>LinkedIn-sourced</span>
                                                    {resume.updated_at && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <span>Updated {formatDistance(new Date(resume.updated_at), new Date(), { addSuffix: true })}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewResume(resume.id); }}>
                                             <Eye className="h-4 w-4" />
                                         </Button>
                                    </div>
                                </div>
                            );
                        })}
                         {/* Button to create a *new* one even if some exist */}
                         {isConnected && (
                             <Button variant="outline" className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleCreateLinkedInResume} disabled={isCreating || isHookLoading || isHookGenerating}>
                                 {isCreating || isHookGenerating ? (<><LoadingSpinner className="mr-2"/>Creating...</>) : (<><FileText className="mr-2 h-4 w-4" />Create Another LinkedIn Resume</>)}
                            </Button>
                         )}
                         {/* Show connect button if list is displayed but user is not connected */}
                         {!isConnected && linkedInResumes.length > 0 && (
                              <Button variant="outline" className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleCreateLinkedInResume} disabled={isCreating || isHookLoading || isHookGenerating}>
                                   <Linkedin className="mr-2 h-4 w-4" /> Connect LinkedIn to Create New Resume
                              </Button>
                         )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </CardFooter>
        </Card>
    );
}