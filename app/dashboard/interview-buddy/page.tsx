"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  FileText, 
  MessagesSquare, 
  User, 
  Info, 
  Download, 
  Save, 
  Copy, 
  FileSpreadsheet,
  ArrowLeft,
  Sparkles,
  Briefcase,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import Link from "next/link";
import InterviewBuddyGenerator from "@/components/InterviewBuddyGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InterviewBuddyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // State for resumes and sessions
  const [resumes, setResumes] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("generate");
  
  // Get parameters from URL if present
  const resumeId = searchParams.get("resumeId");
  const jobTitle = searchParams.get("jobTitle");
  const jobId = searchParams.get("jobId");
  
  // Fetch user's resumes
  useEffect(() => {
    const fetchResumes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('resumes')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        setResumes(data || []);
      } catch (err: any) {
        console.error('Error fetching resumes:', err);
        toast({
          title: "Error",
          description: "Failed to load your resumes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch recent interview sessions
    const fetchRecentSessions = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('id, job_title, resume_id, created_at, resumes(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        setRecentSessions(data || []);
      } catch (err: any) {
        console.error('Error fetching interview sessions:', err);
        // Non-critical error, just log it
      }
    };
    
    if (user) {
      fetchResumes();
      fetchRecentSessions();
    }
  }, [user, supabase, toast]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`/dashboard/interview-buddy?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Interview Buddy</h1>
        <p className="text-muted-foreground">Prepare for your job interviews with AI-generated questions and answers</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Interview
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="h-4 w-4 mr-2" />
            Interview History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {resumes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center text-center py-10">
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Resumes Found</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      You need to create or upload a resume before generating interview questions.
                      Your resume helps tailor the questions to your specific experience.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/resumes/new">
                        Create Your First Resume
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <InterviewBuddyGenerator
                  resumes={resumes}
                  initialResumeId={resumeId || ''}
                  initialJobTitle={jobTitle || ''}
                  initialJobId={jobId || ''}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>
                Your previous interview practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="divide-y">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start">
                        <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
                          <MessagesSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{session.job_title || 'Interview Session'}</p>
                          <p className="text-sm text-muted-foreground">
                            Resume: {session.resumes?.title || 'Unnamed Resume'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-9 sm:ml-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/interview-buddy/sessions/${session.id}`}>
                            View Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessagesSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
                  <h3 className="text-lg font-medium mb-2">No interview sessions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any interview practice sessions.
                  </p>
                  <Button onClick={() => {
                    setActiveTab("generate");
                    handleTabChange("generate");
                  }}>
                    Create Your First Practice Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}