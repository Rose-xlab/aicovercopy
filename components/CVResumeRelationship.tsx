"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, FileUp, ArrowRight, LinkIcon, ExternalLink, Clock } from "lucide-react";
import { CvFile } from "@/components/CVManager";
import { useCVResumeIntegration } from "@/lib/hooks/useCVResumeIntegration";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface CVResumeRelationshipProps {
  cvId?: string;
  resumeId?: string;
  showActions?: boolean;
}

export default function CVResumeRelationship({
  cvId,
  resumeId,
  showActions = true
}: CVResumeRelationshipProps) {
  const [cv, setCv] = useState<CvFile | null>(null);
  const [resume, setResume] = useState<any | null>(null);
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { 
    getLinkedCV, 
    getLinkedResume, 
    linkCVToResume, 
    unlinkCV,
    isLoading: isIntegrationLoading 
  } = useCVResumeIntegration();
  
  const router = useRouter();
  
  // Fetch data based on what was provided
  useEffect(() => {
    const fetchRelationshipData = async () => {
      setIsLoading(true);
      
      try {
        // If we have a CV ID, check if it has a linked resume
        if (cvId) {
          const cvResume = await getLinkedResume(cvId);
          if (cvResume) {
            setResume(cvResume);
            setIsLinked(true);
          }
        }
        
        // If we have a resume ID, check if it has a linked CV
        if (resumeId) {
          const resumeCV = await getLinkedCV(resumeId);
          if (resumeCV) {
            setCv(resumeCV);
            setIsLinked(true);
          }
        }
      } catch (error) {
        console.error('Error fetching relationship data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (cvId || resumeId) {
      fetchRelationshipData();
    } else {
      setIsLoading(false);
    }
  }, [cvId, resumeId, getLinkedCV, getLinkedResume]);
  
  // Handle linking CV to resume
  const handleLinkCVToResume = async () => {
    if (cvId && resumeId) {
      const success = await linkCVToResume(cvId, resumeId);
      if (success) {
        setIsLinked(true);
      }
    }
  };
  
  // Handle unlinking
  const handleUnlink = async () => {
    if (cvId) {
      const success = await unlinkCV(cvId);
      if (success) {
        setIsLinked(false);
        setResume(null);
      }
    }
  };
  
  // Handle viewing resume
  const handleViewResume = () => {
    if (resume?.id) {
      router.push(`/dashboard/resumes/${resume.id}`);
    }
  };
  
  // Handle viewing CV
  const handleViewCV = () => {
    if (cv?.fileUrl) {
      window.open(cv.fileUrl, '_blank');
    }
  };
  
  // If neither CV nor Resume ID provided, show empty state
  if (!cvId && !resumeId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No CV or resume specified.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoading || isIntegrationLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center items-center">
          <LoadingSpinner className="mr-2" />
          <p>Loading document information...</p>
        </CardContent>
      </Card>
    );
  }
  
  // For linked relationship (both CV and Resume exist)
  if (isLinked && cv && resume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-green-500" />
            Linked Documents
          </CardTitle>
          <CardDescription>
            This document is linked to another item in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            <div className="flex-1 border rounded-md p-4 w-full sm:w-auto">
              <div className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-500" />
                <div>
                  <h3 className="font-medium">{cv.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Uploaded on {new Date(cv.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <Badge className="mb-1 bg-green-100 text-green-800 hover:bg-green-200">
                <LinkIcon className="h-3 w-3 mr-1" />
                Linked
              </Badge>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 border rounded-md p-4 w-full sm:w-auto">
              <div className="flex items-center">
                <Upload className="h-6 w-6 mr-2 text-blue-500" />
                <div>
                  <h3 className="font-medium">{resume.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-600">
              Changes made to your resume will not affect the original CV file, but you can use either one for your applications.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        {showActions && (
          <CardFooter className="border-t pt-4">
            <Button variant="outline" onClick={handleViewCV}>
              <FileText className="h-4 w-4 mr-2" />
              View CV
            </Button>
            <Button variant="outline" onClick={handleViewResume} className="ml-2">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resume
            </Button>
            <Button variant="outline" onClick={handleUnlink} className="ml-auto">
              Unlink Documents
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }
  
  // If we have a CV but no linked resume
  if (cvId && !resume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CV Information</CardTitle>
          <CardDescription>
            Details about your CV document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-500" />
              <div>
                <h3 className="font-medium">{cv?.name || "Your CV"}</h3>
                {cv && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded on {new Date(cv.uploadDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        {showActions && (
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button variant="outline" onClick={handleViewCV}>
              <FileText className="h-4 w-4 mr-2" />
              View CV
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }
  
  // If we have a resume but no linked CV
  if (resumeId && !cv) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume Information</CardTitle>
          <CardDescription>
            Details about your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4">
            <div className="flex items-center">
              <Upload className="h-6 w-6 mr-2 text-blue-500" />
              <div>
                <h3 className="font-medium">{resume?.title || "Your Resume"}</h3>
                {resume && (
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              This resume was created directly and is not linked to any CV file.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Default fallback
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground">No document information available.</p>
      </CardContent>
    </Card>
  );
}