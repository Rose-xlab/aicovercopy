"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLinkedInIntegration } from "@/lib/hooks/useLinkedInIntegration";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  FileText, 
  Linkedin, 
  ArrowRightCircle, 
  AlertCircle, 
  Sparkles,
  BadgeCheck,
  Calendar,
  FileSpreadsheet
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { LinkedInResumeSelector } from "./LinkedInResumeSelector";
import { EnhancedDataSourceSelector } from "@/components/DataSourceSelector";

// Define a type for the resume data with source property
interface ResumeData {
  id: string;
  title: string;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string;
  personal_info: any;
  education: any;
  work_experience: any;
  skills: any;
  is_imported?: boolean | null;
  // Add the source property explicitly
  source?: 'cv' | 'linkedin';
  // Add any other properties from the database schema
  [key: string]: any;
}

interface ResumeSourceSelectorProps {
  onContinue: (resumeData: ResumeData, dataSource: 'cv' | 'linkedin' | 'both' | 'none') => void;
}

export function ResumeSourceSelector({ onContinue }: ResumeSourceSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>("unified");
  const [cvResumes, setCvResumes] = useState<ResumeData[]>([]);
  const [linkedinResumes, setLinkedinResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [dataSource, setDataSource] = useState<'cv' | 'linkedin' | 'both' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const [showLinkedInSelector, setShowLinkedInSelector] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const { isConnected, connectLinkedIn } = useLinkedInIntegration();

  // Listen for custom events from EnhancedDataSourceSelector
  useEffect(() => {
    const handleDataSourceSelected = (event: CustomEvent) => {
      const { source, resumeData } = event.detail;
      setDataSource(source);
      if (resumeData) {
        setSelectedResume(resumeData);
      }
    };

    const handleCreateCoverLetter = (event: CustomEvent) => {
      const { source, data } = event.detail;
      if (data) {
        onContinue(data, source);
      }
    };

    // Add event listeners
    document.addEventListener('dataSourceSelected', handleDataSourceSelected as EventListener);
    document.addEventListener('createCoverLetter', handleCreateCoverLetter as EventListener);

    // Clean up
    return () => {
      document.removeEventListener('dataSourceSelected', handleDataSourceSelected as EventListener);
      document.removeEventListener('createCoverLetter', handleCreateCoverLetter as EventListener);
    };
  }, [onContinue]);

  useEffect(() => {
    const fetchAllResumes = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all resumes
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Separate resumes by source
          // Add a default source property if it doesn't exist
          const processedData = data.map(resume => ({
            ...resume,
            source: resume.is_imported ? 'linkedin' as const : 'cv' as const
          }));
          
          // Now filter using the source property
          const cvSourced = processedData.filter(resume => resume.source === 'cv');
          const linkedinSourced = processedData.filter(resume => resume.source === 'linkedin');
          
          setCvResumes(cvSourced);
          setLinkedinResumes(linkedinSourced);
          
          // Auto-select the most recently updated resume if available
          if (processedData.length > 0) {
            const mostRecent = processedData[0];
            setSelectedResume(mostRecent);
            setDataSource(mostRecent.source);
          }
        }
      } catch (err: any) {
        console.error('Error fetching resumes:', err);
        setError(err.message || 'Failed to load resumes');
        toast({
          title: "Error",
          description: "Failed to load your resumes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllResumes();
  }, [user, supabase, toast]);

  // Handle resume selection
  const handleSelectResume = (resume: ResumeData) => {
    setSelectedResume(resume);
    setDataSource(resume.source === 'linkedin' ? 'linkedin' : 'cv');
  };

  // Handle continuing with selected resume
  const handleContinue = () => {
    if (!selectedResume) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume to continue.",
        variant: "destructive",
      });
      return;
    }
    
    onContinue(selectedResume, dataSource);
  };

  // Handle LinkedIn resume selection from the specialized selector
  const handleLinkedInResumeSelected = (resumeId: string, resumeData: ResumeData) => {
    setShowLinkedInSelector(false);
    setSelectedResume(resumeData);
    setDataSource('linkedin');
  };

  // Handle creating a new LinkedIn resume
  const handleCreateLinkedInResume = () => {
    setShowLinkedInSelector(true);
  };

  // Loading state
  if (isLoading && cvResumes.length === 0 && linkedinResumes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center p-12">
          <LoadingSpinner className="mr-2" />
          <span>Loading your resumes...</span>
        </CardContent>
      </Card>
    );
  }

  // No resumes state
  if (cvResumes.length === 0 && linkedinResumes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select a Resume</CardTitle>
          <CardDescription>
            Choose a resume to use for your cover letter
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">No resumes found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need to create a resume first before generating a cover letter. You can create one from scratch,
            import one, or generate one from your LinkedIn profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/dashboard/resumes/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Create New Resume
            </Button>
            {isConnected ? (
              <Button 
                variant="outline" 
                onClick={handleCreateLinkedInResume}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                Create from LinkedIn
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => connectLinkedIn()}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                Connect LinkedIn
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show LinkedIn resume selector when requested
  if (showLinkedInSelector) {
    return (
      <LinkedInResumeSelector 
        onSelect={handleLinkedInResumeSelected}
        onCancel={() => setShowLinkedInSelector(false)}
      />
    );
  }

  // Default unified view
  if (activeTab === "unified") {
    return (
      <EnhancedDataSourceSelector
        cvFiles={cvResumes.map(resume => ({
          id: resume.id,
          name: resume.title,
          type: 'docx',
          size: 0,
          uploadDate: resume.created_at || '',
          isSelected: selectedResume?.id === resume.id,
          metadata: resume
        }))}
        linkedInProfile={isConnected ? { 
          id: 'linkedin', 
          user_id: user?.id || '', 
          profile_url: '', 
          status: 'connected',
          last_synced: new Date().toISOString() 
        } : null}
      />
    );
  }

  // Legacy tabbed view as fallback
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select a Resume</CardTitle>
        <CardDescription>
          Choose a resume to use as a data source for your cover letter
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cv" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Standard Resumes
              {cvResumes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {cvResumes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn Resumes
              {linkedinResumes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {linkedinResumes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cv" className="mt-6">
            {cvResumes.length > 0 ? (
              <div className="space-y-4">
                {cvResumes.map(resume => (
                  <div 
                    key={resume.id} 
                    className={`border p-4 rounded-lg cursor-pointer transition-colors ${selectedResume?.id === resume.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => handleSelectResume(resume)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="p-2 bg-primary/10 rounded mr-3 mt-1">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{resume.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {resume.personal_info?.firstName} {resume.personal_info?.lastName}
                            {resume.personal_info?.title && ` • ${resume.personal_info?.title}`}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {resume.updated_at ? (
                                `Updated ${format(new Date(resume.updated_at), 'MMMM d, yyyy')}`
                              ) : (
                                `Created ${format(new Date(resume.created_at || ''), 'MMMM d, yyyy')}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedResume?.id === resume.id && (
                        <Badge className="bg-primary text-primary-foreground">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
                <h3 className="text-lg font-medium mb-2">No standard resumes</h3>
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created or uploaded any standard resumes yet.
                </p>
                <Button onClick={() => router.push('/dashboard/resumes/new')}>
                  Create a Resume
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="linkedin" className="mt-6">
            {linkedinResumes.length > 0 ? (
              <div className="space-y-4">
                {linkedinResumes.map(resume => (
                  <div 
                    key={resume.id} 
                    className={`border p-4 rounded-lg cursor-pointer transition-colors ${selectedResume?.id === resume.id ? 'border-blue-500 bg-blue-50/50' : 'hover:border-blue-300'}`}
                    onClick={() => handleSelectResume(resume)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded mr-3 mt-1">
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{resume.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {resume.personal_info?.firstName} {resume.personal_info?.lastName}
                            {resume.personal_info?.title && ` • ${resume.personal_info?.title}`}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              LinkedIn-sourced
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {resume.updated_at ? (
                                `Updated ${format(new Date(resume.updated_at), 'MMMM d, yyyy')}`
                              ) : (
                                `Created ${format(new Date(resume.created_at || ''), 'MMMM d, yyyy')}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedResume?.id === resume.id && (
                        <Badge className="bg-blue-600 hover:bg-blue-700">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6">
                  <Separator className="my-4" />
                  <Button 
                    onClick={handleCreateLinkedInResume}
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    variant="outline"
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    Create New LinkedIn Resume
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Linkedin className="h-12 w-12 text-blue-500 mx-auto mb-4 opacity-70" />
                <h3 className="text-lg font-medium mb-2">No LinkedIn resumes yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Generate a resume from your LinkedIn profile to use it for your cover letter. This helps personalize your application.
                </p>
                {isConnected ? (
                  <Button 
                    onClick={handleCreateLinkedInResume}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate LinkedIn Resume
                  </Button>
                ) : (
                  <Button 
                    onClick={() => connectLinkedIn()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    Connect LinkedIn
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleContinue} 
          disabled={!selectedResume}
          className="ml-auto"
        >
          Continue with {selectedResume ? (selectedResume.title || 'Selected Resume') : 'Resume'}
          <ArrowRightCircle className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}