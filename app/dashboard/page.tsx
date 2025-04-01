"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/hooks/useProfile";
import { 
  FileText, 
  History, 
  Star, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Upload, 
  Linkedin, 
  CheckCircle2,
  FileBadge,
  FileIcon,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDistance } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for our data structures
interface CoverLetter {
  id: string;
  title: string;
  date: string;
  job_title?: string | null;
  company_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  content?: string | null;
}

interface Resume {
  id: string;
  title: string;
  updated_at: string | null;
  user_id: string;
  personal_info?: any;
  work_experience?: any;
  source_cv?: string | null;
  [key: string]: any;  // Allow for additional properties
}

interface Stats {
  totalLetters: number;
  thisMonth: number;
  averageLength: number;
}

// Filename: app/dashboard/page.tsx
export default function DashboardPage() {
  const { profile, loading } = useProfile();
  const { toast } = useToast();
  const { user } = useAuth();
  const [hasCVUploaded, setHasCVUploaded] = useState(false);
  const [hasLinkedInConnected, setHasLinkedInConnected] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  
  // State for cover letters and resumes
  const [recentLetters, setRecentLetters] = useState<CoverLetter[]>([]);
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalLetters: 0,
    thisMonth: 0,
    averageLength: 450
  });

  // Load saved CV and LinkedIn information on mount
  useEffect(() => {
    const savedCV = localStorage.getItem('userCV');
    const savedLinkedIn = localStorage.getItem('userLinkedIn');
    
    if (savedCV) setHasCVUploaded(true);
    if (savedLinkedIn) setHasLinkedInConnected(true);
  }, []);

  // Fetch recent resumes from Supabase
  useEffect(() => {
    const fetchRecentResumes = async () => {
      if (!user) return;
      
      try {
        setLoadingResumes(true);
        const supabase = createBrowserClient();
        
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(2);
        
        if (error) throw error;
        setRecentResumes(data || []);
      } catch (err) {
        console.error('Error fetching recent resumes:', err);
      } finally {
        setLoadingResumes(false);
      }
    };
    
    if (user) {
      fetchRecentResumes();
    }
  }, [user]);
  
  // Fetch recent cover letters from Supabase
  useEffect(() => {
    const fetchRecentCoverLetters = async () => {
      if (!user) return;
      
      try {
        setLoadingLetters(true);
        const supabase = createBrowserClient();
        
        // Fetch recent cover letters
        const { data, error } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (error) throw error;
        
        // Format the cover letter data
        const formattedLetters: CoverLetter[] = (data || []).map(letter => ({
          id: letter.id,
          title: `${letter.job_title || 'Position'} at ${letter.company_name || 'Company'}`,
          date: letter.created_at || new Date().toISOString(),
          job_title: letter.job_title,
          company_name: letter.company_name,
          created_at: letter.created_at,
          content: letter.content
        }));
        
        setRecentLetters(formattedLetters);
        
        // Fetch statistics
        const { data: statsData, error: statsError } = await supabase
          .from('cover_letters')
          .select('id, created_at, content', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (statsError) throw statsError;
        
        // Calculate statistics
        const total = statsData?.length || 0;
        
        // Calculate letters created this month
        const now = new Date();
        const thisMonth = statsData?.filter(letter => {
          const letterDate = new Date(letter.created_at || '');
          return letterDate.getMonth() === now.getMonth() && 
                 letterDate.getFullYear() === now.getFullYear();
        }).length || 0;
        
        // Calculate average length
        const totalWords = statsData?.reduce((sum, letter) => {
          const wordCount = letter.content ? letter.content.split(/\s+/).length : 0;
          return sum + wordCount;
        }, 0) || 0;
        
        const averageLength = total > 0 ? Math.round(totalWords / total) : 450;
        
        setStats({
          totalLetters: total,
          thisMonth: thisMonth,
          averageLength: averageLength
        });
        
      } catch (err) {
        console.error('Error fetching recent cover letters:', err);
      } finally {
        setLoadingLetters(false);
      }
    };
    
    if (user) {
      fetchRecentCoverLetters();
    }
  }, [user]);

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Simulate upload process
      setInProgress(true);
      
      setTimeout(() => {
        // Save CV information to local storage
        const cvData = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          date: new Date().toISOString()
        };
        localStorage.setItem('userCV', JSON.stringify(cvData));
        
        setHasCVUploaded(true);
        setInProgress(false);
        
        toast({
          title: "CV uploaded successfully",
          description: `${selectedFile.name} has been uploaded and will be used for your cover letters.`,
        });
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 mx-auto py-6 max-w-7xl">
      {/* Dashboard Header */}
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
      </header>

      {/* Profile Status Alert */}
      {(hasCVUploaded || hasLinkedInConnected) && (
        <Alert className="mb-8 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <AlertDescription className="text-blue-500 text-sm sm:text-base py-1">
              <span className="font-semibold">Profile data ready:</span>{' '}
              {hasCVUploaded && <span className="mr-2">✓ CV uploaded</span>}
              {hasLinkedInConnected && <span>✓ LinkedIn connected</span>}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Quick Actions Section */}
      <section className="mb-8">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Get started with your job application tools
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Create Button with Dropdown */}
              <div className="md:col-span-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full h-auto py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all hover:shadow-lg hover:translate-y-[-2px]">
                      <Plus className="h-5 w-5" />
                      <span className="font-medium">Create New</span>
                      <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <Link href="/dashboard/cover-letters?tab=create" className="block w-full">
                      <DropdownMenuItem className="cursor-pointer py-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Cover Letter</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/resumes/new" className="block w-full">
                      <DropdownMenuItem className="cursor-pointer py-3 flex items-center">
                        <FileBadge className="h-4 w-4 mr-2 text-green-500" />
                        <span>Resume</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Cover Letters Section */}
        <Card className="border-l-4 border-l-blue-400 shadow-md h-fit">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Cover Letters</CardTitle>
              <CardDescription className="text-xs">Latest creations</CardDescription>
            </div>
            <Link href="/dashboard/cover-letters?tab=recent">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <span className="sr-only sm:not-sr-only sm:inline-block text-xs">View All</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="py-1">
            {loadingLetters ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : recentLetters.length > 0 ? (
              <div className="space-y-2">
                {recentLetters.map((letter) => (
                  <div key={letter.id} className="p-2 rounded-md hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{letter.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {letter.date ? new Date(letter.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link href={`/dashboard/cover-letters?edit=${letter.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <span className="sr-only">Download</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-medium mb-1">No cover letters yet</h3>
                <Link href="/dashboard/cover-letters?tab=create">
                  <Button size="sm" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Create Letter
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Resumes Section */}
        <Card className="border-l-4 border-l-green-400 shadow-md h-fit">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Resumes</CardTitle>
              <CardDescription className="text-xs">Latest creations</CardDescription>
            </div>
            <Link href="/dashboard/resumes">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <span className="sr-only sm:not-sr-only sm:inline-block text-xs">View All</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="py-1">
            {loadingResumes ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : recentResumes.length > 0 ? (
              <div className="space-y-2">
                {recentResumes.map((resume) => (
                  <div key={resume.id} className="p-2 rounded-md hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start flex-1 min-w-0">
                        <FileBadge className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resume.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {resume.updated_at ? formatDistance(new Date(resume.updated_at), new Date(), { addSuffix: true }) : 'recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link href={`/dashboard/resumes/${resume.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </Button>
                        </Link>
                        <Link href={`/dashboard/resumes/${resume.id}/preview`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <span className="sr-only">Preview</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileBadge className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-medium mb-1">No resumes yet</h3>
                <Link href="/dashboard/resumes/new">
                  <Button size="sm" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Create Resume
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Activity Stats Card - Now below in full width */}
        <Card className="border-l-4 border-l-purple-400 shadow-md h-fit md:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">Your Activity</CardTitle>
            <CardDescription className="text-xs">Application stats and metrics</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:col-span-1">
                <div className="bg-primary/10 p-2 rounded-lg text-center transition-transform hover:scale-105">
                  <p className="text-xl font-bold text-primary">{stats.totalLetters}</p>
                  <p className="text-xs text-muted-foreground">Letters</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg text-center transition-transform hover:scale-105">
                  <p className="text-xl font-bold text-primary">{recentResumes.length}</p>
                  <p className="text-xs text-muted-foreground">Resumes</p>
                </div>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}