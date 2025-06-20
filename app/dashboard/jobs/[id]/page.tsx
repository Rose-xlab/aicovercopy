"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CheckCircle2
} from "lucide-react";
import { Job } from "@/types/jobs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Simulated match score (in a real app, would come from API)
  const matchScore = 85;
  
  // Get job ID from URL
  const jobId = params.id as string;
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // UPDATED: Now using query parameter instead of path parameter
        const response = await fetch(`/api/jobs?id=${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Could not load job details. Please try again later.');
        
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
        employer: "TechCorp Norway AS",
        location: "Oslo, Norway",
        description: "TechCorp is looking for a Senior Frontend Developer to join our growing team in Oslo. You will be responsible for developing user interfaces for our enterprise applications, working closely with UX designers and backend developers.",
        requirements: "- 5+ years of experience with modern JavaScript frameworks\n- Expert knowledge of React\n- Experience with TypeScript\n- Familiarity with modern CSS techniques and frameworks\n- Knowledge of testing frameworks\n- Excellent communication skills",
        duties: "- Develop responsive user interfaces for web applications\n- Collaborate with UX designers to implement designs\n- Write clean, maintainable code\n- Perform code reviews\n- Mentor junior developers\n- Participate in agile development processes",
        published: "3 days ago",
        deadline: "2023-06-30",
        url: "https://example.com/job",
        employmentType: "Full-time",
        workplaceType: "Hybrid",
        skills: ["React", "TypeScript", "CSS", "JavaScript", "Frontend Development", "Testing"],
        salary: {
          min: 700000,
          max: 900000,
          currency: "NOK"
        },
        sector: "Information Technology",
        source: "NAV",
        matchReason: "Your profile shows strong experience with React and TypeScript, which are key requirements for this role. Your previous work in frontend development aligns well with the job duties.",
        highlights: ["Competitive salary", "Flexible working hours", "Modern tech stack", "Professional development opportunities"]
      });
    };
    
    fetchJobDetails();
  }, [jobId]);
  
  // Rest of the component remains the same...
  
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
    router.push(`/dashboard/cover-letters?tab=create&jobId=${jobId}`);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-2/3 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-1/4 bg-muted rounded animate-pulse mt-4"></div>
        <div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-2"></div>
        <div className="h-40 w-full bg-muted rounded animate-pulse mt-8"></div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Job not found. It may have been removed or is no longer available."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        
        <div className="flex items-center gap-3">
          <Button 
            variant={isSaved ? "secondary" : "outline"} 
            onClick={handleSaveJob}
          >
            <Star className="mr-2 h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Saved" : "Save Job"}
          </Button>
          
          <Button variant="default" onClick={handleApply}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Apply Now
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {matchScore && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Percent className="h-3 w-3 mr-1" />
                    {matchScore}% Match
                  </Badge>
                )}
                <Badge variant="outline">
                  {job.employmentType || "Full-time"}
                </Badge>
                <Badge variant="outline">
                  {job.workplaceType || "On-site"}
                </Badge>
              </div>
              
              <h1 className="text-2xl font-bold">{job.title}</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">{job.employer}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Posted {job.published}</span>
                </div>
                
                {job.deadline && (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Apply before {job.deadline}</span>
                  </div>
                )}
              </div>
              
              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="bg-muted p-3 rounded-md">
                  <h3 className="font-medium mb-1">Salary</h3>
                  <p>
                    {job.salary.min && job.salary.max 
                      ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${job.salary.currency || 'NOK'} per year`
                      : job.salary.min 
                        ? `From ${job.salary.min.toLocaleString()} ${job.salary.currency || 'NOK'} per year` 
                        : `Up to ${job.salary.max?.toLocaleString()} ${job.salary.currency || 'NOK'} per year`
                    }
                  </p>
                </div>
              )}
              
              {job.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {job.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.requirements && (
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-medium flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    Requirements
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-muted-foreground text-sm">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {job.duties && (
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                    Responsibilities
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-muted-foreground text-sm">
                    {job.duties}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-medium">Job Match Analysis</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Match</span>
                <div className="ml-auto flex items-center">
                  <span className="font-medium mr-2">{matchScore}%</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${matchScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {job.matchReason && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Why this job matches you:</h4>
                  <p className="text-sm text-muted-foreground">
                    {job.matchReason}
                  </p>
                </div>
              )}
              
              {job.skills && job.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Skills Required:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {job.highlights && job.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Highlights:</h4>
                  <ul className="space-y-1">
                    {job.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t flex-col gap-3 pt-4">
              <Button className="w-full" onClick={handleCreateCoverLetter}>
                <PenLine className="h-4 w-4 mr-2" />
                Create Cover Letter
              </Button>
              
              <Button variant="outline" className="w-full" onClick={handleApply}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply on {job.source || "Employer's Website"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-medium">Job Details</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Employment Type</span>
                <span>{job.employmentType || "Full-time"}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Workplace Type</span>
                <span>{job.workplaceType || "On-site"}</span>
              </div>
              
              {job.sector && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Industry</span>
                  <span>{job.sector}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Source</span>
                <span>{job.source || "NAV"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}