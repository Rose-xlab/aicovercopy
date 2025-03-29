"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Plus // Import the Plus icon that was missing
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface ResumeATSScannerProps {
  resumeId: string;
}

const ResumeATSScanner: React.FC<ResumeATSScannerProps> = ({ resumeId }) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  
  const { toast } = useToast();
  
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scanning failed');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error('Error scanning resume:', err);
      setError(err.message || 'Failed to scan resume. Please try again.');
      toast({
        title: "Scan Failed",
        description: err.message || "Failed to scan resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
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
        
        <div className="space-y-2">
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="min-h-[150px]"
            disabled={isScanning}
          />
          
          <Button 
            onClick={handleScan} 
            disabled={isScanning || !jobDescription.trim()}
            className="w-full"
          >
            {isScanning ? (
              <>
                <LoadingSpinner className="mr-2" />
                Scanning...
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {analysis && (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Overall ATS Compatibility</h3>
                <span className={`font-bold text-lg ${getScoreColor(analysis.overall.score)}`}>
                  {scoreToPercentage(analysis.overall.score)}%
                </span>
              </div>
              
              <Progress 
                value={scoreToPercentage(analysis.overall.score)} 
                // Combine height class with the dynamic color class
                className={`h-2 ${getProgressClass(analysis.overall.score)}`}
              />
              
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.overall.summary}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Keywords Analysis</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-1">Found Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keywords.found.length > 0 ? (
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
                    {analysis.keywords.missing.length > 0 ? (
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
                    {analysis.keywords.recommended.map((keyword: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                        <Plus className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium">Formatting Issues</h3>
              
              {analysis.formatting.issues.length > 0 ? (
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
                {analysis.formatting.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium">Improvement Recommendations</h3>
              
              <ul className="space-y-1 text-sm">
                {analysis.improvements.map((improvement: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <BarChart2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <span>{improvement}</span>
                  </li>
                ))}
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