//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\JobListingCard.tsx
"use client";

import { Job } from "@/types/jobs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Building, 
  Clock, 
  Star, 
  ExternalLink,
  Percent
} from "lucide-react";
import { useRouter } from "next/navigation";

interface JobListingCardProps {
  job: Job;
}

export default function JobListingCard({ job }: JobListingCardProps) {
  const router = useRouter();

  const handleViewJob = () => {
    // Extract company token from job ID (format: companytoken-jobid)
    const companyToken = job.id.split('-')[0] || 'shopify';
    router.push(`/dashboard/jobs/${job.id}?company=${companyToken}`);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(job.url, '_blank');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewJob}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {job.score && (
                <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                  <Percent className="h-3 w-3 mr-1" />
                  {Math.round(job.score * 100)}%
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {job.employmentType || "Full-time"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {job.source || "Greenhouse"}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-lg leading-tight truncate">
              {job.title}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              // Add to saved jobs functionality here
            }}
          >
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-muted-foreground text-sm">
          <Building className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{job.employer}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Posted {job.published}</span>
        </div>
        
        {job.salary && (job.salary.min || job.salary.max) && (
          <div className="text-sm font-medium text-green-600">
            {job.salary.min && job.salary.max 
              ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`
              : job.salary.min 
                ? `From $${job.salary.min.toLocaleString()}`
                : `Up to $${job.salary.max?.toLocaleString()}`
            } {job.salary.currency || 'USD'}
          </div>
        )}
        
        {job.departments && job.departments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.departments.slice(0, 2).map((dept, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {dept}
              </Badge>
            ))}
            {job.departments.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{job.departments.length - 2} more
              </Badge>
            )}
          </div>
        )}
        
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
        
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description.length > 120 
              ? `${job.description.substring(0, 120)}...` 
              : job.description
            }
          </p>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewJob}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleApply}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}