// components/ResumeTailoringModal.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResumeData } from "@/types/resume";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Target, Wand2, CheckCircle2, AlertCircle, Briefcase, ArrowRight, Check, X } from "lucide-react";

interface ResumeTailoringModalProps {
  resume: ResumeData;
  onUpdateResume: (newData: ResumeData) => void;
}

export default function ResumeTailoringModal({ resume, onUpdateResume }: ResumeTailoringModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState("job-description");
  const { toast } = useToast();
  
  // Track which sections have been changed by the AI
  const [changedSections, setChangedSections] = useState<string[]>([]);

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
      
      // Track which sections were changed
      const changes = determineChanges(resume, data.tailoredResume);
      setChangedSections(changes);
      
      // Set the tailored resume data
      setTailoredResume(data.tailoredResume);
      
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
    
    // Check work experience descriptions and achievements
    if (JSON.stringify(original.workExperience) !== JSON.stringify(tailored.workExperience)) {
      changes.push('workExperience');
    }
    
    // Check skills
    if (JSON.stringify(original.skills) !== JSON.stringify(tailored.skills)) {
      changes.push('skills');
    }
    
    // Other sections can be added as needed
    if (JSON.stringify(original.education) !== JSON.stringify(tailored.education)) {
      changes.push('education');
    }
    
    if (JSON.stringify(original.projects) !== JSON.stringify(tailored.projects)) {
      changes.push('projects');
    }
    
    return changes;
  };

  // Apply the tailored resume
  const handleApplyChanges = () => {
    if (tailoredResume) {
      onUpdateResume(tailoredResume);
      setIsOpen(false);
      
      toast({
        title: "Changes Applied",
        description: "Your resume has been updated with the tailored content.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-2 items-center">
          <Target className="h-4 w-4" />
          <span>Tailor for Job</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Tailor Resume for Job Description
          </DialogTitle>
          <DialogDescription>
            Optimize your resume for ATS systems by tailoring it to match a specific job description.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="job-description" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>Job Description</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1" disabled={!tailoredResume}>
              <ArrowRight className="h-4 w-4" />
              <span>Tailored Resume</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="job-description" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enter Job Description</CardTitle>
                <CardDescription>
                  Paste the full job description to optimize your resume with matching keywords and skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[300px]"
                  disabled={isLoading}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Our AI will optimize your resume to increase your chances of passing ATS filters.
                </div>
                <Button onClick={handleTailorResume} disabled={isLoading || !jobDescription.trim()}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Tailoring...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Tailor Resume
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4 space-y-4">
            {tailoredResume && (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Resume Tailored Successfully</AlertTitle>
                  <AlertDescription className="text-green-700">
                    The following sections have been optimized for this job description:
                    <div className="flex flex-wrap gap-2 mt-2">
                      {changedSections.map((section) => (
                        <Badge key={section} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          {section === 'workExperience' ? 'Work Experience' : 
                           section === 'personalInfo' ? 'Personal Info' :
                           section.charAt(0).toUpperCase() + section.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  {/* Summary Preview */}
                  {changedSections.includes('summary') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                          Professional Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Original</h4>
                            <p className="text-sm">{resume.personalInfo?.summary || 'No summary provided'}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-md border border-green-200">
                            <h4 className="text-sm font-medium text-green-700 mb-1">Tailored</h4>
                            <p className="text-sm">{tailoredResume.personalInfo?.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Skills Preview */}
                  {changedSections.includes('skills') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                          Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Original Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {resume.skills.map((skill) => (
                                <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-md border border-green-200">
                            <h4 className="text-sm font-medium text-green-700 mb-1">Tailored Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {tailoredResume.skills.map((skill) => (
                                <Badge 
                                  key={skill.id} 
                                  variant="outline"
                                  className={!resume.skills.some(s => s.name === skill.name) ? 
                                    "bg-green-100 border-green-300 text-green-800" : ""}
                                >
                                  {!resume.skills.some(s => s.name === skill.name) && 
                                    <span className="mr-1 text-green-600">+</span>
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                          Work Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-80 overflow-y-auto">
                        <div className="space-y-4">
                          {tailoredResume.workExperience.map((exp, index) => {
                            const originalExp = resume.workExperience.find(e => e.id === exp.id);
                            if (!originalExp) return null;
                            
                            // Check if this specific experience was changed
                            const descriptionChanged = originalExp.description !== exp.description;
                            const achievementsChanged = JSON.stringify(originalExp.achievements) !== JSON.stringify(exp.achievements);
                            
                            if (!descriptionChanged && !achievementsChanged) return null;
                            
                            return (
                              <div key={exp.id} className="border rounded-md p-3">
                                <h4 className="font-medium mb-2">{exp.position} at {exp.company}</h4>
                                
                                {descriptionChanged && (
                                  <div className="space-y-2 mb-3">
                                    <h5 className="text-sm font-medium">Description</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="p-2 bg-gray-50 rounded border text-sm">
                                        <div className="text-xs text-gray-500 mb-1">Original</div>
                                        {originalExp.description}
                                      </div>
                                      <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                                        <div className="text-xs text-green-700 mb-1">Tailored</div>
                                        {exp.description}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {achievementsChanged && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium">Achievements</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="p-2 bg-gray-50 rounded border text-sm">
                                        <div className="text-xs text-gray-500 mb-1">Original</div>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {originalExp.achievements.map((achievement, i) => (
                                            <li key={i}>{achievement}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                                        <div className="text-xs text-green-700 mb-1">Tailored</div>
                                        <ul className="list-disc pl-5 space-y-1">
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
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            {tailoredResume && (
              <Button onClick={handleApplyChanges}>
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}