"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Sparkles, FileText, Linkedin, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import DataSourcesManager from "./DataSourcesManager";
import { ResumeSourceSelector } from "@/components/ResumeSourceSelector"; 
import GenerationProcess from "./GenerationProcess";
import CoverLetterEditor from "./CoverLetterEditor";
import TemplateSelection from "./TemplateSelection";
import { generateCoverLetter, GenerationResult } from "@/lib/coverLetterGenerator";
import { SupabaseClient } from "@supabase/supabase-js";
import type { CoverLetter as CoverLetterType } from "@/types/cover-letter";
import { Database } from "@/types/supabase";
import type { CvFile as ImportedCvFile } from '@/lib/cv-helpers';

// --- Helper Component & Type Definitions ---

const LoadingSpinner = ({ className }: { className?: string }) => (
  <Loader2 className={`animate-spin ${className}`} />
);

// FIX: Define types to perfectly match the props of the child components
interface CVFileForManager {
  name: string;
  isSelected: boolean;
}

interface LinkedInProfileForManager {
  name: string;
}

interface Template {
  id: string;
  name: string;
}

interface ToastArgs {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

// Props for the main component
interface CreateCoverLetterTabProps {
  user: { id: string; [key: string]: any } | null;
  supabase: SupabaseClient;
  templates: Template[];
  toast: (args: ToastArgs) => void;
  onTabChange: (tab: string) => void;
}


const CreateCoverLetterTab = ({ user, supabase, templates, toast, onTabChange }: CreateCoverLetterTabProps) => {
  const [step, setStep] = useState(1);
  
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  // Use the imported, more complete CvFile type for the main state
  const [cvFiles, setCvFiles] = useState<ImportedCvFile[]>([]); 
  const [linkedInProfile, setLinkedInProfile] = useState<Database['public']['Tables']['linkedin_profiles']['Row'] | null>(null);
  const [dataSource, setDataSource] = useState<'none' | 'cv' | 'linkedin' | 'both'>('none');
  const [resumeData, setResumeData] = useState<any>(null);
  
  const [jobDescription, setJobDescription] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [coverLetterForEditor, setCoverLetterForEditor] = useState<(CoverLetterType & { dataSource: any }) | null>(null);
  
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);

  const loadCvFiles = useCallback(async () => {
    // Mock implementation
  }, []);
  
  const loadLinkedInProfile = useCallback(async () => {
    // Mock implementation
  }, []);
  
  useEffect(() => {
    if (user) {
      loadCvFiles();
      loadLinkedInProfile();
    }
  }, [user, loadCvFiles, loadLinkedInProfile]);
  
  const handleJobDescriptionSubmit = (description: string, tone: string) => {
    setJobDescription(description);
    setStep(2);
  };
  
  const handleDataSourceSelected = useCallback((sourceType: 'cv' | 'linkedin' | 'both' | 'none', data: any) => {
    setDataSource(sourceType);
    setResumeData(data);
  }, []);
  
  const handleGenerateCoverLetter = useCallback(async (selectedData: any, selectedDataSource: 'cv' | 'linkedin' | 'both') => {
    if (!user) {
        toast({ title: "User not found", description: "You must be logged in to generate a letter.", variant: "destructive" });
        return;
    }
    setGeneratingLetter(true);
    setIsRegenerating(false);
    setGenerationProgress(0);
    
    try {
      const result: GenerationResult = await generateCoverLetter({
        jobDescription,
        tone: "professional",
        resumeData: selectedData,
        dataSource: selectedDataSource
      });
      
      const newCoverLetter: CoverLetterType = {
          userId: user.id,
          jobDescription: jobDescription,
          content: result.coverLetter,
          tone: "professional",
          created_at: new Date(),
          jobTitle: result.jobTitle,
          companyName: result.companyName,
          data_source: selectedDataSource,
      };

      setCoverLetterForEditor({
          ...newCoverLetter,
          dataSource: selectedDataSource 
      });
      
      setStep(3);
      setShowTemplateSelection(true);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGeneratingLetter(false);
    }
  }, [jobDescription, user, toast]);
  
  const handleRegenerateCoverLetter = useCallback(async (letter: CoverLetterType) => {
      if (!letter) return;
      setIsRegenerating(true);
      try {
        const result = await generateCoverLetter({
            jobDescription: letter.jobDescription,
            tone: letter.tone,
            resumeData: resumeData,
            dataSource: letter.data_source,
            regenerate: true,
        });
        setCoverLetterForEditor(prev => prev ? { ...prev, content: result.coverLetter } : null);
        toast({ title: "Success", description: "Cover letter has been regenerated." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Regeneration Failed", description: errorMessage, variant: "destructive" });
      } finally {
        setIsRegenerating(false);
      }
  }, [resumeData, toast]);
  
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCoverLetterForEditor(prev => prev ? { ...prev, templateId: templateId } : null);
    setShowTemplateSelection(false);
    toast({
      title: "Template Applied",
      description: "Your cover letter has been formatted with the selected template.",
    });
  };
  
  const handleSkipTemplateSelection = () => {
    setShowTemplateSelection(false);
    toast({
      title: "No Template Selected",
      description: "Your cover letter will use the default format.",
    });
  };
  
  const hasCV = cvFiles.some(cv => cv.isSelected);
  const hasLinkedIn = linkedInProfile?.status === 'connected';
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingLetter) {
        let progress = 0;
        interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 99;
                clearInterval(interval);
            }
            setGenerationProgress(progress);
        }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingLetter]);
  
  // FIX: Prepare simplified props for the DataSourcesManager
  const cvFilesForManager: CVFileForManager[] = cvFiles.map(cv => ({
      name: cv.name,
      isSelected: !!cv.isSelected // Ensure it's always a boolean
  }));

  const linkedInProfileForManager: LinkedInProfileForManager | null = linkedInProfile && linkedInProfile.name 
    ? { name: linkedInProfile.name } 
    : null;

  if (step === 1) {
    return (
      <div>
        <DataSourcesManager
          isOpen={isDataSourcesOpen}
          setIsOpen={setIsDataSourcesOpen}
          hasCV={hasCV}
          hasLinkedIn={hasLinkedIn}
          cvFiles={cvFilesForManager}
          linkedInProfile={linkedInProfileForManager}
        />
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
               <div>
                 <CardTitle className="text-2xl flex items-center">
                   <Sparkles className="h-5 w-5 mr-2 text-primary" />
                   Create a Cover Letter
                 </CardTitle>
               </div>
               <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                 <div className={`flex items-center rounded-full px-2 py-1 ${hasCV ? 'bg-green-500/10 text-green-600' : 'bg-muted'}`}>
                   <FileText className="h-3 w-3 mr-1" />
                   <span>CV {hasCV ? '✓' : ''}</span>
                 </div>
                 <div className={`flex items-center rounded-full px-2 py-1 ${hasLinkedIn ? 'bg-green-500/10 text-green-600' : 'bg-muted'}`}>
                   <Linkedin className="h-3 w-3 mr-1" />
                   <span>LinkedIn {hasLinkedIn ? '✓' : ''}</span>
                 </div>
               </div>
             </div>
          </CardHeader>
          <CardContent>
             <div className="p-1">
               <JobDescriptionInput 
                 onSubmit={handleJobDescriptionSubmit} 
                 cvUploaded={hasCV}
                 linkedInConnected={hasLinkedIn}
                 user={user}
               />
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (step === 2) {
    if (generatingLetter) {
      const generationDataSource = dataSource === 'none' ? 'cv' : dataSource;
      return (
        <GenerationProcess 
          progress={generationProgress}
          isRegenerating={isRegenerating}
          dataSource={generationDataSource}
        />
      );
    }
    
    return (
      <div>
        <Button variant="outline" onClick={() => setStep(1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Description
        </Button>
        <ResumeSourceSelector
          cvFiles={cvFiles}
          linkedInProfile={linkedInProfile}
          onDataSourceSelected={handleDataSourceSelected}
        />
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              if (dataSource !== 'none' && resumeData) {
                handleGenerateCoverLetter(resumeData, dataSource);
              } else {
                toast({ 
                  title: "Please select a data source",
                  variant: "destructive",
                  description: "You must select a CV or LinkedIn profile to proceed."
                });
              }
            }}
            disabled={dataSource === 'none' || !resumeData || generatingLetter}
          >
            {generatingLetter ? (
              <>
                <LoadingSpinner className="mr-2"/> 
                Generating...
              </>
            ) : 'Generate Cover Letter'}
            <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </div>
      </div>
    );
  }
  
  if (step === 3 && coverLetterForEditor) {
    return (
      <div>
        {showTemplateSelection && (
          <TemplateSelection
            selectedTemplate={selectedTemplate}
            onApplyTemplate={handleApplyTemplate}
            onSkipSelection={handleSkipTemplateSelection}
          />
        )}
        <CoverLetterEditor
          coverLetter={coverLetterForEditor}
          onBack={() => setStep(2)}
          onTabChange={onTabChange}
          onRegenerateLetter={handleRegenerateCoverLetter}
        />
      </div>
    );
  }

  return null;
};

export default CreateCoverLetterTab;
