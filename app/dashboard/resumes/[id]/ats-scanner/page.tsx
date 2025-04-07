"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import ResumeATSScanner from '@/components/ResumeATSScanner';
import { 
  ArrowLeft, 
  FileText, 
  Scan, 
  History,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ATSScannerPage() {
  const [resume, setResume] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [jobDescriptionToLoad, setJobDescriptionToLoad] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Get the resume ID from URL params
  const resumeId = params.id as string;
  
  // Check if we need to load a specific scan from URL params
  const scanToLoad = searchParams.get('load');
  
  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!resumeId) {
          setError('Invalid resume ID');
          return;
        }
        
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();
        
        if (error) throw error;
        
        if (user && user.id !== data.user_id && !data.is_public) {
          setError('You do not have permission to view this resume');
          return;
        }
        
        setResume(data);
      } catch (err: any) {
        console.error('Error fetching resume:', err);
        setError(err.message || 'Failed to load resume data');
        toast({
          title: "Error",
          description: "Failed to load resume data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResume();
  }, [resumeId, user, supabase, toast]);
  
  // Fetch scan history count and potentially the scan to load
  useEffect(() => {
    const fetchScanHistoryAndLoadScan = async () => {
      if (!resumeId || !user) return;
      
      try {
        setLoadingHistory(true);
        
        const { count, error: countError } = await supabase
          .from('resume_ats_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('resume_id', resumeId);
        
        if (countError) throw countError;
        
        setScanHistory(Array(count || 0).fill(null));
        
        if (scanToLoad) {
          const { data, error } = await supabase
            .from('resume_ats_analyses')
            .select('job_description')
            .eq('id', scanToLoad)
            .eq('resume_id', resumeId)
            .single();
            
          if (error) {
            console.error('Error fetching scan to load:', error);
          } else if (data) {
            setJobDescriptionToLoad(data.job_description);
          }
        }
      } catch (err) {
        console.error('Error fetching scan history:', err);
        setScanHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchScanHistoryAndLoadScan();
  }, [resumeId, user, supabase, scanToLoad]);
  
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading ATS Scanner...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard/resumes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resumes
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start sm:items-center flex-col sm:flex-row sm:gap-4">
              <Button variant="ghost" asChild className="mb-2 sm:mb-0 -ml-2 h-8">
                <Link href={`/dashboard/resumes/${resumeId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-teal-600" />
                  ATS Scanner
                </h1>
                <p className="text-sm text-muted-foreground">
                  Optimize your resume for Applicant Tracking Systems
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/dashboard/resumes/${resumeId}/preview`}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Preview Resume
                </Link>
              </Button>
              {scanHistory.length > 0 && (
                <Button variant="outline" asChild className="flex-1 sm:flex-none">
                  <Link href={`/dashboard/resumes/${resumeId}/ats-history`}>
                    <History className="h-4 w-4 mr-2" />
                    History ({scanHistory.length})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-2 border-teal-100">
              <CardHeader className="pb-4 border-b bg-teal-50/50">
                <CardTitle className="text-lg flex items-center text-teal-800">
                  <Scan className="h-5 w-5 mr-2 text-teal-600" />
                  Resume Analysis
                </CardTitle>
                <CardDescription>
                  Paste a job description to analyze your resume's ATS compatibility
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ResumeATSScanner 
                  resumeId={resumeId} 
                  initialJobDescription={jobDescriptionToLoad}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* ATS Info Card */}
            <Card className="border-2 border-blue-100">
              <CardHeader className="pb-3 border-b bg-blue-50/50">
                <CardTitle className="text-base flex items-center text-blue-800">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                  About ATS Scanning
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4 text-sm">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1"><AlertCircle className="h-4 w-4" /></span>
                    <span>
                      <strong>70-75%</strong> of resumes are rejected by ATS before reaching a hiring manager.
                    </span>
                  </p>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="font-medium mb-2 text-blue-800">The Scanner Checks For:</h4>
                    <ul className="space-y-2">
                      {[
                        "Keyword matches with job description",
                        "Proper formatting that ATS can parse",
                        "Missing important sections",
                        "Overall compatibility score"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-2 border-emerald-100">
              <CardHeader className="pb-3 border-b bg-emerald-50/50">
                <CardTitle className="text-base flex items-center text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                  Tips to Improve ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4 text-sm">
                  {[
                    {
                      title: "Use a clean, simple format",
                      desc: "Avoid tables, columns, headers/footers, and graphics"
                    },
                    {
                      title: "Include relevant keywords",
                      desc: "Mirror the exact phrases and skills from the job description"
                    },
                    {
                      title: "Use standard section headings",
                      desc: "Experience, Education, Skills, etc."
                    },
                    {
                      title: "Submit in the right format",
                      desc: "Use PDF format unless otherwise specified"
                    },
                    {
                      title: "Keep formatting consistent",
                      desc: "Use the same date format, bullet style throughout"
                    }
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-emerald-800">{tip.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scan History Card */}
            {scanHistory.length > 0 && (
              <Card className="border-2 border-purple-100">
                <CardHeader className="pb-3 border-b bg-purple-50/50">
                  <CardTitle className="text-base flex items-center text-purple-800">
                    <History className="h-4 w-4 mr-2 text-purple-600" />
                    Scan History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    You've analyzed this resume {scanHistory.length} time{scanHistory.length !== 1 ? 's' : ''}.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/resumes/${resumeId}/ats-history`}>
                      View Full History
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}