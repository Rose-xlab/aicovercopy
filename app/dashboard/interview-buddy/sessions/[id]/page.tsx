"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import InterviewQuestionList from "@/components/InterviewQuestionList";
import { cn } from "@/lib/utils"; // Import cn utility for conditional classes
import {
  ArrowLeft,
  Download,
  Copy,
  Trash2,
  Save,
  MessagesSquare,
  FileText,
  StickyNote,
  Calendar,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InterviewSession, InterviewSessionResponse, mapDbToInterviewSession } from "@/types/interview";

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  const sessionId = params.id as string;
  
  // Fetch interview session data
  useEffect(() => {
    const fetchInterviewSession = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch interview session
        const { data, error } = await supabase
          .from('interview_sessions')
          .select(`
            id, 
            user_id, 
            resume_id, 
            job_title, 
            job_description, 
            interview_type, 
            difficulty, 
            questions_answers, 
            created_at, 
            updated_at, 
            notes,
            tags,
            resumes(title)
          `)
          .eq('id', sessionId)
          .single();
          
        if (error) throw error;
        
        // Check if the session belongs to the user
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this interview session');
        }
        
        // Map DB format to application format
        const mappedSession = mapDbToInterviewSession(data as any);
        setSession(mappedSession);
        setNotes(mappedSession.notes || '');
        
      } catch (err: any) {
        console.error('Error fetching interview session:', err);
        setError(err.message || 'Failed to load interview session');
        
        toast({
          title: "Error",
          description: err.message || "Failed to load interview session",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchInterviewSession();
    }
  }, [sessionId, user, supabase, toast]);
  
  // Handle save notes
  const handleSaveNotes = async () => {
    if (!session || !user) return;
    
    try {
      setIsSavingNotes(true);
      
      const { error } = await supabase
        .from('interview_sessions')
        .update({ 
          notes, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Notes Saved",
        description: "Your interview session notes have been updated.",
      });
      
    } catch (err: any) {
      console.error('Error saving notes:', err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };
  
  // Handle delete session
  const handleDeleteSession = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Session Deleted",
        description: "The interview session has been permanently deleted.",
      });
      
      // Redirect back to the main interview buddy page
      router.push('/dashboard/interview-buddy');
      
    } catch (err: any) {
      console.error('Error deleting session:', err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete session",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!session) return;
    
    try {
      // Format the interview session as text
      let copyText = `# Interview Preparation: ${session.jobTitle}\n\n`;
      
      if (session.jobDescription) {
        copyText += `## Job Description\n\n${session.jobDescription}\n\n---\n\n`;
      }
      
      session.questions.forEach((q, index) => {
        copyText += `## Question ${index + 1} (${q.category})\n\n`;
        copyText += `${q.question}\n\n`;
        copyText += `### Suggested Answer:\n\n`;
        copyText += `${q.suggestedAnswer}\n\n`;
        copyText += `---\n\n`;
      });
      
      if (session.notes) {
        copyText += `## My Notes\n\n${session.notes}\n\n`;
      }
      
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
    if (!session) return;
    
    try {
      // Format the interview session as text
      let downloadText = `# Interview Preparation: ${session.jobTitle}\n\n`;
      
      if (session.jobDescription) {
        downloadText += `## Job Description\n\n${session.jobDescription}\n\n---\n\n`;
      }
      
      session.questions.forEach((q, index) => {
        downloadText += `## Question ${index + 1} (${q.category})\n\n`;
        downloadText += `${q.question}\n\n`;
        downloadText += `### Suggested Answer:\n\n`;
        downloadText += `${q.suggestedAnswer}\n\n`;
        downloadText += `---\n\n`;
      });
      
      if (session.notes) {
        downloadText += `## My Notes\n\n${session.notes}\n\n`;
      }
      
      // Create blob and download link
      const blob = new Blob([downloadText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Interview-Prep-${session.jobTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
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
  
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center bg-white">
        <LoadingSpinner className="h-6 w-6 md:h-8 md:w-8 text-teal-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-6">
        <Button variant="outline" asChild className="border-teal-200 text-teal-700 hover:bg-teal-50">
          <Link href="/dashboard/interview-buddy">
            <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Back to Interview Buddy
          </Link>
        </Button>
        
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-6">
        <Button variant="outline" asChild className="border-teal-200 text-teal-700 hover:bg-teal-50">
          <Link href="/dashboard/interview-buddy">
            <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Back to Interview Buddy
          </Link>
        </Button>
        
        <Alert className="bg-teal-50 border-teal-200 text-teal-800">
          <AlertDescription>Interview session not found</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-6">
      {/* Header with navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="border-teal-200 text-teal-700 hover:bg-teal-50 mb-2 sm:mb-0">
          <Link href="/dashboard/interview-buddy">
            <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Back to Interview Buddy
          </Link>
        </Button>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleCopyToClipboard}
            className="text-xs md:text-sm border-teal-200 text-teal-700 hover:bg-teal-50"
            size="sm"
          >
            <Copy className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Copy</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="text-xs md:text-sm border-teal-200 text-teal-700 hover:bg-teal-50"
            size="sm"
          >
            <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Download</span>
          </Button>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="text-xs md:text-sm bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Delete</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-teal-100">
              <DialogHeader>
                <DialogTitle className="text-gray-800">Delete Interview Session</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Are you sure you want to delete this interview session? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button 
                    variant="outline"
                    className="border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSession}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  {isDeleting ? "Deleting..." : "Delete Session"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Session Info Card */}
      <Card className="border-teal-100">
        <CardHeader className="bg-teal-50/50 pb-4 md:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-800">
                <MessagesSquare className="h-5 w-5 md:h-6 md:w-6 text-teal-600" />
                {session.jobTitle}
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                  <div className="flex items-center text-xs md:text-sm">
                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-teal-500" />
                    {new Date(session.createdAt || '').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center text-xs md:text-sm">
                    <Briefcase className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-teal-500" />
                    Resume: {session.resumeTitle || 'Unnamed Resume'}
                  </div>
                </div>
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)}
              </Badge>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {session.jobDescription && (
          <CardContent className="pt-4 px-4 md:px-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-800">Job Description</h3>
              <div className="bg-teal-50/30 p-3 rounded-md text-xs md:text-sm whitespace-pre-line text-gray-700 border border-teal-100/50">
                {session.jobDescription}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Questions List */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center text-gray-800">
          <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-teal-600" />
          Interview Questions ({session.questions.length})
        </h2>
        <InterviewQuestionList questions={session.questions} />
      </div>
      
      {/* Notes Section */}
      <Card className="border-teal-100">
        <CardHeader className="pb-3 bg-teal-50/50">
          <CardTitle className="text-base md:text-lg flex items-center text-gray-800">
            <StickyNote className="h-4 w-4 md:h-5 md:w-5 mr-2 text-teal-600" />
            My Notes
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Add your own notes to help with your interview preparation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4 md:px-6">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your own notes, preparation tips, or questions you want to ask the interviewer..."
            className="min-h-[120px] md:min-h-[150px] border-teal-200 focus:ring-teal-500"
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t border-teal-100 pt-3 px-4 md:px-6">
          <Button 
            onClick={handleSaveNotes} 
            disabled={isSavingNotes}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSavingNotes ? (
              <>
                <LoadingSpinner className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="text-sm md:text-base">Saving...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="text-sm md:text-base">Save Notes</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}