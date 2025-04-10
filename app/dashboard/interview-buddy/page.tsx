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
import { cn } from "@/lib/utils"; // Import cn utility for conditional classes

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
    <div className="bg-white min-h-screen">
      <header className="mb-6 md:mb-8 pt-4 md:pt-6 px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Interview Buddy</h1>
        <p className="text-sm md:text-base text-gray-600">Prepare for your job interviews with AI-generated questions and answers</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full px-4 md:px-6">
        <TabsList className="mb-4 md:mb-6 bg-teal-50 border border-teal-100 w-full flex">
          <TabsTrigger 
            value="generate" 
            className="flex-1 data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700 data-[state=active]:shadow-none text-gray-700 hover:text-teal-600 text-xs sm:text-sm"
          >
            <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden xs:inline">Generate</span> Interview
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="flex-1 data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700 data-[state=active]:shadow-none text-gray-700 hover:text-teal-600 text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden xs:inline">Interview</span> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          {isLoading ? (
            <div className="flex justify-center py-8 md:py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {resumes.length === 0 ? (
                <Card className="border-teal-100 mx-0 md:mx-0">
                  <CardContent className="pt-4 md:pt-6 flex flex-col items-center text-center py-6 md:py-10 px-4 md:px-6">
                    <FileSpreadsheet className="h-12 w-12 md:h-16 md:w-16 text-teal-500 opacity-30 mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-medium mb-2 text-gray-800">No Resumes Found</h3>
                    <p className="text-sm md:text-base text-gray-600 max-w-md mb-4 md:mb-6">
                      You need to create or upload a resume before generating interview questions.
                      Your resume helps tailor the questions to your specific experience.
                    </p>
                    <Button asChild className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
                      <Link href="/dashboard/resumes/new">
                        Create Your First Resume
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="px-0 md:px-0">
                  <InterviewBuddyGenerator
                    resumes={resumes}
                    initialResumeId={resumeId || ''}
                    initialJobTitle={jobTitle || ''}
                    initialJobId={jobId || ''}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-teal-100 mx-0 md:mx-0">
            <CardHeader className="bg-teal-50/50 px-4 md:px-6 py-4 md:py-6">
              <CardTitle className="text-gray-800 text-lg md:text-xl">Interview History</CardTitle>
              <CardDescription className="text-gray-600 text-sm md:text-base">
                Your previous interview practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              {recentSessions.length > 0 ? (
                <div className="divide-y divide-teal-100">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="py-3 md:py-4 flex flex-col sm:flex-row justify-between gap-2 md:gap-4">
                      <div className="flex items-start">
                        <div className="bg-teal-100/50 p-1.5 md:p-2 rounded mr-2 md:mr-3 mt-1">
                          <MessagesSquare className="h-3 w-3 md:h-4 md:w-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm md:text-base">{session.job_title || 'Interview Session'}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            Resume: {session.resumes?.title || 'Unnamed Resume'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-6 sm:ml-0 mt-2 sm:mt-0">
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-700 text-xs md:text-sm">
                          <Link href={`/dashboard/interview-buddy/sessions/${session.id}`}>
                            View Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <MessagesSquare className="h-10 w-10 md:h-12 md:w-12 text-teal-500 mx-auto mb-3 md:mb-4 opacity-60" />
                  <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-gray-800">No interview sessions yet</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                    You haven't created any interview practice sessions.
                  </p>
                  <Button 
                    onClick={() => {
                      setActiveTab("generate");
                      handleTabChange("generate");
                    }}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                  >
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