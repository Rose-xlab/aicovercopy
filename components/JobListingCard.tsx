//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\JobListingCard.tsx

"use client";

import { Job } from "@/types/jobs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ArrowUpRight, 
  PenLine, 
  Star, 
  Percent
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface JobListingCardProps {
  job: Job;
}

export default function JobListingCard({ job }: JobListingCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  
  // Calculate match score based on relevance (this would be provided by the API in a real implementation)
  const matchScore = job.score ? Math.round(job.score * 100) : null;

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Job removed from saved jobs" : "Job saved",
      description: isSaved 
        ? "The job has been removed from your saved jobs."
        : "The job has been added to your saved jobs.",
    });
  };

  const createCoverLetter = () => {
    // Navigate to create cover letter page with job data
    window.location.href = `/dashboard/cover-letters?tab=create&jobId=${job.id}`;
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex-1">
        <div className="flex justify-between">
          <div className="mb-2">
            {matchScore && (
              <Badge className="bg-green-500 hover:bg-green-600">
                <Percent className="h-3 w-3 mr-1" />
                {matchScore}% Match
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isSaved ? 'text-yellow-500' : ''}`}
            onClick={toggleSave}
          >
            <Star className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
        
        <div className="space-y-2 mb-3">
          <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
            <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
          </Link>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{job.employer}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>Posted {job.published}</span>
          </div>
        </div>
        
        {job.description && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          </div>
        )}
        
        {job.skills && job.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t mt-auto flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" asChild>
          <Link href={`/dashboard/jobs/${job.id}`}>
            <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Link>
        </Button>
        <Button size="sm" className="flex-1" onClick={createCoverLetter}>
          <PenLine className="h-3.5 w-3.5 mr-1.5" />
          Create Cover Letter
        </Button>
      </CardFooter>
    </Card>
  );
}