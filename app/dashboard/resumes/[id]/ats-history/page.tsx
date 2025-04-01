"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  ArrowLeft, 
  FileText, 
  Scan, 
  History,
  BarChart2,
  CheckCircle2,
  Calendar,
  X,
  Download,
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ATSHistoryPage() {
  const [resume, setResume] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Get the resume ID from URL params
  const resumeId = params.id as string;
  
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
  
  // Fetch scan history
  useEffect(() => {
    const fetchScanHistory = async () => {
      if (!resumeId || !user) return;
      
      try {
        setLoadingHistory(true);
        
        const { data, error } = await supabase
          .from('resume_ats_analyses')
          .select('*')
          .eq('resume_id', resumeId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setScanHistory(data || []);
      } catch (err) {
        console.error('Error fetching scan history:', err);
        // Non-critical, so just set empty array
        setScanHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchScanHistory();
  }, [resumeId, user, supabase]);
  
  // Filter and sort scan history
  const filteredHistory = scanHistory
    .filter(scan => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesJobDescription = scan.job_description?.toLowerCase().includes(query);
        const matchesKeywords = scan.analysis_result?.keywords?.found?.some((k: string) => k.toLowerCase().includes(query));
        if (!matchesJobDescription && !matchesKeywords) return false;
      }
      
      // Filter by score
      if (scoreFilter !== "all") {
        const score = scan.analysis_result?.overall?.score || 0;
        if (scoreFilter === "high" && score < 0.8) return false;
        if (scoreFilter === "medium" && (score < 0.6 || score >= 0.8)) return false;
        if (scoreFilter === "low" && score >= 0.6) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortBy === "date-desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "score-desc") {
        const scoreA = a.analysis_result?.overall?.score || 0;
        const scoreB = b.analysis_result?.overall?.score || 0;
        return scoreB - scoreA;
      }
      if (sortBy === "score-asc") {
        const scoreA = a.analysis_result?.overall?.score || 0;
        const scoreB = b.analysis_result?.overall?.score || 0;
        return scoreA - scoreB;
      }
      return 0;
    });
  
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
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Download single analysis
  const downloadAnalysis = (scan: any) => {
    if (!scan.analysis_result) return;
    
    const analysis = scan.analysis_result;
    const scorePercentage = Math.round((analysis.overall?.score || 0) * 100);
    
    const text = `
ATS Resume Analysis Report
=========================
Date: ${formatDate(scan.created_at)} at ${formatTime(scan.created_at)}

Overall Score: ${scorePercentage}%
Summary: ${analysis.overall?.summary || 'No summary available'}

Keywords
--------
Found: ${analysis.keywords?.found?.join(', ') || 'None found'}
Missing: ${analysis.keywords?.missing?.join(', ') || 'None missing'}
Recommended: ${analysis.keywords?.recommended?.join(', ') || 'No recommendations'}

Formatting Issues
----------------
${analysis.formatting?.issues?.map((issue: string) => `- ${issue}`).join('\n') || 'No issues detected'}

Formatting Suggestions
---------------------
${analysis.formatting?.suggestions?.map((suggestion: string) => `- ${suggestion}`).join('\n') || 'No suggestions available'}

Missing Sections
---------------
${analysis.sections?.missing?.map((section: string) => `- ${section}`).join('\n') || 'No missing sections detected'}

Section Suggestions
------------------
${analysis.sections?.suggestions?.map((suggestion: string) => `- ${suggestion}`).join('\n') || 'No suggestions available'}

Improvement Recommendations
--------------------------
${analysis.improvements?.map((improvement: string) => `- ${improvement}`).join('\n') || 'No recommendations available'}

Job Description Used
-------------------
${scan.job_description || 'No job description available'}
`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-analysis-${formatDate(scan.created_at).replace(/,/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analysis Downloaded",
      description: "The ATS analysis report has been downloaded as a text file.",
      variant: "default",
    });
  };
  
  // Download all analyses as CSV
  const downloadAllAnalyses = () => {
    if (scanHistory.length === 0) return;
    
    // Create CSV header
    let csvContent = "Date,Time,Score,Keywords Found,Keywords Missing,Recommendations\n";
    
    // Add rows for each scan
    scanHistory.forEach(scan => {
      const analysis = scan.analysis_result;
      const date = formatDate(scan.created_at);
      const time = formatTime(scan.created_at);
      const score = Math.round((analysis?.overall?.score || 0) * 100);
      
      const keywordsFound = analysis?.keywords?.found?.join('; ') || '';
      const keywordsMissing = analysis?.keywords?.missing?.join('; ') || '';
      const improvements = analysis?.improvements?.join('; ') || '';
      
      // Escape fields that might contain commas or quotes
      const escapeCsvField = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      csvContent += `${date},${time},${score}%,${escapeCsvField(keywordsFound)},${escapeCsvField(keywordsMissing)},${escapeCsvField(improvements)}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-analyses-history-${resume?.title || 'resume'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "History Downloaded",
      description: "All ATS analyses have been downloaded as a CSV file.",
      variant: "default",
    });
  };
  
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href={`/dashboard/resumes/${resumeId}/ats-scanner`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to ATS Scanner
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ATS Scan History</h1>
            <p className="text-muted-foreground">
              Review past ATS analyses for "{resume?.title || 'your resume'}"
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/resumes/${resumeId}/preview`}>
              <FileText className="h-4 w-4 mr-2" />
              Preview Resume
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/resumes/${resumeId}/ats-scanner`}>
              <Scan className="h-4 w-4 mr-2" />
              New Scan
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            ATS Analysis History
          </CardTitle>
          <CardDescription>
            {scanHistory.length} analyses performed on your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Filters and search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search job descriptions & keywords"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="high">High (80-100%)</SelectItem>
                      <SelectItem value="medium">Medium (60-79%)</SelectItem>
                      <SelectItem value="low">Low (0-59%)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="score-desc">Highest Score</SelectItem>
                      <SelectItem value="score-asc">Lowest Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {scanHistory.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <History className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium">No scan history found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Run your first ATS scan to see results here. Comparing your resume against different job descriptions will help you optimize it for ATS compatibility.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={`/dashboard/resumes/${resumeId}/ats-scanner`}>
                      <Scan className="h-4 w-4 mr-2" />
                      Start First Scan
                    </Link>
                  </Button>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium">No matching results</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    setScoreFilter("all");
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table view for larger screens */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Top Keywords</TableHead>
                          <TableHead>Job Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((scan, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-medium">{formatDate(scan.created_at)}</div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(scan.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {scan.analysis_result?.overall?.score !== undefined ? (
                                <div className="space-y-1">
                                  <div className={`font-bold ${getScoreColor(scan.analysis_result.overall.score)}`}>
                                    {Math.round(scan.analysis_result.overall.score * 100)}%
                                  </div>
                                  <Progress 
                                    value={Math.round(scan.analysis_result.overall.score * 100)} 
                                    className={`h-1.5 w-16 ${getProgressBarColor(scan.analysis_result.overall.score)}`}
                                  />
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {scan.analysis_result?.keywords?.found?.slice(0, 3).map((keyword: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                                {(scan.analysis_result?.keywords?.found?.length || 0) > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(scan.analysis_result?.keywords?.found?.length || 0) - 3} more
                                  </Badge>
                                )}
                                {(!scan.analysis_result?.keywords?.found || scan.analysis_result.keywords.found.length === 0) && (
                                  <span className="text-xs text-muted-foreground">No keywords found</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate text-sm">
                                {scan.job_description ? (
                                  scan.job_description.substring(0, 80) + (scan.job_description.length > 80 ? '...' : '')
                                ) : (
                                  <span className="text-muted-foreground">No description available</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => downloadAnalysis(scan)}
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/dashboard/resumes/${resumeId}/ats-scanner?load=${scan.id}`}>
                                    <Scan className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Card view for mobile */}
                  <div className="md:hidden space-y-4">
                    {filteredHistory.map((scan, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {formatDate(scan.created_at)} • {formatTime(scan.created_at)}
                                </span>
                              </div>
                            </div>
                            {scan.analysis_result?.overall?.score !== undefined && (
                              <div className={`font-bold ${getScoreColor(scan.analysis_result.overall.score)}`}>
                                {Math.round(scan.analysis_result.overall.score * 100)}%
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2">
                          {scan.analysis_result?.overall?.summary && (
                            <p className="text-sm mb-4">
                              {scan.analysis_result.overall.summary}
                            </p>
                          )}
                          
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                Job Description
                              </h4>
                              <p className="text-sm line-clamp-2">
                                {scan.job_description || "No job description available"}
                              </p>
                            </div>
                            
                            {scan.analysis_result?.keywords?.found && scan.analysis_result.keywords.found.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                  Top Keywords
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {scan.analysis_result.keywords.found.slice(0, 3).map((keyword: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {scan.analysis_result.keywords.found.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{scan.analysis_result.keywords.found.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="p-4 pt-1 flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-8"
                            onClick={() => {
                              if (expandedScan === scan.id) {
                                setExpandedScan(null);
                              } else {
                                setExpandedScan(scan.id);
                              }
                            }}
                          >
                            {expandedScan === scan.id ? 'Show Less' : 'Show More'}
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8"
                              onClick={() => downloadAnalysis(scan)}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Save
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="h-8"
                              asChild
                            >
                              <Link href={`/dashboard/resumes/${resumeId}/ats-scanner?load=${scan.id}`}>
                                <Scan className="h-3 w-3 mr-2" />
                                Scan
                              </Link>
                            </Button>
                          </div>
                        </CardFooter>
                        
                        {expandedScan === scan.id && (
                          <div className="p-4 pt-0 border-t">
                            {scan.analysis_result?.improvements && scan.analysis_result.improvements.length > 0 && (
                              <div className="mb-3">
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                  Recommendations
                                </h4>
                                <ul className="text-sm space-y-1">
                                  {scan.analysis_result.improvements.map((improvement: string, i: number) => (
                                    <li key={i} className="flex items-start">
                                      <BarChart2 className="h-3 w-3 text-blue-500 mr-2 mt-1" />
                                      <span>{improvement}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {scan.analysis_result?.keywords?.missing && scan.analysis_result.keywords.missing.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                  Missing Keywords
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {scan.analysis_result.keywords.missing.map((keyword: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-200 text-xs">
                                      <X className="h-3 w-3 mr-1" />
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {scanHistory.length > 0 && (
          <CardFooter className="border-t flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing {filteredHistory.length} of {scanHistory.length} analyses
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={downloadAllAnalyses}
              disabled={scanHistory.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Analyses
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}