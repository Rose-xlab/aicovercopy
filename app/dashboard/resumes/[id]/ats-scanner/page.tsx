"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Textarea } from '@/components/ui/textarea';
import LimitedActionButton from '@/components/LimitedActionButton';
import {
  ArrowLeft,
  FileText,
  Scan,
  History,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Zap,
  ThumbsUp,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Helper component to display analysis results
const AnalysisResultDisplay = ({ result }: { result: any }) => {
	const getScoreColor = (score: number) => {
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	};

	const getProgressClass = (score: number) => {
		if (score >= 80) return 'bg-green-500';
		if (score >= 60) return 'bg-yellow-500';
		return 'bg-red-500';
	};

	return (
		<div className="space-y-6 mt-6">
			<Card>
				<CardHeader>
					<CardTitle className={`text-2xl font-bold ${getScoreColor(result.overall.score)}`}>
						Overall Score: {result.overall.score}%
					</CardTitle>
					<CardDescription>{result.overall.summary}</CardDescription>
				</CardHeader>
				<CardContent>
                    {/* Corrected: Removed invalid 'indicatorClassName' prop and merged into className */}
					<Progress value={result.overall.score} className={`h-2 ${getProgressClass(result.overall.score)}`} />
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Keyword Analysis</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-semibold text-green-700 mb-2">Keywords Found</h4>
							{result.keywords.found.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{result.keywords.found.map((kw: string, i: number) => <Badge key={i} variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">{kw}</Badge>)}
								</div>
							) : <p className="text-sm text-muted-foreground">No matching keywords found.</p>}
						</div>
						<div>
							<h4 className="font-semibold text-red-700 mb-2">Missing Keywords</h4>
							{result.keywords.missing.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{result.keywords.missing.map((kw: string, i: number) => <Badge key={i} variant="destructive">{kw}</Badge>)}
								</div>
							) : <p className="text-sm text-muted-foreground">No important keywords are missing. Great job!</p>}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Formatting & Structure</CardTitle>
					</CardHeader>
					<CardContent>
						{result.formatting.issues.length > 0 ? (
							<ul className="space-y-3">
								{result.formatting.issues.map((issue: string, i: number) => (
									<li key={i} className="flex items-start gap-2 text-sm">
										<AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
										<span>{issue}</span>
									</li>
								))}
							</ul>
						) : (
							<div className="flex items-center gap-2 text-green-600 font-medium">
								<CheckCircle2 className="h-4 w-4" />
								<p>No formatting issues found.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Suggestions for Improvement</CardTitle>
				</CardHeader>
				<CardContent>
					{result.suggestions.length > 0 ? (
						<ul className="space-y-3 list-disc pl-5">
							{result.suggestions.map((sugg: string, i: number) => <li key={i} className="text-sm">{sugg}</li>)}
						</ul>
					) : <p className="text-sm text-muted-foreground">No specific suggestions. Your resume looks well-optimized!</p>}
				</CardContent>
			</Card>
		</div>
	);
};

export default function ATSScannerPage() {
	const [resume, setResume] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [scanHistory, setScanHistory] = useState<any[]>([]);
	const [jobDescription, setJobDescription] = useState<string>('');
	const [analysisResult, setAnalysisResult] = useState<any | null>(null);
	const [isScanning, setIsScanning] = useState<boolean>(false);
	const [scanError, setScanError] = useState<string | null>(null);

	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const { toast } = useToast();
	const supabase = createBrowserClient();

	const resumeId = params.id as string;
	const scanToLoad = searchParams.get('load');

	useEffect(() => {
		const fetchResumeAndHistory = async () => {
			if (!resumeId || !user) {
				setIsLoading(false);
				return;
			}
			try {
				setIsLoading(true);
				setError(null);

				// Fetch resume data
				const { data: resumeData, error: resumeError } = await supabase
					.from('resumes')
					.select('*')
					.eq('id', resumeId)
					.eq('user_id', user.id)
					.single();

				if (resumeError) throw new Error("Resume not found or you don't have access.");
				setResume(resumeData);

				// Fetch scan history count
				const { count, error: countError } = await supabase
					.from('resume_ats_analyses')
					.select('*', { count: 'exact', head: true })
					.eq('resume_id', resumeId)
					.eq('user_id', user.id);

				if (countError) throw countError;
				setScanHistory(Array(count || 0).fill(null));

				// If a specific scan should be loaded, fetch its job description
				if (scanToLoad) {
					const { data: scanData, error: scanError } = await supabase
						.from('resume_ats_analyses')
						.select('job_description')
						.eq('id', scanToLoad)
						.single();
					if (scanData) {
						setJobDescription(scanData.job_description);
					}
				}
			} catch (err: any) {
				console.error('Error loading page data:', err);
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResumeAndHistory();
	}, [resumeId, user, supabase, scanToLoad]);

	const handleScan = async () => {
		if (!jobDescription.trim()) {
			toast({
				title: "Job Description Required",
				description: "Please paste a job description to scan.",
				variant: "destructive",
			});
			return;
		}

		setIsScanning(true);
		setScanError(null);
		setAnalysisResult(null);

		try {
			const response = await fetch(`/api/resumes/${resumeId}/ats-scanner`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jobDescription }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || 'Failed to perform scan.');
			}
			setAnalysisResult(data.analysis);
			toast({
				title: "Analysis Complete",
				description: "Your resume has been successfully analyzed.",
                variant: "default", // Corrected: Changed from "success" to "default"
			});
		} catch (err: any) {
			console.error('Scan error:', err);
			setScanError(err.message);
			toast({
				title: "Scan Failed",
				description: err.message,
				variant: "destructive",
			});
		} finally {
			setIsScanning(false);
		}
	};

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
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error Loading Page</AlertTitle>
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
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="icon" asChild className="sm:mb-0 -ml-2 h-8 w-8">
								<Link href={`/dashboard/resumes/${resumeId}`}>
									<ArrowLeft className="h-4 w-4" />
								</Link>
							</Button>
							<div>
								<h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
									<Scan className="h-5 w-5 text-teal-600" />
									ATS Scanner
								</h1>
								<p className="text-sm text-muted-foreground">
									Analyzing: <strong>{resume?.title || 'Your Resume'}</strong>
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
									<Zap className="h-5 w-5 mr-2 text-teal-600" />
									Run New Analysis
								</CardTitle>
								<CardDescription>
									Paste a job description to analyze your resume's ATS compatibility.
								</CardDescription>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-4">
									<Textarea
										id="job-description-textarea"
										value={jobDescription}
										onChange={(e) => setJobDescription(e.target.value)}
										placeholder="Paste the job description here..."
										className="min-h-[200px]"
										disabled={isScanning}
									/>
									<LimitedActionButton
										feature="atsScans"
										featureName="ATS Scan"
										onAllowed={handleScan}
										disabled={!jobDescription.trim()}
										className="w-full bg-teal-600 hover:bg-teal-700"
									>
										<Scan className="h-4 w-4 mr-2" />
										Analyze Compatibility
									</LimitedActionButton>
								</div>

								{isScanning && (
									<div className="text-center py-6">
										<LoadingSpinner className="h-6 w-6" />
										<p className="mt-2 text-sm text-muted-foreground">Scanning... this may take a moment.</p>
									</div>
								)}

								{scanError && !isScanning && (
									<Alert variant="destructive" className="mt-4">
										<AlertCircle className="h-4 w-4" />
										<AlertTitle>Scan Error</AlertTitle>
										<AlertDescription>{scanError}</AlertDescription>
									</Alert>
								)}

								{analysisResult && !isScanning && <AnalysisResultDisplay result={analysisResult} />}
							</CardContent>
						</Card>
					</div>
					<div className="space-y-6">
						{/* Tips Card */}
						<Card className="border-2 border-blue-100">
							<CardHeader className="pb-3 border-b bg-blue-50/50">
								<CardTitle className="text-base flex items-center text-blue-800">
									<ThumbsUp className="h-4 w-4 mr-2 text-blue-600" />
									Tips for a High Score
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4">
								<ul className="space-y-3 text-sm">
									{[
										{ icon: <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: "Use a clean, simple format; avoid tables and columns." },
										{ icon: <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: "Include keywords and skills from the job description." },
										{ icon: <X className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: "Avoid graphics, images, headers, and footers." },
                                        // Corrected: Replaced ' with &apos; to fix linter error
										{ icon: <History className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: "Use standard section headings like &apos;Experience&apos; or &apos;Education&apos;." },
									].map((tip, i) => (
										<li key={i} className="flex items-start gap-3">
											{tip.icon}
											<span>{tip.text}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}