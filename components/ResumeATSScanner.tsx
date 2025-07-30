//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\ResumeATSScanner.tsx

import { useState, useEffect } from 'react';
import { 
Card, 
CardContent, 
CardFooter, 
CardHeader, 
CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
AlertCircle, 
CheckCircle2, 
AlertTriangle, 
X, 
Search, 
ThumbsUp, 
Download, 
BarChart2, 
Info,
Plus,
RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface ResumeATSScannerProps {
resumeId: string;
initialJobDescription?: string | null;
}

const ResumeATSScanner: React.FC<ResumeATSScannerProps> = ({ resumeId, initialJobDescription = null }) => {
const [jobDescription, setJobDescription] = useState<string>(initialJobDescription || '');
const [isScanning, setIsScanning] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [analysis, setAnalysis] = useState<any | null>(null);
const [charCount, setCharCount] = useState<number>(0);
const [previousAnalyses, setPreviousAnalyses] = useState<any[]>([]);
const [loadingPrevious, setLoadingPrevious] = useState<boolean>(true);

const { toast } = useToast();

// Load previous analyses for this resume
useEffect(() => {
  const fetchPreviousAnalyses = async () => {
    try {
      setLoadingPrevious(true);
      const response = await fetch(`/api/resumes/ats-scanner/history?resumeId=${resumeId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviousAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error('Error fetching previous analyses:', err);
      // Non-critical, so just log
    } finally {
      setLoadingPrevious(false);
    }
  };
  
  fetchPreviousAnalyses();
}, [resumeId]);

// Effect to update when initialJobDescription changes
useEffect(() => {
  if (initialJobDescription) {
    setJobDescription(initialJobDescription);
    setCharCount(initialJobDescription.length);
  }
}, [initialJobDescription]);

// Function to load a previous job description
const loadPreviousJobDescription = (description: string) => {
  setJobDescription(description);
  // Scroll to the textarea
  const textarea = document.getElementById('job-description-textarea');
  if (textarea) {
    textarea.scrollIntoView({ behavior: 'smooth' });
  }
};

// Scan resume against job description
const handleScan = async () => {
  if (!jobDescription.trim()) {
    toast({
      title: "Missing Job Description",
      description: "Please enter a job description to scan against.",
      variant: "destructive",
    });
    return;
  }
  
  if (jobDescription.length < 50) {
    toast({
      title: "Job Description Too Short",
      description: "Please enter a more detailed job description for better analysis.",
      variant: "destructive",
    });
    return;
  }
  
  if (jobDescription.length > 10000) {
    toast({
      title: "Job Description Too Long",
      description: "Please keep your job description under 10,000 characters for best results.",
      variant: "destructive",
    });
    return;
  }
  
  let retryCount = 0;
  const maxRetries = 2;
  
  const attemptScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      // Call the ATS scanner API
      const response = await fetch('/api/resumes/ats-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          jobDescription,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Scanning failed');
      }
      
      // Validate analysis has the expected structure
      if (!data.analysis || typeof data.analysis !== 'object') {
        throw new Error('Invalid analysis structure received');
      }
      
      setAnalysis(data.analysis);
      
      // Add to previous analyses if not already fetched
      if (!previousAnalyses.some(a => a.job_description === jobDescription)) {
        setPreviousAnalyses(prev => [
          { 
            job_description: jobDescription,
            analysis_result: data.analysis,
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
      }
      
      toast({
        title: "Analysis Complete",
        description: "Your resume has been scanned successfully.",
        variant: "default",
      });
    } catch (err: any) {
      console.error(`Error scanning resume (attempt ${retryCount + 1}):`, err);
      
      // If we have retries left and the error might be temporary, retry
      if (retryCount < maxRetries && 
          (err.message.includes('busy') || 
           err.message.includes('rate limit') ||
           err.message.includes('response_format') ||
           err.message.includes('parse'))) {
        
        retryCount++;
        console.log(`Retrying scan (attempt ${retryCount + 1})...`);
        
        // Wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
        return attemptScan();
      }
      
      // We've run out of retries or it's not a retryable error
      setError(err.message || 'Failed to scan resume. Please try again.');
      
      let errorMessage = 'Failed to scan resume. Please try again.';
      
      // Handle specific error cases
      if (err.message.includes('too detailed') || err.message.includes('token')) {
        errorMessage = 'Your job description is too detailed. Try with a more concise version.';
      } else if (err.message.includes('busy') || err.message.includes('rate limit')) {
        errorMessage = 'Our scanning service is currently busy. Please try again in a few minutes.';
      } else if (err.message.includes('response_format')) {
        errorMessage = 'There was an issue with the analysis service. We\'re working on it.';
      }
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  // Start the scan process
  attemptScan();
};

// Handle retry with a simplified job description
const handleRetry = () => {
  if (jobDescription.length > 2000) {
    // Simplify by taking only first part (introduction) and last part (requirements)
    const firstPart = jobDescription.slice(0, 800);
    const lastPart = jobDescription.slice(-800);
    setJobDescription(`${firstPart}\n\n[...]\n\n${lastPart}`);
  }
  
  // Clear error state
  setError(null);
  
  // Scroll to textarea
  const textarea = document.getElementById('job-description-textarea');
  if (textarea) {
    textarea.scrollIntoView({ behavior: 'smooth' });
    textarea.focus();
  }
  
  toast({
    title: "Job Description Simplified",
    description: "We've simplified your job description. You can edit it further before scanning again.",
    variant: "default",
  });
};

// Convert score to percentage
const scoreToPercentage = (score: number) => {
  return Math.round(score * 100);
};

// Get color based on score
const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'text-green-500';
  if (score >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
};

// Get class for progress bar
const getProgressClass = (score: number) => {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Download analysis as text
const downloadAnalysis = () => {
  if (!analysis) return;
  
  const text = `
ATS Resume Analysis Report
=========================

Overall Score: ${scoreToPercentage(analysis.overall.score)}%
Summary: ${analysis.overall.summary}

Keywords
--------
Found: ${analysis.keywords.found.join(', ')}
Missing: ${analysis.keywords.missing.join(', ')}
Recommended: ${analysis.keywords.recommended.join(', ')}

Formatting Issues
----------------
${analysis.formatting.issues.map((issue: string) => `- ${issue}`).join('\n')}

Formatting Suggestions
---------------------
${analysis.formatting.suggestions.map((suggestion: string) => `- ${suggestion}`).join('\n')}

Missing Sections
---------------
${analysis.sections.missing.map((section: string) => `- ${section}`).join('\n')}

Section Suggestions
------------------
${analysis.sections.suggestions.map((suggestion: string) => `- ${suggestion}`).join('\n')}

Improvement Recommendations
--------------------------
${analysis.improvements.map((improvement: string) => `- ${improvement}`).join('\n')}
`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ats-analysis-report.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast({
    title: "Report Downloaded",
    description: "ATS analysis report has been downloaded.",
    variant: "default",
  });
};

return (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Search className="h-5 w-5 mr-2" />
        ATS Resume Scanner
      </CardTitle>
    </CardHeader>
    
    <CardContent className="space-y-4">
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-500">
          Paste a job description to scan your resume for ATS compatibility
        </AlertDescription>
      </Alert>
      
      {!loadingPrevious && previousAnalyses.length > 0 && (
        <div className="space-y-3 bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Previous Analyses</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPreviousAnalyses([])}
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
          <div className="divide-y">
            {previousAnalyses.slice(0, 3).map((item, index) => (
              <div key={index} className="py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()} • 
                    {item.analysis_result?.overall?.score ? 
                      ` Score: ${Math.round(item.analysis_result.overall.score * 100)}%` : 
                      ' No score'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => loadPreviousJobDescription(item.job_description)}
                    className="h-6 text-xs"
                  >
                    Load
                  </Button>
                </div>
                <p className="text-xs text-gray-700 truncate">
                  {item.job_description.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
          {previousAnalyses.length > 3 && (
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs px-0"
              onClick={() => {
                // Show modal or expand the list
                toast({
                  title: "View All History",
                  description: "Full history view is coming soon",
                  variant: "default",
                });
              }}
            >
              View all {previousAnalyses.length} analyses
            </Button>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="job-description-textarea" className="text-sm font-medium">
            Job Description
          </label>
          <span className={`text-xs ${charCount > 8000 ? 'text-yellow-500' : 'text-gray-500'}`}>
            {charCount}/10000
          </span>
        </div>
        
        <Textarea
          id="job-description-textarea"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="min-h-[150px]"
          disabled={isScanning}
        />
        
        <Button 
          onClick={handleScan} 
          disabled={isScanning || !jobDescription.trim() || jobDescription.length < 50 || jobDescription.length > 10000}
          className="w-full"
        >
          {isScanning ? (
            <>
              <LoadingSpinner className="mr-2" />
              Scanning Resume...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Scan Resume for ATS Compatibility
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{error}</p>
            {(error.includes('too detailed') || error.includes('too long') || jobDescription.length > 3000) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry with Simplified Job Description
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {isScanning && (
        <div className="space-y-2 py-4">
          <p className="text-sm text-center">Analyzing your resume against the job description...</p>
          <Progress 
            value={50} 
            className="h-2"
            // Add indeterminate animation
            style={{ background: 'linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)', backgroundSize: '200% 100%', animation: 'progress-loading 2s infinite' }}
          />
          <style jsx>{`
            @keyframes progress-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      )}
      
      {analysis && (
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Overall ATS Compatibility</h3>
              {analysis.overall && typeof analysis.overall.score === 'number' ? (
                <span className={`font-bold text-lg ${getScoreColor(analysis.overall.score)}`}>
                  {scoreToPercentage(analysis.overall.score)}%
                </span>
              ) : (
                <span className="font-bold text-lg text-gray-500">N/A</span>
              )}
            </div>
            
            {analysis.overall && typeof analysis.overall.score === 'number' && (
              <Progress 
                value={scoreToPercentage(analysis.overall.score)} 
                className={`h-2 ${getProgressClass(analysis.overall.score)}`}
              />
            )}
            
            <p className="text-sm text-muted-foreground mt-1">
              {analysis.overall && analysis.overall.summary ? analysis.overall.summary : 'No summary available'}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Keywords Analysis</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-1">Found Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords && Array.isArray(analysis.keywords.found) && analysis.keywords.found.length > 0 ? (
                    analysis.keywords.found.map((keyword: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No matching keywords found</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-1">Missing Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords && Array.isArray(analysis.keywords.missing) && analysis.keywords.missing.length > 0 ? (
                    analysis.keywords.missing.map((keyword: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No critical keywords missing</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-blue-600 mb-1">Recommended Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords && Array.isArray(analysis.keywords.recommended) && analysis.keywords.recommended.length > 0 ? (
                    analysis.keywords.recommended.map((keyword: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                        <Plus className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No additional keywords recommended</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-medium">Formatting Issues</h3>
            
            {analysis.formatting && Array.isArray(analysis.formatting.issues) && analysis.formatting.issues.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {analysis.formatting.issues.map((issue: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                No major formatting issues detected
              </p>
            )}
            
            <h4 className="text-sm font-medium">Suggestions</h4>
            <ul className="space-y-1 text-sm">
              {analysis.formatting && Array.isArray(analysis.formatting.suggestions) && analysis.formatting.suggestions.length > 0 ? (
                analysis.formatting.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No formatting suggestions available</li>
              )}
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-medium">Missing Sections</h3>
            
            {analysis.sections && Array.isArray(analysis.sections.missing) && analysis.sections.missing.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {analysis.sections.missing.map((section: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                    <span>{section}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                No critical sections missing
              </p>
            )}
            
            <h4 className="text-sm font-medium">Section Improvement Suggestions</h4>
            <ul className="space-y-1 text-sm">
              {analysis.sections && Array.isArray(analysis.sections.suggestions) && analysis.sections.suggestions.length > 0 ? (
                analysis.sections.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No section improvement suggestions available</li>
              )}
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-medium">Improvement Recommendations</h3>
            
            <ul className="space-y-1 text-sm">
              {analysis.improvements && Array.isArray(analysis.improvements) && analysis.improvements.length > 0 ? (
                analysis.improvements.map((improvement: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <BarChart2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <span>{improvement}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No improvement recommendations available</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </CardContent>
    
    {analysis && (
      <CardFooter className="border-t pt-4">
        <Button 
          variant="outline" 
          onClick={downloadAnalysis}
          className="ml-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Analysis
        </Button>
      </CardFooter>
    )}
  </Card>
);
};

export default ResumeATSScanner;