import { useState, useEffect } from 'react';
import Link from 'next/link'; // Corrected: Added missing import for Link
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
import LimitedActionButton from '@/components/LimitedActionButton';

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
                const response = await fetch(`/api/resumes/${resumeId}/ats-scanner`);
                
                if (response.ok) {
                    const data = await response.json();
                    setPreviousAnalyses(data.analyses || []);
                }
            } catch (err) {
                console.error('Error fetching previous analyses:', err);
            } finally {
                setLoadingPrevious(false);
            }
        };
        
        fetchPreviousAnalyses();
    }, [resumeId]);

    useEffect(() => {
        if (initialJobDescription) {
            setJobDescription(initialJobDescription);
        }
    }, [initialJobDescription]);
    
    useEffect(() => {
        setCharCount(jobDescription.length);
    }, [jobDescription]);

    const loadPreviousJobDescription = (description: string) => {
        setJobDescription(description);
        const textarea = document.getElementById('job-description-textarea');
        if (textarea) {
            textarea.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleScan = async () => {
        if (!jobDescription.trim() || jobDescription.length < 50 || jobDescription.length > 10000) {
            toast({
                title: "Invalid Job Description",
                description: "Please enter a job description between 50 and 10,000 characters.",
                variant: "destructive",
            });
            return;
        }
        
        setIsScanning(true);
        setError(null);
        setAnalysis(null);
        
        try {
            const response = await fetch(`/api/resumes/${resumeId}/ats-scanner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobDescription }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Scanning failed');
            }
            
            if (!data.analysis || typeof data.analysis.overall?.score !== 'number') {
                throw new Error('Invalid analysis structure received');
            }
            
            setAnalysis(data.analysis);
            
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
                variant: "default", // Corrected: Changed from "success" to "default"
            });
        } catch (err: any) {
            setError(err.message || 'Failed to scan resume. Please try again.');
            toast({
                title: "Scan Failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsScanning(false);
        }
    };

    const handleRetry = () => {
        if (jobDescription.length > 2000) {
            const firstPart = jobDescription.slice(0, 800);
            const lastPart = jobDescription.slice(-800);
            setJobDescription(`${firstPart}\n\n[...]\n\n${lastPart}`);
        }
        setError(null);
        const textarea = document.getElementById('job-description-textarea');
        if (textarea) {
            textarea.scrollIntoView({ behavior: 'smooth' });
            textarea.focus();
        }
    };
    
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };
    const getProgressClass = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };
    const downloadAnalysis = () => {
        if (!analysis) return;
        let text = `ATS Resume Analysis Report\n=========================\n\n`;
        text += `Overall Score: ${analysis.overall.score}%\nSummary: ${analysis.overall.summary}\n\n`;
        text += `Keywords\n--------\nFound: ${analysis.keywords.found.join(', ')}\nMissing: ${analysis.keywords.missing.join(', ')}\n\n`;
        if(analysis.suggestions) text += `Suggestions\n-----------\n${analysis.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
        
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
                                                ` Score: ${item.analysis_result.overall.score}%` : 
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
                                asChild
                            >
                                <Link href={`/dashboard/resumes/${resumeId}/ats-history`}>
                                    View all {previousAnalyses.length} analyses
                                </Link>
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
                    
                    <LimitedActionButton 
                        feature="atsScans"
                        onAllowed={handleScan}
                        disabled={isScanning || !jobDescription.trim() || jobDescription.length < 50 || jobDescription.length > 10000}
                        className="w-full"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Scan Resume for ATS Compatibility
                    </LimitedActionButton>
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
                    <div className="space-y-2 py-4 text-center">
                        <LoadingSpinner className="mx-auto" />
                        <p className="text-sm text-center">Analyzing your resume against the job description...</p>
                    </div>
                )}
                
                {analysis && !isScanning && (
                    <div className="space-y-6 pt-4 border-t">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Overall ATS Compatibility</h3>
                                <span className={`font-bold text-lg ${getScoreColor(analysis.overall.score)}`}>
                                    {analysis.overall.score}%
                                </span>
                            </div>
                            <Progress 
                                value={analysis.overall.score}
                                // Corrected: Applying the color class directly to the root component's className
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
                                        {analysis.keywords?.found?.length > 0 ? (
                                            analysis.keywords.found.map((keyword: string, i: number) => (
                                                <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />{keyword}
                                                </Badge>
                                            ))
                                        ) : <span className="text-sm text-muted-foreground">No matching keywords found</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-red-600 mb-1">Missing Keywords</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {analysis.keywords?.missing?.length > 0 ? (
                                            analysis.keywords.missing.map((keyword: string, i: number) => (
                                                <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                                                    <X className="h-3 w-3 mr-1" />{keyword}
                                                </Badge>
                                            ))
                                        ) : <span className="text-sm text-muted-foreground">No critical keywords missing</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                            <h3 className="font-medium">Formatting Issues</h3>
                            {analysis.formatting?.issues?.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                    {analysis.formatting.issues.map((issue: string, i: number) => (
                                        <li key={i} className="flex items-start">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-green-600 flex items-center"><CheckCircle2 className="h-4 w-4 mr-2" />No major formatting issues detected</p>}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h3 className="font-medium">Suggestions for Improvement</h3>
                             <ul className="space-y-1 text-sm list-disc pl-4">
                                {analysis.suggestions?.length > 0 ? (
                                    analysis.suggestions.map((suggestion: string, i: number) => (
                                        <li key={i}>
                                            <span>{suggestion}</span>
                                        </li>
                                    ))
                                ) : <p className="text-sm text-muted-foreground">No improvement suggestions available.</p>}
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