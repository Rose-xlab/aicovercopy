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
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        
        // Verify user has access to this resume (must be owner or resume is public)
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
        
        // Get scan history count
        const { count, error: countError } = await supabase
          .from('resume_ats_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('resume_id', resumeId);
        
        if (countError) throw countError;
        
        setScanHistory(Array(count || 0).fill(null));
        
        // If we have a scan to load from URL, fetch it
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
        // Non-critical, so just set empty array
        setScanHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchScanHistoryAndLoadScan();
  }, [resumeId, user, supabase, scanToLoad]);
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href="/dashboard/resumes">Back to Resumes</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href={`/dashboard/resumes/${resumeId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resume
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ATS Scanner</h1>
            <p className="text-muted-foreground">
              Check how your resume performs against Applicant Tracking Systems
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {scanHistory.length > 0 && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/resumes/${resumeId}/ats-history`}>
                <History className="h-4 w-4 mr-2" />
                View History ({scanHistory.length})
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/resumes/${resumeId}/preview`}>
              <FileText className="h-4 w-4 mr-2" />
              Preview Resume
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResumeATSScanner 
            resumeId={resumeId} 
            initialJobDescription={jobDescriptionToLoad}
          />
        </div>
        
        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Scan className="h-5 w-5 mr-2" />
              About ATS Scanning
            </h3>
            
            <div className="space-y-4 text-sm">
              <p>
                <strong>Applicant Tracking Systems (ATS)</strong> are software used by employers to manage job applications. They scan resumes for keywords and formatting before a human ever sees them.
              </p>
              
              <p>
                <strong>70-75%</strong> of resumes are rejected by ATS before reaching a hiring manager. Our scanner helps you optimize your resume to get past these systems.
              </p>
              
              <h4 className="font-medium mt-4">The Scanner Checks For:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Keyword matches with the job description</li>
                <li>Proper formatting that ATS can parse</li>
                <li>Missing important sections</li>
                <li>Overall compatibility score</li>
              </ul>
              
              <p className="pt-2">
                For best results, paste the exact job description for a specific position you are applying to.
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Tips to Improve ATS Score</h3>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium">✓ Use a clean, simple format</p>
              <p className="text-muted-foreground">Avoid tables, columns, headers/footers, and graphics</p>
              
              <p className="font-medium">✓ Include keywords from the job description</p>
              <p className="text-muted-foreground">Mirror the exact phrases and skills listed</p>
              
              <p className="font-medium">✓ Use standard section headings</p>
              <p className="text-muted-foreground">Experience, Education, Skills, etc.</p>
              
              <p className="font-medium">✓ Submit in the right format</p>
              <p className="text-muted-foreground">Use PDF format unless otherwise specified</p>
              
              <p className="font-medium">✓ Keep formatting consistent</p>
              <p className="text-muted-foreground">Use the same date format, bullet style, etc.</p>
            </div>
          </div>
          
          {scanHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <History className="h-4 w-4 mr-2" />
                  Scan History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <p className="text-sm text-muted-foreground mb-2">
                  You've analyzed your resume {scanHistory.length} time{scanHistory.length !== 1 ? 's' : ''} against different job descriptions.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/resumes/${resumeId}/ats-history`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full History
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}