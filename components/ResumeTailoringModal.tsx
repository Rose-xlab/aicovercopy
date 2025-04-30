"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResumeData, ResumeTemplate } from "@/types/resume";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import ResumePreview from '@/components/ResumePreview';
// Import local templates
import professionalTemplate from '@/lib/resume-templates/professional';
import modernTemplate from '@/lib/resume-templates/modern';
import { 
  Target, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  ArrowRight, 
  Check, 
  X, 
  Eye, 
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize 
} from "lucide-react";

interface ResumeTailoringModalProps {
  resume: ResumeData;
  onUpdateResume: (newData: ResumeData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ResumeTailoringModal({ 
  resume, 
  onUpdateResume,
  open,
  onOpenChange 
}: ResumeTailoringModalProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState("job-description");
  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const { toast } = useToast();
  
  // Track which sections have been changed by the AI
  const [changedSections, setChangedSections] = useState<string[]>([]);

  // Load the template once tailored resume is available
  useEffect(() => {
    if (!tailoredResume) return;
    
    // Use the template from the resume if set, otherwise use the professional template
    if (resume.templateId) {
      // Try to find a matching template based on ID
      if (resume.templateId === professionalTemplate.id) {
        setTemplate(professionalTemplate);
      } else if (resume.templateId === modernTemplate.id) {
        setTemplate(modernTemplate);
      } else {
        // Default to professional template if no match
        setTemplate(professionalTemplate);
      }
    } else {
      // Use professional template as default
      setTemplate(professionalTemplate);
    }
  }, [tailoredResume, resume.templateId]);

  // Handle job description submission and AI tailoring
  const handleTailorResume = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to tailor your resume.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setChangedSections([]);
      
      // Call the API to tailor the resume
      const response = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to tailor resume');
      }

      const data = await response.json();
      
      // Make sure we have valid tailored resume data
      if (!data.tailoredResume) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure the tailored resume has all the required fields from the original resume
      const validatedTailoredResume = {
        ...resume, // Start with the original resume as base
        ...data.tailoredResume, // Override with tailored data
        // Ensure critical fields are preserved
        id: resume.id,
        userId: resume.userId,
        templateId: resume.templateId,
        isPublic: resume.isPublic,
        created_at: resume.created_at,
        updated_at: new Date().toISOString()
      };
      
      // Track which sections were changed
      setChangedSections(data.changedSections || determineChanges(resume, validatedTailoredResume));
      
      // Set the tailored resume data
      setTailoredResume(validatedTailoredResume);
      
      // Switch to the preview tab
      setActiveTab("preview");
      
      toast({
        title: "Resume Tailored Successfully",
        description: "Your resume has been tailored to match the job description.",
      });
    } catch (err: any) {
      console.error('Error tailoring resume:', err);
      setError(err.message || 'Failed to tailor resume. Please try again.');
      toast({
        title: "Tailoring Failed",
        description: err.message || "Failed to tailor resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which sections were changed by the AI
  const determineChanges = (original: ResumeData, tailored: ResumeData): string[] => {
    const changes: string[] = [];
    
    // Check personal info (summary)
    if (original.personalInfo?.summary !== tailored.personalInfo?.summary) {
      changes.push('summary');
    }
    
    // Check work experience
    if (JSON.stringify(original.workExperience) !== JSON.stringify(tailored.workExperience)) {
      changes.push('workExperience');
    }
    
    // Check skills
    if (JSON.stringify(original.skills) !== JSON.stringify(tailored.skills)) {
      changes.push('skills');
    }
    
    // Check projects
    if (JSON.stringify(original.projects) !== JSON.stringify(tailored.projects)) {
      changes.push('projects');
    }
    
    return changes;
  };

  // Apply the tailored resume
  const handleApplyChanges = () => {
    if (tailoredResume) {
      console.log("ResumeTailoringModal - Before onUpdateResume:", tailoredResume);
      
      // Make sure we update the timestamp
      const finalResumeData = {
        ...tailoredResume,
        updated_at: new Date().toISOString()
      };
      
      console.log("ResumeTailoringModal - After adding timestamp:", finalResumeData);
      onUpdateResume(finalResumeData);
      onOpenChange?.(false);
      
      toast({
        title: "Changes Applied",
        description: "Your resume has been updated with the tailored content.",
      });
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(75);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
            Tailor Resume for Job Description
          </DialogTitle>
          <DialogDescription className="text-sm">
            Optimize your resume for ATS systems by tailoring it to match a specific job description.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 sm:mt-4">
          <TabsList className="grid grid-cols-3 bg-teal-100">
            <TabsTrigger 
              value="job-description" 
              className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Job Description</span>
              <span className="xs:hidden">Job</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white" 
              disabled={!tailoredResume}
            >
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Tailored Resume</span>
              <span className="xs:hidden">Changes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="template-preview" 
              className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white" 
              disabled={!tailoredResume}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Template Preview</span>
              <span className="xs:hidden">Template</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="job-description" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            <Card className="border-teal-200">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                  Enter Job Description
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Paste the full job description to optimize your resume with matching keywords and skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[200px] sm:min-h-[300px] focus-visible:ring-teal-500"
                  disabled={isLoading}
                />
              </CardContent>
              <CardFooter className="flex flex-col xs:flex-row xs:justify-between gap-2 xs:gap-0">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  AI will optimize your resume to increase your chances of passing ATS filters.
                </div>
                <Button 
                  onClick={handleTailorResume} 
                  disabled={isLoading || !jobDescription.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm self-end xs:self-auto"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Tailoring...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Tailor Resume</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {tailoredResume && (
              <>
                <Alert className="bg-teal-50 border-teal-200">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                  <AlertTitle className="text-teal-800 text-xs sm:text-sm font-medium">Resume Tailored Successfully</AlertTitle>
                  <AlertDescription className="text-teal-700 text-xs">
                    The following sections have been optimized for this job description:
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                      {changedSections.map((section) => (
                        <Badge key={section} variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 text-xs">
                          {section === 'workExperience' ? 'Work Experience' : 
                           section === 'personalInfo' ? 'Personal Info' :
                           section.charAt(0).toUpperCase() + section.slice(1)}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => setActiveTab("template-preview")}
                        className="bg-white border-teal-300 text-teal-700 hover:bg-teal-50 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1.5" />
                        View Resume Template Preview
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Summary Preview */}
                  {changedSections.includes('summary') && (
                    <Card className="border-teal-200">
                      <CardHeader className="py-2 sm:py-3 px-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm flex items-center">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 mr-1 sm:mr-2" />
                          Professional Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 py-0 sm:py-1">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="p-2 sm:p-3 bg-gray-50 rounded-md border">
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Original</h4>
                            <p className="text-xs sm:text-sm">{resume.personalInfo?.summary || 'No summary provided'}</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-teal-50 rounded-md border border-teal-200">
                            <h4 className="text-xs font-medium text-teal-700 mb-1">Tailored</h4>
                            <p className="text-xs sm:text-sm">{tailoredResume.personalInfo?.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Skills Preview */}
                  {changedSections.includes('skills') && (
                    <Card className="border-teal-200">
                      <CardHeader className="py-2 sm:py-3 px-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm flex items-center">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 mr-1 sm:mr-2" />
                          Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 py-0 sm:py-1">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="p-2 sm:p-3 bg-gray-50 rounded-md border">
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Original Skills ({resume.skills.length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {resume.skills.map((skill) => (
                                <Badge key={skill.id} variant="outline" className="text-xs">{skill.name}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 bg-teal-50 rounded-md border border-teal-200">
                            <h4 className="text-xs font-medium text-teal-700 mb-1">Tailored Skills ({tailoredResume.skills.length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {tailoredResume.skills.map((skill) => (
                                <Badge 
                                  key={skill.id} 
                                  variant="outline"
                                  className={!resume.skills.some(s => s.name === skill.name) ? 
                                    "bg-teal-100 border-teal-300 text-teal-800 text-xs" : "text-xs"}
                                >
                                  {!resume.skills.some(s => s.name === skill.name) && 
                                    <span className="mr-1 text-teal-600">+</span>
                                  }
                                  {skill.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Work Experience Preview */}
                  {changedSections.includes('workExperience') && (
                    <Card className="border-teal-200">
                      <CardHeader className="py-2 sm:py-3 px-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm flex items-center">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 mr-1 sm:mr-2" />
                          Work Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 py-0 sm:py-1 max-h-48 sm:max-h-80 overflow-y-auto">
                        <div className="space-y-3 sm:space-y-4">
                          {tailoredResume.workExperience.map((exp, index) => {
                            const originalExp = resume.workExperience.find(e => e.id === exp.id);
                            if (!originalExp) return null;
                            
                            // Check if this specific experience was changed
                            const descriptionChanged = originalExp.description !== exp.description;
                            const achievementsChanged = JSON.stringify(originalExp.achievements) !== JSON.stringify(exp.achievements);
                            
                            if (!descriptionChanged && !achievementsChanged) return null;
                            
                            return (
                              <div key={exp.id} className="border border-teal-100 rounded-md p-2 sm:p-3">
                                <h4 className="font-medium mb-1 sm:mb-2 text-xs sm:text-sm">{exp.position} at {exp.company}</h4>
                                
                                {descriptionChanged && (
                                  <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                                    <h5 className="text-xs font-medium">Description</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                                      <div className="p-1 sm:p-2 bg-gray-50 rounded border text-xs">
                                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Original</div>
                                        {originalExp.description}
                                      </div>
                                      <div className="p-1 sm:p-2 bg-teal-50 rounded border border-teal-200 text-xs">
                                        <div className="text-[10px] sm:text-xs text-teal-700 mb-1">Tailored</div>
                                        {exp.description}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {achievementsChanged && (
                                  <div className="space-y-1 sm:space-y-2">
                                    <h5 className="text-xs font-medium">Achievements</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                                      <div className="p-1 sm:p-2 bg-gray-50 rounded border text-xs">
                                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Original</div>
                                        <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                                          {originalExp.achievements.map((achievement, i) => (
                                            <li key={i}>{achievement}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="p-1 sm:p-2 bg-teal-50 rounded border border-teal-200 text-xs">
                                        <div className="text-[10px] sm:text-xs text-teal-700 mb-1">Tailored</div>
                                        <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                                          {exp.achievements.map((achievement, i) => (
                                            <li key={i}>{achievement}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Projects Preview */}
                  {changedSections.includes('projects') && tailoredResume.projects && resume.projects && (
                    <Card className="border-teal-200">
                      <CardHeader className="py-2 sm:py-3 px-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm flex items-center">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 mr-1 sm:mr-2" />
                          Projects
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 py-0 sm:py-1 max-h-48 sm:max-h-80 overflow-y-auto">
                        <div className="space-y-3 sm:space-y-4">
                          {tailoredResume.projects.map((project, index) => {
                            const originalProject = resume.projects?.find(p => p.id === project.id);
                            if (!originalProject) return null;
                            
                            // Check if this specific project was changed
                            const descriptionChanged = originalProject.description !== project.description;
                            const technologiesChanged = JSON.stringify(originalProject.technologies) !== JSON.stringify(project.technologies);
                            
                            if (!descriptionChanged && !technologiesChanged) return null;
                            
                            return (
                              <div key={project.id} className="border border-teal-100 rounded-md p-2 sm:p-3">
                                <h4 className="font-medium mb-1 sm:mb-2 text-xs sm:text-sm">{project.name}</h4>
                                
                                {descriptionChanged && (
                                  <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                                    <h5 className="text-xs font-medium">Description</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                                      <div className="p-1 sm:p-2 bg-gray-50 rounded border text-xs">
                                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Original</div>
                                        {originalProject.description}
                                      </div>
                                      <div className="p-1 sm:p-2 bg-teal-50 rounded border border-teal-200 text-xs">
                                        <div className="text-[10px] sm:text-xs text-teal-700 mb-1">Tailored</div>
                                        {project.description}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {technologiesChanged && (
                                  <div className="space-y-1 sm:space-y-2">
                                    <h5 className="text-xs font-medium">Technologies</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                                      <div className="p-1 sm:p-2 bg-gray-50 rounded border text-xs">
                                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Original</div>
                                        <div className="flex flex-wrap gap-1">
                                          {originalProject.technologies.map((tech, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="p-1 sm:p-2 bg-teal-50 rounded border border-teal-200 text-xs">
                                        <div className="text-[10px] sm:text-xs text-teal-700 mb-1">Tailored</div>
                                        <div className="flex flex-wrap gap-1">
                                          {project.technologies.map((tech, i) => (
                                            <Badge 
                                              key={i} 
                                              variant="outline"
                                              className={!originalProject.technologies.includes(tech) ? 
                                                "bg-teal-100 border-teal-300 text-teal-800 text-xs" : "text-xs"}
                                            >
                                              {!originalProject.technologies.includes(tech) && 
                                                <span className="mr-1 text-teal-600">+</span>
                                              }
                                              {tech}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Template Preview Tab */}
          <TabsContent value="template-preview" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {tailoredResume && (
              <>
                <Alert className="bg-teal-50 border-teal-200">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                  <AlertTitle className="text-teal-800 text-xs sm:text-sm font-medium">Preview Your Tailored Resume</AlertTitle>
                  <AlertDescription className="text-teal-700 text-xs">
                    This is how your tailored resume will look when exported. Click "Apply Changes" to save these updates to your resume.
                  </AlertDescription>
                </Alert>
                
                <Card className="border-teal-200 overflow-hidden">
                  <CardHeader className="bg-white border-b py-2 px-4 flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-gray-800">
                      {template ? `Template: ${template.name}` : 'Resume Template Preview'}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 40}
                        className="h-7 w-7 p-0 text-gray-700"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomReset}
                        className="h-7 px-2 text-gray-700 text-xs"
                      >
                        {zoomLevel}%
                      </Button>
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 150}
                      className="h-7 w-7 p-0 text-gray-700"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-700"
                      title="Open Full View"
                      onClick={() => {
                        // Attempt to fullscreen the preview
                        const container = document.getElementById('resume-preview-container');
                        if (container) {
                          if (container.requestFullscreen) {
                            container.requestFullscreen();
                          } else if ((container as any).webkitRequestFullscreen) {
                            (container as any).webkitRequestFullscreen();
                          } else if ((container as any).msRequestFullscreen) {
                            (container as any).msRequestFullscreen();
                          }
                        }
                      }}
                    >
                      <Maximize className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 bg-gray-100 h-[600px]">
                  {!template ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <LoadingSpinner className="mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading template preview...</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      id="resume-preview-container"
                      className="w-full h-full overflow-auto flex justify-center"
                    >
                      <ResumePreview 
                        resume={tailoredResume} 
                        template={template}
                        defaultZoom={zoomLevel}
                        removeCard={true}
                      />
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="bg-gray-50 border-t p-3 flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('preview')}
                    className="text-xs"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Back to Changes
                  </Button>
                  
                  <Button 
                    onClick={handleApplyChanges}
                    className="bg-teal-600 hover:bg-teal-700 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Apply Changes
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-4 flex flex-col-reverse xs:flex-row xs:justify-between gap-2 xs:gap-0">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange?.(false)}
          className="border-teal-200 text-teal-700 hover:bg-teal-50 text-xs sm:text-sm"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Cancel
        </Button>
        
        {tailoredResume && (
          <Button 
            onClick={handleApplyChanges}
            className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm"
          >
            <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Apply Changes
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
}