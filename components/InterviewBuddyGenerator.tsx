import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toggle } from "@/components/ui/toggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import InterviewQuestionList from "@/components/InterviewQuestionList";
import {
  FileText,
  Sparkles,
  Info,
  Save,
  Copy,
  Download,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Target,
  HelpCircle,
  RefreshCw
} from "lucide-react";

interface InterviewSession {
  id?: string;
  resumeId: string;
  jobTitle: string;
  jobDescription?: string;
  interviewType: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questions: InterviewQuestion[];
  generatedAt?: Date;
}

interface InterviewQuestion {
  id: string;
  question: string;
  suggestedAnswer: string;
  category: string;
  difficulty: string;
}

interface InterviewBuddyGeneratorProps {
  resumes: any[];
  initialResumeId?: string;
  initialJobTitle?: string;
  initialJobId?: string;
}

export default function InterviewBuddyGenerator({ resumes, initialResumeId = '', initialJobTitle = '', initialJobId = '' }: InterviewBuddyGeneratorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Form state
  const [resumeId, setResumeId] = useState<string>(initialResumeId);
  const [jobTitle, setJobTitle] = useState<string>(initialJobTitle);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'mixed'>('mixed');
  const [difficulty, setDifficulty] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  
  // Processing state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Result state
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // If initial job ID is provided, load job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!initialJobId) return;
      
      try {
        // Fetch job details from API
        const response = await fetch(`/api/jobs/${initialJobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const job = await response.json();
        
        // Update form with job details
        setJobTitle(job.title || '');
        setJobDescription(job.description || '');
      } catch (error) {
        console.error('Error fetching job details:', error);
        // Silently fail, we still have job title from URL params potentially
      }
    };
    
    if (initialJobId) {
      fetchJobDetails();
    }
  }, [initialJobId]);
  
  // Progress simulation for demo purposes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      setGenerationProgress(0);
      
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          // Increase by random amount between 5-15%
          const increment = Math.random() * 10 + 5;
          const newProgress = prev + increment;
          
          // Cap at 95% - the final 5% happens when generation completes
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 600);
    } else if (interviewSession) {
      // When generation completes, set to 100%
      setGenerationProgress(100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, interviewSession]);
  
  // Handle form submission
  const handleGenerateInterview = async () => {
    try {
      // Validate inputs
      if (!resumeId) {
        setError('Please select a resume');
        return;
      }
      
      if (!jobTitle && !jobDescription) {
        setError('Please provide either a job title or description');
        return;
      }
      
      setError(null);
      setIsGenerating(true);
      
      // Make API call to generate interview questions and answers
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          jobTitle,
          jobDescription,
          interviewType,
          difficulty,
          questionCount
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interview questions');
      }
      
      const data = await response.json();
      
      // Set the interview session data
      setInterviewSession({
        resumeId,
        jobTitle,
        jobDescription,
        interviewType,
        difficulty,
        questions: data.questions,
        generatedAt: new Date()
      });
      
      toast({
        title: "Interview Generated",
        description: `${data.questions.length} interview questions have been generated.`,
      });
    } catch (error: any) {
      console.error('Error generating interview:', error);
      setError(error.message || 'Failed to generate interview. Please try again.');
      toast({
        title: "Generation Failed",
        description: error.message || "There was an error generating your interview questions.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle save interview
  const handleSaveInterview = async () => {
    if (!user || !interviewSession) return;
    
    try {
      setIsSaving(true);
      
      // Save interview session to database
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          resume_id: interviewSession.resumeId,
          job_title: interviewSession.jobTitle,
          job_description: interviewSession.jobDescription,
          interview_type: interviewSession.interviewType,
          difficulty: interviewSession.difficulty,
          questions_answers: interviewSession.questions,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setIsSaved(true);
      setInterviewSession({
        ...interviewSession,
        id: data.id
      });
      
      toast({
        title: "Interview Saved",
        description: "Your interview session has been saved successfully.",
      });
      
      // Redirect to the saved session
      router.push(`/dashboard/interview-buddy/sessions/${data.id}`);
    } catch (error: any) {
      console.error('Error saving interview:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save your interview session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!interviewSession) return;
    
    try {
      // Format the interview session as text
      let copyText = `# Interview Preparation: ${interviewSession.jobTitle}\n\n`;
      
      interviewSession.questions.forEach((q, index) => {
        copyText += `## Question ${index + 1} (${q.category})\n\n`;
        copyText += `${q.question}\n\n`;
        copyText += `### Suggested Answer:\n\n`;
        copyText += `${q.suggestedAnswer}\n\n`;
        copyText += `---\n\n`;
      });
      
      await navigator.clipboard.writeText(copyText);
      
      toast({
        title: "Copied to Clipboard",
        description: "The interview questions and answers have been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try manually selecting the text.",
        variant: "destructive",
      });
    }
  };

  // Handle download as text file
  const handleDownload = () => {
    if (!interviewSession) return;
    
    try {
      // Format the interview session as text
      let downloadText = `# Interview Preparation: ${interviewSession.jobTitle}\n\n`;
      
      if (interviewSession.jobDescription) {
        downloadText += `## Job Description\n\n${interviewSession.jobDescription}\n\n---\n\n`;
      }
      
      interviewSession.questions.forEach((q, index) => {
        downloadText += `## Question ${index + 1} (${q.category})\n\n`;
        downloadText += `${q.question}\n\n`;
        downloadText += `### Suggested Answer:\n\n`;
        downloadText += `${q.suggestedAnswer}\n\n`;
        downloadText += `---\n\n`;
      });
      
      // Create blob and download link
      const blob = new Blob([downloadText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Interview-Prep-${interviewSession.jobTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your interview preparation is being downloaded as a text file.",
      });
    } catch (error) {
      console.error('Error downloading interview:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download interview preparation. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Regenerate with same settings
  const handleRegenerate = () => {
    if (isGenerating) return;
    
    setInterviewSession(null);
    setIsSaved(false);
    handleGenerateInterview();
  };

  return (
    <div className="space-y-6">
      {!interviewSession ? (
        /* Input Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Interview Questions
            </CardTitle>
            <CardDescription>
              Our AI will create tailored interview questions based on your resume and the job details
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Resume Selection */}
            <div className="space-y-2">
              <Label htmlFor="resumeSelect">Select Your Resume</Label>
              <Select value={resumeId} onValueChange={setResumeId}>
                <SelectTrigger id="resumeSelect">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your resume helps our AI tailor questions to your background
              </p>
            </div>
            
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Software Engineer, Product Manager, etc."
              />
            </div>
            
            {/* Job Description */}
            <div className="space-y-2">
              <Label htmlFor="jobDescription" className="flex items-center gap-1">
                Job Description <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description for more tailored questions"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Adding a job description will result in more specific interview questions
              </p>
            </div>
            
            {/* Interview Type */}
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <RadioGroup
                value={interviewType}
                onValueChange={(value) => setInterviewType(value as 'technical' | 'behavioral' | 'mixed')}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="technical" id="technical" />
                  <Label htmlFor="technical" className="cursor-pointer">Technical</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="behavioral" id="behavioral" />
                  <Label htmlFor="behavioral" className="cursor-pointer">Behavioral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed" className="cursor-pointer">Mixed (Both)</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Interview Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as 'basic' | 'intermediate' | 'advanced')}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic" className="cursor-pointer">Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="cursor-pointer">Intermediate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="cursor-pointer">Advanced</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Number of Questions */}
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuestionCount(Math.max(3, questionCount - 1))}
                  disabled={questionCount <= 3}
                >
                  -
                </Button>
                <span className="w-8 text-center">{questionCount}</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuestionCount(Math.min(10, questionCount + 1))}
                  disabled={questionCount >= 10}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span>Use specific job details for better results</span>
              </div>
            </div>
            <Button onClick={handleGenerateInterview} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Interview
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* Results Display */
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Interview Preparation</CardTitle>
                  <CardDescription>{jobTitle}</CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerate} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Regenerate
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={handleSaveInterview} 
                    disabled={isSaving || isSaved}
                  >
                    {isSaving ? (
                      <LoadingSpinner className="h-4 w-4 mr-1" />
                    ) : isSaved ? (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {/* Questions and Answers */}
          <InterviewQuestionList questions={interviewSession.questions} />
          
          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Preparation</h3>
                  </div>
                  <ul className="text-sm space-y-1 ml-7">
                    <li>Research the company thoroughly</li>
                    <li>Practice your answers out loud</li>
                    <li>Prepare your own questions to ask</li>
                    <li>Review the job description multiple times</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">During the Interview</h3>
                  </div>
                  <ul className="text-sm space-y-1 ml-7">
                    <li>Use the STAR method for behavioral questions</li>
                    <li>Take time to think before answering</li>
                    <li>Ask for clarification if needed</li>
                    <li>Show enthusiasm and positive body language</li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">Technical Questions</h3>
                  </div>
                  <ul className="text-sm space-y-1 ml-7">
                    <li>Be honest about your knowledge levels</li>
                    <li>Walk through your thought process</li>
                    <li>It's okay to say "I don't know, but here's how I'd find out"</li>
                    <li>Provide specific examples from past work when possible</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-medium">Follow-up</h3>
                  </div>
                  <ul className="text-sm space-y-1 ml-7">
                    <li>Send a thank-you email within 24 hours</li>
                    <li>Reference specific conversation topics</li>
                    <li>Express continued interest in the position</li>
                    <li>Follow up if you haven't heard back in a week</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      )}
    </div>
  );
}