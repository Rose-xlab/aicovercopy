"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { 
  FileText, 
  Sparkles, 
  History, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Save,
  Download,
  Copy,
  CheckCircle2,
  Info
} from "lucide-react";
import { CVManager, CvFile } from '../../../components/CVManager';
import { LinkedInManager, LinkedInProfile } from "../../../components/LinkedInManager";
import { DataSourceSelector } from "../../../components/DataSourceSelector";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import Link from "next/link";

export default function CoverLetterGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // State for tabs and creation flow
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);
  
  // Job description and letter content
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  
  // Data sources state
  const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [dataSource, setDataSource] = useState<'cv' | 'linkedin' | 'both' | 'none'>('none');
  
  // Recent letters (mock data for now)
  const [recentLetters, setRecentLetters] = useState([
    { id: '1', title: 'Marketing Manager at Company A', date: '2023-05-10', timeAgo: '2 hours ago' },
    { id: '2', title: 'Software Developer at Company B', date: '2023-05-08', timeAgo: '2 days ago' },
    { id: '3', title: 'Project Coordinator at Company C', date: '2023-05-05', timeAgo: '5 days ago' },
  ]);
  
  // Set initial tab from URL parameter if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "create" || tabParam === "recent")) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Load CV files from localStorage or database
  const loadCvFiles = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_cvs')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          const formattedCvs: CvFile[] = data.map(cv => ({
            id: cv.id,
            name: cv.filename,
            size: cv.filesize,
            type: cv.filetype,
            uploadDate: cv.uploaded_at,
            isSelected: cv.is_selected
          }));
          
          setCvFiles(formattedCvs);
        }
      } catch (error) {
        console.error('Error loading CV files:', error);
        // Fallback to localStorage
        const savedCVs = localStorage.getItem('userCVs');
        if (savedCVs) {
          try {
            setCvFiles(JSON.parse(savedCVs));
          } catch (e) {
            console.error('Error parsing saved CV data', e);
          }
        }
      }
    } else {
      // For non-logged in users, use localStorage
      const savedCVs = localStorage.getItem('userCVs');
      if (savedCVs) {
        try {
          setCvFiles(JSON.parse(savedCVs));
        } catch (e) {
          console.error('Error parsing saved CV data', e);
        }
      }
    }
  };
  
  // Load LinkedIn profile from localStorage or database
  const loadLinkedInProfile = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('linkedin_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" which is expected
          throw error;
        }
        
        if (data) {
          setLinkedInProfile(data);
        }
      } catch (error) {
        console.error('Error loading LinkedIn profile:', error);
        // Fallback to localStorage
        const savedProfile = localStorage.getItem('linkedInProfile');
        if (savedProfile) {
          try {
            setLinkedInProfile(JSON.parse(savedProfile));
          } catch (e) {
            console.error('Error parsing saved LinkedIn data', e);
          }
        }
      }
    } else {
      // For non-logged in users, use localStorage
      const savedProfile = localStorage.getItem('linkedInProfile');
      if (savedProfile) {
        try {
          setLinkedInProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error('Error parsing saved LinkedIn data', e);
        }
      }
    }
  };
  
  // Load data on initial component mount
  useEffect(() => {
    loadCvFiles();
    loadLinkedInProfile();
  }, [user]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/cover-letters?tab=${value}`, { scroll: false });
  };
  
  // Handle job description submit
  const handleJobDescriptionSubmit = (description: string, tone: string) => {
    setJobDescription(description);
    setSelectedTone(tone);
    
    // Extract job title and company name from the description (simplified)
    const titleMatch = description.match(/(?:position|job|role|opening)[:\s]+([^.,\n]+)/i);
    const companyMatch = description.match(/(?:company|organization|firm)[:\s]+([^.,\n]+)/i);
    
    if (titleMatch && titleMatch[1]) {
      setJobTitle(titleMatch[1].trim());
    }
    
    if (companyMatch && companyMatch[1]) {
      setCompanyName(companyMatch[1].trim());
    }
    
    // Move to data source selection
    setStep(2);
  };
  
  // Handle data source change
  const handleDataSourceChange = (source: 'cv' | 'linkedin' | 'both' | 'none') => {
    setDataSource(source);
  };
  
  // Prepare user profile data for AI generation based on selected data source
  const prepareUserProfileData = () => {
    let profileData: any = {};
    
    // Add CV data if selected
    if (dataSource === 'cv' || dataSource === 'both') {
      const selectedCv = cvFiles.find(cv => cv.isSelected);
      if (selectedCv) {
        profileData.cv = {
          filename: selectedCv.name,
          // In a real application, you would extract and parse CV content here
          content: "Sample CV content for demonstration purposes"
        };
      }
    }
    
    // Add LinkedIn data if selected
    if (dataSource === 'linkedin' || dataSource === 'both') {
      if (linkedInProfile) {
        profileData.linkedin = {
          profileUrl: linkedInProfile.profile_url,
          name: linkedInProfile.name,
          headline: linkedInProfile.headline,
          // In a real application, you would include more LinkedIn profile data
        };
      }
    }
    
    return profileData;
  };
  
  // Generate cover letter
  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    
    try {
      const profileData = prepareUserProfileData();
      
      if (user) {
        // For logged-in users, call the API to generate the letter
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobDescription,
            jobTitle,
            companyName,
            userProfile: profileData,
            tone: selectedTone,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate cover letter');
        }
        
        const data = await response.json();
        setGeneratedLetter(data.coverLetter);
      } else {
        // For demo mode, simulate API call
        setTimeout(() => {
          const demoLetter = `
Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle || '[JOB TITLE]'} position at ${companyName || '[COMPANY NAME]'}. With my background in technology and passion for innovation, I believe I would be a valuable addition to your team.

[This is a sample cover letter that would be generated by the AI based on the job description and your ${dataSource === 'both' ? 'CV and LinkedIn profile' : dataSource === 'cv' ? 'CV' : 'LinkedIn profile'}.]

The actual generated letter would be tailored to highlight your relevant skills and experience that match the job requirements. It would be written in a ${selectedTone} tone and formatted according to professional standards.

I look forward to the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.

Sincerely,
[Your Name]
          `;
          
          setGeneratedLetter(demoLetter);
        }, 2000);
      }
      
      // Move to cover letter editor
      setStep(3);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLetter(false);
    }
  };
  
  // Save cover letter
  const handleSaveCoverLetter = async () => {
    try {
      if (user) {
        // For logged-in users, save to the database
        const { data, error } = await supabase
          .from('cover_letters')
          .insert({
            user_id: user.id,
            job_description: jobDescription,
            job_title: jobTitle,
            company_name: companyName,
            content: generatedLetter,
            tone: selectedTone,
            data_source: dataSource,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        
        toast({
          title: "Cover Letter Saved",
          description: "Your cover letter has been saved successfully.",
        });
        
        // Refresh recent letters
        loadRecentLetters();
      } else {
        // For demo mode, show a message
        toast({
          title: "Demo Mode",
          description: "In a real application, your cover letter would be saved to your account.",
        });
      }
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Copy cover letter to clipboard
  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      
      toast({
        title: "Copied to Clipboard",
        description: "Your cover letter has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "There was an error copying to your clipboard. Please try manually selecting and copying the text.",
        variant: "destructive",
      });
    }
  };
  
  // Download cover letter
  const handleDownloadCoverLetter = async () => {
    try {
      // Create a blob with the cover letter text
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover Letter - ${jobTitle || 'Position'} at ${companyName || 'Company'}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your cover letter is being downloaded as a text file.",
      });
    } catch (error) {
      console.error('Error downloading cover letter:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Load recent cover letters
  const loadRecentLetters = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (data) {
          const formattedLetters = data.map(letter => {
            // Calculate relative time
            const date = new Date(letter.created_at);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            let timeAgo;
            if (diffInSeconds < 60) timeAgo = 'just now';
            else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
            else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
            else if (diffInSeconds < 604800) timeAgo = `${Math.floor(diffInSeconds / 86400)} days ago`;
            else timeAgo = date.toLocaleDateString();
            
            return {
              id: letter.id,
              title: `${letter.job_title || 'Position'} at ${letter.company_name || 'Company'}`,
              date: letter.created_at,
              timeAgo,
            };
          });
          
          setRecentLetters(formattedLetters);
        }
      } catch (error) {
        console.error('Error loading recent cover letters:', error);
      }
    }
  };
  
  // Load recent letters on component mount
  useEffect(() => {
    if (user) {
      loadRecentLetters();
    }
  }, [user]);
  
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
          {step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* CV Manager */}
                <CVManager />
                
                {/* LinkedIn Manager */}
                <LinkedInManager />
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
                    cvUploaded={cvFiles.some(cv => cv.isSelected)}
                    linkedInConnected={linkedInProfile?.status === 'connected'}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {step === 2 && (
            <div>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job Description
              </Button>
              
              <DataSourceSelector 
                cvFiles={cvFiles}
                linkedInProfile={linkedInProfile}
                onDataSourceChange={handleDataSourceChange}
                onCreateCoverLetter={handleGenerateCoverLetter}
              />
            </div>
          )}
          
          {step === 3 && (
            <div>
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex-1">
                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <AlertDescription className="text-green-500 text-sm">
                      Your cover letter has been generated using {
                        dataSource === 'both' 
                          ? 'both your CV and LinkedIn profile' 
                          : dataSource === 'cv' 
                            ? 'your CV' 
                            : 'your LinkedIn profile'
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Cover Letter</CardTitle>
                  <CardDescription>
                    {jobTitle ? `For ${jobTitle}` : 'For the position'} 
                    {companyName ? ` at ${companyName}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-muted/40 p-4 min-h-[300px] mb-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {generatedLetter}
                    </pre>
                  </div>
                  
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    <AlertDescription className="text-blue-500 text-sm">
                      You can edit, save, or download this cover letter. Make any adjustments needed before saving.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 justify-end">
                  <Button variant="outline" onClick={handleCopyCoverLetter}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCoverLetter}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleSaveCoverLetter}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Cover Letter
                  </Button>
                </CardFooter>
              </Card>
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
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
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