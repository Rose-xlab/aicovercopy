"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import CoverLetterEditor from "@/components/CoverLetterEditor";
import { FileText, Sparkles, History, ArrowLeft, Clock, ExternalLink, Upload, Linkedin, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Filename: app/dashboard/cover-letters/page.tsx
export default function CoverLettersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [cv, setCv] = useState<{ 
    file: File | null; 
    status: 'idle' | 'uploading' | 'success' | 'error';
    name?: string;
    uploadDate?: string;
  }>({
    file: null,
    status: 'idle'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [showLinkedInInput, setShowLinkedInInput] = useState(false);
  const [linkedInStatus, setLinkedInStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved CV and LinkedIn data on mount
  useEffect(() => {
    // In a real implementation, we would fetch this data from the server
    // For now, we'll use localStorage as a demonstration
    const savedCV = localStorage.getItem('userCV');
    const savedLinkedIn = localStorage.getItem('userLinkedIn');
    
    if (savedCV) {
      try {
        const parsedCV = JSON.parse(savedCV);
        setCv({ 
          file: null, // We can't reconstruct the File object, but we have the name
          status: 'success',
          name: parsedCV.name,
          uploadDate: parsedCV.date
        });
      } catch (e) {
        console.error('Error parsing saved CV data', e);
      }
    }
    
    if (savedLinkedIn) {
      setLinkedInUrl(savedLinkedIn);
      setLinkedInStatus('connected');
    }
  }, []);

  // Set initial tab from URL parameter if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "create" || tabParam === "recent")) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/cover-letters?tab=${value}`, { scroll: false });
  };

  const handleJobDescriptionSubmit = async (description: string) => {
    setJobDescription(description);
    
    // In a real implementation, you would call your API to generate the letter
    // Mock implementation for demo purposes
    setGeneratedLetter("Sample generated letter content which would be replaced with real AI-generated content based on the job description and user profile...");
    setStep(2);
  };

  const handleLinkedInConnect = () => {
    if (!linkedInUrl || !linkedInUrl.includes('linkedin.com')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }
    
    setLinkedInStatus('connecting');
    
    // Simulate LinkedIn connection
    setTimeout(() => {
      setLinkedInStatus('connected');
      // Save LinkedIn information
      localStorage.setItem('userLinkedIn', linkedInUrl);
      
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been successfully connected.",
      });
    }, 2000);
  };

  const handleDisconnectLinkedIn = () => {
    setLinkedInStatus('disconnected');
    setLinkedInUrl("");
    localStorage.removeItem('userLinkedIn');
    toast({
      title: "LinkedIn Disconnected",
      description: "Your LinkedIn profile has been disconnected.",
    });
  };

  const handleRemoveCV = () => {
    setCv({ file: null, status: 'idle' });
    localStorage.removeItem('userCV');
    toast({
      title: "CV Removed",
      description: "Your CV has been removed.",
    });
  };

  const recentLetters = [
    { id: '1', title: 'Marketing Manager at Company A', date: '2023-05-10', timeAgo: '2 hours ago' },
    { id: '2', title: 'Software Developer at Company B', date: '2023-05-08', timeAgo: '2 days ago' },
    { id: '3', title: 'Project Coordinator at Company C', date: '2023-05-05', timeAgo: '5 days ago' },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Cover Letters</h1>
        <p className="text-muted-foreground">Create and manage your personalized cover letters</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="create">
            <Sparkles className="h-4 w-4 mr-2" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="recent">
            <History className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          {step === 1 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* CV Upload Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Your CV
                    </CardTitle>
                    <CardDescription>
                      Enhance your cover letter with information from your CV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      type="file"
                      id="cv-upload"
                      className="hidden"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const selectedFile = e.target.files[0];
                          setCv({ file: selectedFile, status: 'uploading' });
                          
                          // Simulate file upload with progress
                          let progress = 0;
                          const interval = setInterval(() => {
                            progress += 10;
                            setUploadProgress(progress);
                            
                            if (progress >= 100) {
                              clearInterval(interval);
                              const currentDate = new Date().toISOString();
                              
                              // Save CV information to local storage/session
                              const cvData = {
                                name: selectedFile.name,
                                size: selectedFile.size,
                                type: selectedFile.type,
                                date: currentDate
                              };
                              localStorage.setItem('userCV', JSON.stringify(cvData));
                              
                              setCv({ 
                                file: selectedFile, 
                                status: 'success',
                                name: selectedFile.name,
                                uploadDate: currentDate
                              });
                              
                              toast({
                                title: "CV uploaded successfully",
                                description: `${selectedFile.name} has been uploaded and will be used for your cover letters.`,
                              });
                            }
                          }, 300);
                        }
                      }}
                    />
                    
                    {cv.status === 'idle' && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <Upload className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Click to upload your CV
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, or DOCX (max 5MB)
                        </p>
                      </div>
                    )}
                    
                    {cv.status === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{cv.file?.name}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                    
                    {cv.status === 'success' && (
                      <Alert className="bg-green-500/10 border-green-500/30">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          <div className="flex-1">
                            <AlertDescription className="text-green-500 font-medium">
                              {cv.file?.name || cv.name} uploaded successfully
                            </AlertDescription>
                            {cv.uploadDate && (
                              <p className="text-xs text-muted-foreground">
                                Uploaded on {new Date(cv.uploadDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Replace
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveCV}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {/* LinkedIn Connect Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Linkedin className="mr-2 h-5 w-5" /> 
                      Connect LinkedIn
                    </CardTitle>
                    <CardDescription>
                      Import your professional experience from LinkedIn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {linkedInStatus === 'disconnected' && (
                      <div className="space-y-3">
                        <Input
                          placeholder="https://www.linkedin.com/in/yourprofile"
                          value={linkedInUrl}
                          onChange={(e) => setLinkedInUrl(e.target.value)}
                        />
                        <Button 
                          onClick={handleLinkedInConnect}
                          className="w-full"
                        >
                          <Linkedin className="mr-2 h-4 w-4" />
                          Connect with LinkedIn
                        </Button>
                      </div>
                    )}
                    
                    {linkedInStatus === 'connecting' && (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                        <span>Connecting to LinkedIn...</span>
                      </div>
                    )}
                    
                    {linkedInStatus === 'connected' && (
                      <Alert className="bg-green-500/10 border-green-500/30">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          <div className="flex-1">
                            <AlertDescription className="text-green-500 font-medium">
                              LinkedIn profile connected
                            </AlertDescription>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {linkedInUrl}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnectLinkedIn}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Job Description Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Cover Letter</CardTitle>
                  <CardDescription>
                    Enter a job description or URL to generate a personalized cover letter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JobDescriptionInput 
                    onSubmit={handleJobDescriptionSubmit} 
                    cvUploaded={cv.status === 'success'}
                    linkedInConnected={linkedInStatus === 'connected'}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job Description
              </Button>
              <CoverLetterEditor
                initialContent={generatedLetter}
                jobDescription={jobDescription}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cover Letters</CardTitle>
              <CardDescription>
                Quick access to your recently created cover letters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLetters.length > 0 ? (
                  <div className="divide-y">
                    {recentLetters.map((letter) => (
                      <div key={letter.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start">
                          <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{letter.title}</p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>{letter.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-9 sm:ml-0">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No cover letters yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any cover letters recently.
                    </p>
                    <Button onClick={() => {
                      setActiveTab("create");
                      handleTabChange("create");
                    }}>
                      Create a New Cover Letter
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Link href="/dashboard/history">
                <Button variant="link">
                  View your full history
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}