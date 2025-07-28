//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\jobs\[id]\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Clock, 
  PenLine, 
  Star, 
  Building, 
  BookOpen, 
  Percent, 
  CheckCircle2,
  Share2,
  Heart
} from "lucide-react";
import { Job } from "@/types/jobs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Simulated match score (in a real app, would come from API)
  const matchScore = 85;
  
  // Get job ID from URL
  const jobId = params.id as string;
  
  // Get company from URL search params (passed from job listing)
  const company = searchParams.get('company') || 'shopify'; // Default fallback
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // UPDATED: Now using query parameter and company token
        const response = await fetch(`/api/jobs?id=${jobId}&company=${company}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch job details');
        }
        
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Could not load job details. Please try again later.');
        
        // Simulate job data for demo purposes
        // In a real app, remove this and handle the error properly
        simulateJobData();
      } finally {
        setIsLoading(false);
      }
    };
    
    const simulateJobData = () => {
      // This is just for demonstration purposes
      setJob({
        id: jobId,
        title: "Senior Frontend Developer",
        employer: "TechCorp (via Greenhouse)",
        location: "San Francisco, CA",
        description: "We're looking for a Senior Frontend Developer to join our growing team. You will be responsible for developing user interfaces for our enterprise applications, working closely with UX designers and backend developers to create amazing user experiences.",
        requirements: "- 5+ years of experience with modern JavaScript frameworks\n- Expert knowledge of React and TypeScript\n- Experience with modern CSS techniques and frameworks\n- Familiarity with testing frameworks (Jest, Cypress)\n- Knowledge of build tools and CI/CD\n- Excellent communication skills",
        duties: "- Develop responsive user interfaces for web applications\n- Collaborate with UX designers to implement pixel-perfect designs\n- Write clean, maintainable, and well-tested code\n- Perform code reviews and mentor junior developers\n- Participate in agile development processes\n- Optimize applications for maximum speed and scalability",
        published: "3 days ago",
        deadline: "2024-02-15",
        url: `https://boards.greenhouse.io/${company}/jobs/${jobId}`,
        employmentType: "Full-time",
        workplaceType: "Hybrid",
        skills: ["React", "TypeScript", "CSS", "JavaScript", "Frontend Development", "Testing"],
        salary: {
          min: 120000,
          max: 180000,
          currency: "USD"
        },
        sector: "Information Technology",
        source: "Greenhouse",
        departments: ["Engineering", "Frontend"],
        offices: ["San Francisco", "Remote"],
        matchReason: "Your profile shows strong experience with React and TypeScript, which are key requirements for this role. Your previous work in frontend development aligns well with the job duties.",
        highlights: ["Competitive salary", "Flexible working hours", "Modern tech stack", "Professional development opportunities"]
      });
    };
    
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, company]);
  
  const handleSaveJob = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Job removed from saved jobs" : "Job saved",
      description: isSaved 
        ? "The job has been removed from your saved jobs."
        : "The job has been added to your saved jobs.",
    });
  };
  
  const handleApply = () => {
    // In a real implementation, this might track the application or redirect to the application URL
    window.open(job?.url, '_blank');
  };
  
  const handleCreateCoverLetter = () => {
    // Navigate to create cover letter page with job data
    router.push(`/dashboard/cover-letters?tab=create&jobId=${jobId}&company=${company}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job opportunity at ${job?.employer}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Job link has been copied to clipboard.",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="ml-auto flex gap-2">
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          
          <Alert variant="destructive" className="bg-white">
            <AlertDescription>
              {error || "Job not found. It may have been removed or is no longer available."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Mobile-first header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-none"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            
            <Button 
              variant={isSaved ? "secondary" : "outline"} 
              size="sm"
              onClick={handleSaveJob}
              className="flex-1 sm:flex-none"
            >
              <Heart className="h-4 w-4 sm:mr-2" fill={isSaved ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </Button>
            
            <Button 
              onClick={handleApply}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Apply Now</span>
              <span className="sm:hidden">Apply</span>
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="space-y-6">
          {/* Job header card */}
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {matchScore && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      {matchScore}% Match
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white">
                    {job.employmentType || "Full-time"}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    {job.workplaceType || "On-site"}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Greenhouse
                  </Badge>
                </div>
                
                {/* Title and company */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium">{job.employer}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
                
                {/* Salary prominently displayed */}
                {job.salary && (job.salary.min || job.salary.max) && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-lg font-semibold text-green-700">
                        {job.salary.min && job.salary.max 
                          ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`
                          : job.salary.min 
                            ? `From $${job.salary.min.toLocaleString()}`
                            : `Up to $${job.salary.max?.toLocaleString()}`
                        } <span className="text-sm font-normal text-gray-600">{job.salary.currency || 'USD'} per year</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Quick info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-xs text-gray-600">Posted</p>
                  <p className="text-sm font-medium">{job.published}</p>
                </div>
                
                {job.deadline && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-xs text-gray-600">Deadline</p>
                    <p className="text-sm font-medium">{job.deadline}</p>
                  </div>
                )}
                
                {job.sector && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-xs text-gray-600">Industry</p>
                    <p className="text-sm font-medium">{job.sector}</p>
                  </div>
                )}
                
                {job.departments && job.departments.length > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-xs text-gray-600">Department</p>
                    <p className="text-sm font-medium">{job.departments[0]}</p>
                  </div>
                )}
              </div>
              
              {/* Job description */}
              {job.description && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="h-1 w-1 bg-blue-600 rounded-full mr-3"></div>
                    About this role
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Requirements and responsibilities grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {job.requirements && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                    Requirements
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {job.duties && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Briefcase className="h-5 w-5 mr-3 text-green-600" />
                    Responsibilities
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {job.duties}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Match analysis and skills */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                Job Match Analysis
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Match score */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Match</span>
                  <span className="text-lg font-bold text-green-600">{matchScore}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${matchScore}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Match reason */}
              {job.matchReason && (
                <div className="space-y-2">
                  <h4 className="font-medium">Why this job matches you:</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {job.matchReason}
                  </p>
                </div>
              )}
              
              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Key Skills Required:</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="px-3 py-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Highlights */}
              {job.highlights && job.highlights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Job Highlights:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800 text-sm font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Action buttons - mobile sticky */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:relative sm:border-0 sm:p-0 sm:bg-transparent">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCreateCoverLetter}
                className="flex-1 bg-white border-gray-300 hover:bg-gray-50"
              >
                <PenLine className="h-4 w-4 mr-2" />
                Cover Letter
              </Button>
              
              <Button 
                onClick={handleApply}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}