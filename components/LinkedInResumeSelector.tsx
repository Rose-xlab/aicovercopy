// Remove "use client" from here
// Instead, parent component should include "use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BadgeCheck, Linkedin, ArrowRightCircle, Eye, FileText } from "lucide-react";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";
import { formatDistance } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkedInResumeProps {
  onSelect: (resumeId: string, resumeData: any) => void;
  onCancel: () => void;
}

export function LinkedInResumeSelector({ onSelect, onCancel }: LinkedInResumeProps) {
  const [linkedInResumes, setLinkedInResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { profile, isConnected, connectLinkedIn, generateResume } = useLinkedInIntegration();

  // Load LinkedIn-sourced resumes
  useEffect(() => {
    const fetchLinkedInResumes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError("Please log in to access your LinkedIn resumes");
          return;
        }

        // Fetch resumes that were created from LinkedIn
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('source', 'linkedin')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setLinkedInResumes(data || []);
      } catch (err: any) {
        console.error('Error fetching LinkedIn resumes:', err);
        setError(err.message || 'Failed to load LinkedIn resumes');
        toast({
          title: "Error",
          description: "Failed to load LinkedIn resumes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkedInResumes();
  }, [supabase, toast]);

  // Create a new resume from LinkedIn
  const handleCreateLinkedInResume = async () => {
    try {
      setIsLoading(true);
      
      if (!isConnected) {
        await connectLinkedIn();
        return;
      }
      
      const resumeId = await generateResume();
      
      if (resumeId) {
        toast({
          title: "Resume Created",
          description: "Your LinkedIn resume has been successfully created.",
        });
        
        // Fetch the new resume details
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();
          
        if (error) throw error;
        
        // Add to the list and select it
        setLinkedInResumes([data, ...linkedInResumes]);
        onSelect(resumeId, data);
      }
    } catch (err: any) {
      console.error('Error creating LinkedIn resume:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to create resume from LinkedIn profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a resume
  const handleSelectResume = (resumeId: string, resumeData: any) => {
    onSelect(resumeId, resumeData);
  };

  // Handle view resume action
  const handleViewResume = (resumeId: string) => {
    router.push(`/dashboard/resumes/${resumeId}`);
  };

  const EmptyState = () => (
    <div className="text-center py-8">
      <Linkedin className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-70" />
      <h3 className="text-lg font-medium mb-2">No LinkedIn resumes yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Create a resume from your LinkedIn profile to use it for your cover letter. This helps personalize your application with your professional experience.
      </p>
      <Button 
        onClick={handleCreateLinkedInResume}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isConnected ? (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Create Resume from LinkedIn
          </>
        ) : (
          <>
            <Linkedin className="mr-2 h-4 w-4" />
            Connect LinkedIn
          </>
        )}
      </Button>
    </div>
  );

  // Loading skeleton UI
  if (isLoading && linkedInResumes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Linkedin className="mr-2 h-5 w-5 text-blue-500" />
          LinkedIn Resumes
        </CardTitle>
        <CardDescription>
          Select a resume created from your LinkedIn profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : linkedInResumes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {linkedInResumes.map((resume) => (
              <div 
                key={resume.id} 
                className="border p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => handleSelectResume(resume.id, resume)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 p-2 bg-blue-100 rounded-md">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{resume.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resume.personal_info?.firstName} {resume.personal_info?.lastName}
                        {resume.personal_info?.title && ` • ${resume.personal_info?.title}`}
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewResume(resume.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {isConnected && (
              <Button 
                variant="outline" 
                className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={handleCreateLinkedInResume}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Creating Resume...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create New LinkedIn Resume
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        {!isConnected && linkedInResumes.length === 0 && (
          <Button 
            onClick={handleCreateLinkedInResume}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Linkedin className="mr-2 h-4 w-4" />
            Connect LinkedIn
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}