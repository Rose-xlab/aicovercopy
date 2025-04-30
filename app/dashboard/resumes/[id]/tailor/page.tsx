"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { mapDatabaseToResumeData, mapResumeToDatabase } from '@/lib/resume-mappers';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import ResumeTailoringModal from '@/components/ResumeTailoringModal';
import { ResumeData } from '@/types/resume';

export default function TailorResumePage() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Get the resume ID from URL params
  const resumeId = params.id as string;
  
  // Handle modal close
  const handleModalOpenChange = (open: boolean) => {
    setOpenModal(open);
    if (!open) {
      // Redirect to resume view when modal is closed
      router.push(`/dashboard/resumes/${resumeId}`);
    }
  };
  
  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("TailorPage - Fetching resume with ID:", resumeId);
        
        if (!user) {
          setError('You must be logged in to tailor a resume');
          return;
        }
        
        if (!resumeId) {
          setError('Invalid resume ID');
          return;
        }
        
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .single();
        
        if (error) {
          console.error("TailorPage - Error fetching resume:", error);
          throw error;
        }
        
        // Verify ownership
        if (data.user_id !== user.id) {
          console.log("TailorPage - Resume belongs to different user:", data.user_id, "vs current user:", user.id);
          setError('You do not have permission to tailor this resume');
          return;
        }
        
        console.log("TailorPage - Resume fetched successfully");
        console.log("TailorPage - Raw database resume structure:", {
          id: data.id,
          user_id: data.user_id,
          template_id: data.template_id,
          fields: Object.keys(data)
        });
        
        // Transform data from database format to UI format
        const mappedResume = mapDatabaseToResumeData(data);
        
        if (!mappedResume) {
          throw new Error('Failed to map resume data');
        }
        
        console.log("TailorPage - Mapped resume data for tailoring:", {
          id: mappedResume.id,
          userId: mappedResume.userId,
          templateId: mappedResume.templateId,
          fields: Object.keys(mappedResume)
        });
        
        setResume(mappedResume);
      } catch (err: any) {
        console.error('Error fetching resume:', err);
        setError(err.message || 'Failed to load resume data');
        toast({
          title: "Error",
          description: "Failed to load resume data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResume();
  }, [resumeId, user, supabase, toast]);
  
  const handleResumeUpdate = (updatedResume: ResumeData) => {
    try {
      setIsSaving(true);
      
      if (!resume) {
        throw new Error('No resume data available to update');
      }
      
      console.log("TailorPage - Original resume data:", resume);
      console.log("TailorPage - Received updated resume data:", updatedResume);
      
      // Create a merged version to ensure all fields are present
      const mergedResume: ResumeData = {
        ...resume,  // Start with all original fields
        // Carefully update only the fields that should be updated
        personalInfo: updatedResume.personalInfo || resume.personalInfo,
        workExperience: updatedResume.workExperience || resume.workExperience,
        skills: updatedResume.skills || resume.skills,
        projects: updatedResume.projects || resume.projects,
        education: updatedResume.education || resume.education,
        // These fields are required by ResumeData
        title: updatedResume.title || resume.title,
        isPublic: updatedResume.isPublic ?? resume.isPublic,
        // Ensure the ID and user ID are preserved
        id: resumeId,
        userId: resume.userId || (user ? user.id : ''),
        templateId: resume.templateId || '',
        // Always update the timestamp
        updated_at: new Date().toISOString()
      };
      
      console.log("TailorPage - Merged resume before mapping:", {
        id: mergedResume.id,
        userId: mergedResume.userId,
        templateId: mergedResume.templateId,
        fields: Object.keys(mergedResume)
      });
      
      // Transform UI format to database format
      const dbResumeData = mapResumeToDatabase(mergedResume);
      
      if (!dbResumeData) {
        throw new Error('Failed to map resume to database format');
      }
      
      // CRITICAL FIX: Ensure template_id is null rather than empty string
      if (dbResumeData.template_id === '') {
        console.log("TailorPage - Converting empty template_id to null");
        dbResumeData.template_id = null;
      }
      
      // Fix any other potentially empty UUID fields
      if (dbResumeData.user_id === '') {
        console.log("TailorPage - Converting empty user_id to current user's ID");
        dbResumeData.user_id = user?.id || '';
      }
      
      console.log("TailorPage - Database formatted data after UUID fixes:", {
        id: dbResumeData.id,
        user_id: dbResumeData.user_id,
        template_id: dbResumeData.template_id,
        fields: Object.keys(dbResumeData)
      });
      
      // Asynchronously update the resume in the database
      (async () => {
        try {
          const { error } = await supabase
            .from('resumes')
            .update(dbResumeData)
            .eq('id', resumeId);
          
          if (error) {
            console.error("TailorPage - Supabase update error:", error);
            throw error;
          }
          
          console.log("TailorPage - Update successful");
          setResume(mergedResume);
          
          toast({
            title: "Success",
            description: "Your resume has been tailored and saved successfully.",
          });
          
          // Redirect back to the resume view
          router.push(`/dashboard/resumes/${resumeId}`);
        } catch (err: any) {
          console.error('Error saving tailored resume:', err);
          console.error('Error details:', err.message);
          
          if (err.details) {
            console.error('Error details from Supabase:', err.details);
          }
          
          toast({
            title: "Error",
            description: "Failed to save tailored resume. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsSaving(false);
        }
      })();
    } catch (err: any) {
      console.error('Error preparing tailored resume:', err);
      console.error('Error details:', err.message);
      
      toast({
        title: "Error",
        description: "Failed to process tailored resume. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container px-4 py-4 sm:py-8 flex justify-center">
        <LoadingSpinner className="text-teal-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container px-4 py-4 sm:py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4 sm:mt-6">
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/dashboard/resumes">Back to Resumes</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!resume) {
    return (
      <div className="container px-4 py-4 sm:py-8">
        <Alert className="bg-teal-50 border-teal-200">
          <AlertDescription className="text-teal-800">Resume data could not be loaded. Please try again.</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4 sm:mt-6">
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href={`/dashboard/resumes/${resumeId}`}>Back to Resume</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
        <Button variant="ghost" asChild className="mb-2 sm:mb-0 mr-0 sm:mr-4 hover:bg-teal-50 hover:text-teal-700 self-start">
          <Link href={`/dashboard/resumes/${resumeId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resume
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Tailor Resume</h1>
          <p className="text-sm text-muted-foreground">Optimize your resume for a specific job</p>
        </div>
      </div>
      
      <Card className="border-teal-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {resume && (
            <div className="flex justify-center">
              <ResumeTailoringModal
                resume={resume}
                onUpdateResume={handleResumeUpdate}
                open={openModal}
                onOpenChange={handleModalOpenChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Mobile info card - visible only on smaller screens */}
      <Card className="mt-4 border-teal-200 shadow-sm bg-teal-50/50 sm:hidden">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-teal-800 mb-2">Tips for tailoring your resume:</h3>
          <ul className="text-xs text-teal-700 space-y-1">
            <li>• Match your skills to the job description</li>
            <li>• Highlight relevant experience first</li>
            <li>• Use keywords from the job posting</li>
            <li>• Quantify your achievements where possible</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}