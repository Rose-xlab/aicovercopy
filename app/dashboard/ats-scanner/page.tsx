"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  ScanSearch, 
  FileSpreadsheet, 
  AlertCircle, 
  ArrowRight, 
  BarChart2, 
  CheckCircle2, 
  Calendar,
  Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ATSScannerPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Fetch user's resumes and recent analyses
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch resumes
        const { data: resumeData, error: resumeError } = await supabase
          .from('resumes')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (resumeError) throw resumeError;
        
        setResumes(resumeData || []);
        
        // Fetch recent analyses
        const { data: analysesData, error: analysesError } = await supabase
          .from('resume_ats_analyses')
          .select(`
            id, 
            created_at, 
            resume_id, 
            analysis_result,
            resumes(title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (analysesError) throw analysesError;
        
        setRecentAnalyses(analysesData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, supabase, toast]);
  
  // Get score color class based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get progress bar color class based on score
  const getProgressBarColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ATS Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your resumes against job descriptions to improve your chances with Applicant Tracking Systems
        </p>
      </div>
      
      {(!user || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "You need to be logged in to access this feature."}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Your Resumes
              </CardTitle>
              <CardDescription>
                Select a resume to scan for ATS compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium">No resumes found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Create a resume first to use the ATS Scanner.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/resumes/create">
                      Create Your First Resume
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {resumes.slice(0, 5).map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <h3 className="font-medium">{resume.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {formatDate(resume.updated_at)}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`/dashboard/resumes/${resume.id}/ats-scanner`}>
                          <ScanSearch className="h-4 w-4 mr-2" />
                          Scan Now
                        </Link>
                      </Button>
                    </div>
                  ))}
                  
                  {resumes.length > 5 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard/resumes">
                          View All Resumes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {recentAnalyses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent ATS Analyses
                </CardTitle>
                <CardDescription>
                  Your most recent ATS scan results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{analysis.resumes?.title || "Untitled Resume"}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(analysis.created_at)}
                          </div>
                        </div>
                        {analysis.analysis_result?.overall?.score !== undefined && (
                          <div className="text-right">
                            <div className={`font-bold ${getScoreColor(analysis.analysis_result.overall.score)}`}>
                              {Math.round(analysis.analysis_result.overall.score * 100)}%
                            </div>
                            <Progress 
                              value={Math.round(analysis.analysis_result.overall.score * 100)} 
                              className={`h-1.5 w-16 ml-auto ${getProgressBarColor(analysis.analysis_result.overall.score)}`}
                            />
                          </div>
                        )}
                      </div>
                      
                      {analysis.analysis_result?.keywords?.found && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.analysis_result.keywords.found.slice(0, 3).map((keyword: string, i: number) => (
                              <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {keyword}
                              </Badge>
                            ))}
                            {analysis.analysis_result.keywords.found.length > 3 && (
                              <Badge variant="outline">
                                +{analysis.analysis_result.keywords.found.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-end">
                        <Button asChild size="sm">
                          <Link href={`/dashboard/resumes/${analysis.resume_id}/ats-scanner?load=${analysis.id}`}>
                            <ScanSearch className="h-3 w-3 mr-2" />
                            Rescan
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/ats-history">
                    View All Analysis History
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ScanSearch className="h-5 w-5 mr-2" />
                About ATS Scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
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
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Tips to Improve ATS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}