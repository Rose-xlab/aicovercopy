// 2. Create Cover Letter Tab Component
// src/components/cover-letter/CreateCoverLetterTab.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Sparkles, FileText, Linkedin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import DataSourcesManager from "@/components/cover-letter/DataSourcesManager";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import GenerationProcess from "@/components/cover-letter/GenerationProcess";
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor";
import TemplateSelection from "@/components/cover-letter/TemplateSelection";
import { generateCoverLetter } from "@/lib/coverLetterGenerator";

const CreateCoverLetterTab = ({ user, supabase, templates, toast, onTabChange }) => {
  // State for creation flow
  const [step, setStep] = useState(1);
  
  // Data sources state
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [cvFiles, setCvFiles] = useState([]);
  const [linkedInProfile, setLinkedInProfile] = useState(null);
  const [dataSource, setDataSource] = useState('none');
  const [resumeData, setResumeData] = useState(null);
  
  // Job description and letter content
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  
  // Generation state
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [editedLetter, setEditedLetter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  
  // Load CV files and LinkedIn profile on component mount
  useEffect(() => {
    loadCvFiles();
    loadLinkedInProfile();
  }, [user]);
  
  // Load CV files from database or localStorage
  const loadCvFiles = useCallback(async () => {
    // Implementation details...
  }, [user, supabase]);
  
  // Load LinkedIn profile from database or localStorage
  const loadLinkedInProfile = useCallback(async () => {
    // Implementation details...
  }, [user, supabase]);
  
  // Handle job description submit
  const handleJobDescriptionSubmit = (description, tone) => {
    setJobDescription(description);
    setSelectedTone(tone);
    
    // Extract job title and company name
    const titleMatch = description.match(/(?:position|job|role|opening)[:\s]+([^.,\n]+)/i);
    const companyMatch = description.match(/(?:company|organization|firm)[:\s]+([^.,\n]+)/i);
    
    if (titleMatch && titleMatch[1]) {
      setJobTitle(titleMatch[1].trim());
    }
    
    if (companyMatch && companyMatch[1]) {
      setCompanyName(companyMatch[1].trim());
    }
    
    // Move to data source selection
    setStep(2);
  };
  
  // Handle data source selection
  const handleDataSourceSelected = useCallback((sourceType, data) => {
    setDataSource(sourceType);
    setResumeData(data);
  }, []);
  
  // Generate cover letter
  const handleGenerateCoverLetter = useCallback(async (selectedData, selectedDataSource) => {
    if (!selectedData || selectedDataSource === 'none') {
      toast({ 
        title: "Data Source Error", 
        description: "Cannot generate without selected data.",
        variant: "destructive" 
      });
      return;
    }
    
    setGeneratingLetter(true);
    setIsRegenerating(false);
    setGenerationProgress(0);
    
    try {
      const generatedContent = await generateCoverLetter({
        jobDescription,
        jobTitle,
        companyName,
        tone: selectedTone,
        resumeData: selectedData,
        dataSource: selectedDataSource
      });
      
      setGeneratedLetter(generatedContent);
      setEditedLetter(generatedContent);
      
      // Move to cover letter editor
      setStep(3);
      
      // Show template selection
      setShowTemplateSelection(true);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Error generating cover letter.",
        variant: "destructive"
      });
    } finally {
      setGeneratingLetter(false);
    }
  }, [jobDescription, jobTitle, companyName, selectedTone, toast]);
  
  // Handle cover letter regeneration
  const handleRegenerateCoverLetter = useCallback(async () => {
    // Implementation details...
  }, [jobDescription, jobTitle, companyName, selectedTone, dataSource, resumeData, toast]);
  
  // Template selection handlers
  const handleApplyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
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
  
  // Get status of data sources
  const hasCV = cvFiles.some(cv => cv.isSelected);
  const hasLinkedIn = linkedInProfile?.status === 'connected';
  
  // Simulation for generation progress (for demo)
  useEffect(() => {
    let interval;
    
    if (generatingLetter) {
      // Implementation details...
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingLetter, generatedLetter]);
  
  // Rendering by step
  if (step === 1) {
    return (
      <div>
        <DataSourcesManager
          isOpen={isDataSourcesOpen}
          setIsOpen={setIsDataSourcesOpen}
          hasCV={hasCV}
          hasLinkedIn={hasLinkedIn}
          cvFiles={cvFiles}
          linkedInProfile={linkedInProfile}
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
      return (
        <GenerationProcess 
          progress={generationProgress}
          isRegenerating={isRegenerating}
          dataSource={dataSource}
        />
      );
    }
    
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="mb-6"
        >
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
                  variant: "destructive"
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
            ) : (
              'Generate Cover Letter'
            )}
            <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </div>
      </div>
    );
  }
  
  if (step === 3) {
    return (
      <div>
        {showTemplateSelection && (
          <TemplateSelection
            templates={templates}
            selectedTemplate={selectedTemplate}
            onApplyTemplate={handleApplyTemplate}
            onSkipSelection={handleSkipTemplateSelection}
          />
        )}
        
        <CoverLetterEditor
          jobTitle={jobTitle}
          companyName={companyName}
          generatedLetter={generatedLetter}
          editedLetter={editedLetter}
          setEditedLetter={setEditedLetter}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          dataSource={dataSource}
          selectedTemplate={selectedTemplate}
          templates={templates}
          onBack={() => setStep(2)}
          onRegenerateLetter={handleRegenerateCoverLetter}
          onShowTemplateSelection={() => setShowTemplateSelection(true)}
          onTabChange={onTabChange}
          generatingLetter={generatingLetter}
          isRegenerating={isRegenerating}
          toast={toast}
          user={user}
        />
      </div>
    );
  }
};

export default CreateCoverLetterTab;