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
  ArrowLeft, 
  BarChart2, 
  CheckCircle2, 
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ATSAnalysis {
  id: string;
  created_at: string;
  resume_id: string;
  job_description: string;
  analysis_result: {
    overall?: {
      score: number;
      summary: string;
    };
    keywords?: {
      found: string[];
      missing: string[];
      recommended: string[];
    };
    formatting?: {
      issues: string[];
      suggestions: string[];
    };
    sections?: {
      missing: string[];
      suggestions: string[];
    };
    improvements?: string[];
  };
  resumes?: {
    title: string;
  };
}

export default function ATSHistoryPage() {
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<ATSAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResume, setFilterResume] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedAnalysis, setSelectedAnalysis] = useState<ATSAnalysis | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Fetch all ATS analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('resume_ats_analyses')
          .select(`
            id, 
            created_at, 
            resume_id, 
            job_description, 
            analysis_result,
            resumes(title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        // Transform the data to match our interface
        const transformedData: ATSAnalysis[] = (data || []).map(item => ({
          id: item.id,
          created_at: item.created_at || new Date().toISOString(), // Handle null created_at
          resume_id: item.resume_id,
          job_description: item.job_description,
          analysis_result: item.analysis_result as any || {}, // Cast the Json type
          resumes: item.resumes
        }));
        
        setAnalyses(transformedData);
        setFilteredAnalyses(transformedData);
      } catch (err: any) {
        console.error('Error fetching ATS analyses:', err);
        setError(err.message || 'Failed to load analysis history');
        toast({
          title: "Error",
          description: "Failed to load analysis history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyses();
  }, [user, supabase, toast]);
  
  // Filter and sort analyses
  useEffect(() => {
    let filtered = [...analyses];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(analysis => 
        analysis.job_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.resumes?.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply resume filter
    if (filterResume !== 'all') {
      filtered = filtered.filter(analysis => analysis.resume_id === filterResume);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'score-desc':
        filtered.sort((a, b) => (b.analysis_result?.overall?.score || 0) - (a.analysis_result?.overall?.score || 0));
        break;
      case 'score-asc':
        filtered.sort((a, b) => (a.analysis_result?.overall?.score || 0) - (b.analysis_result?.overall?.score || 0));
        break;
    }
    
    setFilteredAnalyses(filtered);
  }, [analyses, searchQuery, filterResume, sortBy]);
  
  // Get unique resumes for filter
  const uniqueResumes = Array.from(
    new Map(analyses.map(a => [a.resume_id, { id: a.resume_id, title: a.resumes?.title || 'Untitled' }])).values()
  );
  
  // Calculate statistics
  const stats = {
    totalScans: analyses.length,
    averageScore: analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + (a.analysis_result?.overall?.score || 0), 0) / analyses.length 
      : 0,
    highestScore: analyses.length > 0 
      ? Math.max(...analyses.map(a => a.analysis_result?.overall?.score || 0))
      : 0,
    recentImprovement: analyses.length >= 2 
      ? (analyses[0].analysis_result?.overall?.score || 0) - (analyses[1].analysis_result?.overall?.score || 0)
      : 0
  };
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get progress bar color
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Download analysis
  const downloadAnalysis = (analysis: ATSAnalysis) => {
    const text = `
ATS Resume Analysis Report
=========================
Resume: ${analysis.resumes?.title || 'Untitled'}
Date: ${formatDate(analysis.created_at)}

Overall Score: ${Math.round((analysis.analysis_result?.overall?.score || 0) * 100)}%
Summary: ${analysis.analysis_result?.overall?.summary || 'N/A'}

Job Description:
${analysis.job_description}

Keywords
--------
Found: ${analysis.analysis_result?.keywords?.found?.join(', ') || 'None'}
Missing: ${analysis.analysis_result?.keywords?.missing?.join(', ') || 'None'}
Recommended: ${analysis.analysis_result?.keywords?.recommended?.join(', ') || 'None'}

Formatting Issues
----------------
${analysis.analysis_result?.formatting?.issues?.map(issue => `- ${issue}`).join('\n') || 'None'}

Formatting Suggestions
---------------------
${analysis.analysis_result?.formatting?.suggestions?.map(suggestion => `- ${suggestion}`).join('\n') || 'None'}

Missing Sections
---------------
${analysis.analysis_result?.sections?.missing?.map(section => `- ${section}`).join('\n') || 'None'}

Section Suggestions
------------------
${analysis.analysis_result?.sections?.suggestions?.map(suggestion => `- ${suggestion}`).join('\n') || 'None'}

Improvement Recommendations
--------------------------
${analysis.analysis_result?.improvements?.map(improvement => `- ${improvement}`).join('\n') || 'None'}
`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-analysis-${analysis.resumes?.title || 'resume'}-${new Date(analysis.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Analysis report downloaded successfully.",
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading analysis history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/ats-scanner">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to ATS Scanner
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-teal-600" />
          ATS Analysis History
        </h1>
        <p className="text-muted-foreground mt-2">
          View and track all your resume ATS compatibility analyses
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
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {Math.round(stats.averageScore * 100)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.highestScore)}`}>
              {Math.round(stats.highestScore * 100)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.recentImprovement > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    +{Math.round(stats.recentImprovement * 100)}%
                  </span>
                </>
              ) : stats.recentImprovement < 0 ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">
                    {Math.round(stats.recentImprovement * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <Minus className="h-5 w-5 text-gray-500" />
                  <span className="text-2xl font-bold text-gray-500">0%</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search job descriptions or resume titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterResume} onValueChange={setFilterResume}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by resume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resumes</SelectItem>
                {uniqueResumes.map(resume => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
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
        </CardContent>
      </Card>
      
      {/* Analysis List */}
      {filteredAnalyses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ScanSearch className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || filterResume !== 'all' ? 'No matching analyses found' : 'No analyses yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterResume !== 'all' 
                ? 'Try adjusting your filters or search query.'
                : 'Start by scanning a resume against a job description.'}
            </p>
            {analyses.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/ats-scanner">
                  Go to ATS Scanner
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAnalyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {analysis.resumes?.title || 'Untitled Resume'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(analysis.created_at)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.analysis_result?.overall?.score || 0)}`}>
                      {Math.round((analysis.analysis_result?.overall?.score || 0) * 100)}%
                    </div>
                    <Progress 
                      value={Math.round((analysis.analysis_result?.overall?.score || 0) * 100)} 
                      className={`h-2 w-20 mt-1 ${getProgressBarColor(analysis.analysis_result?.overall?.score || 0)}`}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Job Description Preview:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {analysis.job_description}
                    </p>
                  </div>
                  
                  {analysis.analysis_result?.keywords?.found && (
                    <div>
                      <p className="text-sm font-medium mb-1">Matched Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.analysis_result.keywords.found.slice(0, 5).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                        {analysis.analysis_result.keywords.found.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysis.analysis_result.keywords.found.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {analysis.analysis_result?.keywords?.missing && analysis.analysis_result.keywords.missing.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Missing Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.analysis_result.keywords.missing.slice(0, 3).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-700 border-red-200">
                            <X className="h-3 w-3 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                        {analysis.analysis_result.keywords.missing.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysis.analysis_result.keywords.missing.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-3">
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAnalysis(analysis);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadAnalysis(analysis)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/dashboard/resumes/${analysis.resume_id}/ats-scanner?jobDescription=${encodeURIComponent(analysis.job_description)}`}>
                      <ScanSearch className="h-4 w-4 mr-2" />
                      Rescan
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Details</DialogTitle>
            <DialogDescription>
              {selectedAnalysis?.resumes?.title || 'Untitled Resume'} • {selectedAnalysis && formatDate(selectedAnalysis.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnalysis && (
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="font-medium mb-2">Overall Score</h3>
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.analysis_result?.overall?.score || 0)}`}>
                    {Math.round((selectedAnalysis.analysis_result?.overall?.score || 0) * 100)}%
                  </div>
                  <Progress 
                    value={Math.round((selectedAnalysis.analysis_result?.overall?.score || 0) * 100)} 
                    className={`h-3 flex-1 ${getProgressBarColor(selectedAnalysis.analysis_result?.overall?.score || 0)}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedAnalysis.analysis_result?.overall?.summary || 'No summary available'}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAnalysis.job_description}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-3">Keywords Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-1">Found Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.analysis_result?.keywords?.found?.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {keyword}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.analysis_result?.keywords?.missing?.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                          <X className="h-3 w-3 mr-1" />
                          {keyword}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-1">Recommended Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.analysis_result?.keywords?.recommended?.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                          {keyword}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Formatting Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Issues</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedAnalysis.analysis_result?.formatting?.issues?.map((issue, i) => (
                        <li key={i} className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      )) || <li className="text-muted-foreground">No issues found</li>}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Suggestions</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedAnalysis.analysis_result?.formatting?.suggestions?.map((suggestion, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      )) || <li className="text-muted-foreground">No suggestions</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Improvement Recommendations</h3>
                <ul className="space-y-1 text-sm">
                  {selectedAnalysis.analysis_result?.improvements?.map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <BarChart2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  )) || <li className="text-muted-foreground">No recommendations available</li>}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}