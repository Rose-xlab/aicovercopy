//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\resume-sections\EducationSection.tsx
"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Education } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  GraduationCap,
  ThumbsUp,
  Wand2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface EducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ data, onChange }) => {
  const [activeEducation, setActiveEducation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add a new education entry
  const addEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      description: '',
      achievements: []
    };
    
    const updatedData = [...data, newEducation];
    onChange(updatedData);
    
    // Set the new entry as active
    setActiveEducation(newEducation.id);
  };
  
  // Delete an education entry
  const deleteEducation = (id: string) => {
    const updatedData = data.filter(edu => edu.id !== id);
    onChange(updatedData);
    
    // If the deleted entry was active, clear the active state
    if (activeEducation === id) {
      setActiveEducation(null);
    }
  };
  
  // Update a specific education entry
  const updateEducation = (id: string, updates: Partial<Education>) => {
    const updatedData = data.map(edu => 
      edu.id === id ? { ...edu, ...updates } : edu
    );
    onChange(updatedData);
  };
  
  // Move education up or down in the list
  const moveEducation = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(edu => edu.id === id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === data.length - 1)) {
      return; // Already at the top/bottom
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedData = [...data];
    
    // Swap positions
    [updatedData[index], updatedData[newIndex]] = [updatedData[newIndex], updatedData[index]];
    
    onChange(updatedData);
  };
  
  // Add a new achievement to an education entry
  const addAchievement = (educationId: string) => {
    const education = data.find(edu => edu.id === educationId);
    if (!education) return;
    
    const updatedAchievements = [...(education.achievements || []), ''];
    updateEducation(educationId, { achievements: updatedAchievements });
  };
  
  // Update an achievement
  const updateAchievement = (educationId: string, index: number, value: string) => {
    const education = data.find(edu => edu.id === educationId);
    if (!education || !education.achievements) return;
    
    const updatedAchievements = [...education.achievements];
    updatedAchievements[index] = value;
    
    updateEducation(educationId, { achievements: updatedAchievements });
  };
  
  // Delete an achievement
  const deleteAchievement = (educationId: string, index: number) => {
    const education = data.find(edu => edu.id === educationId);
    if (!education || !education.achievements) return;
    
    const updatedAchievements = education.achievements.filter((_, i) => i !== index);
    updateEducation(educationId, { achievements: updatedAchievements });
  };
  
  // Enhance education description with AI
  const enhanceEducationWithAI = async (educationId: string) => {
    try {
      const education = data.find(edu => edu.id === educationId);
      if (!education) return;
      
      setIsEnhancing(educationId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'education',
          educationId,
          education: education,
          params: {
            // Optional parameters for customization
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance education');
      }
      
      const result = await response.json();
      
      if (result.education) {
        // Update the education description in the form
        updateEducation(educationId, result.education);
        
        toast({
          title: "Education Enhanced",
          description: "Your education description has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing education:', err);
      setError(err.message || 'Failed to enhance education. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance education. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Education</h3>
        <Button onClick={addEducation} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No education added</h3>
              <p className="text-sm text-muted-foreground">
                Add your education history to strengthen your resume.
              </p>
              <Button onClick={addEducation}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeEducation || undefined}
          onValueChange={setActiveEducation}
          className="space-y-4"
        >
          {data.map((education, index) => (
            <AccordionItem
              key={education.id}
              value={education.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="text-left">
                    <h4 className="font-medium">
                      {education.degree || 'New Degree'}
                      {education.fieldOfStudy ? ` in ${education.fieldOfStudy}` : ''}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {education.institution || 'New Institution'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveEducation(education.id, 'up');
                        }}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < data.length - 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveEducation(education.id, 'down');
                        }}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 py-3 border-t">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`degree-${education.id}`}>Degree</Label>
                      <Input
                        id={`degree-${education.id}`}
                        value={education.degree}
                        onChange={(e) => updateEducation(education.id, { degree: e.target.value })}
                        placeholder="Bachelor of Science, Master of Arts, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`fieldOfStudy-${education.id}`}>Field of Study (optional)</Label>
                      <Input
                        id={`fieldOfStudy-${education.id}`}
                        value={education.fieldOfStudy || ''}
                        onChange={(e) => updateEducation(education.id, { fieldOfStudy: e.target.value })}
                        placeholder="Computer Science, Business, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`institution-${education.id}`}>Institution</Label>
                      <Input
                        id={`institution-${education.id}`}
                        value={education.institution}
                        onChange={(e) => updateEducation(education.id, { institution: e.target.value })}
                        placeholder="University or School Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${education.id}`}>Start Date</Label>
                      <Input
                        id={`startDate-${education.id}`}
                        value={education.startDate}
                        onChange={(e) => updateEducation(education.id, { startDate: e.target.value })}
                        placeholder="YYYY-MM"
                      />
                      <p className="text-xs text-muted-foreground">Format: YYYY-MM (e.g., 2018-09)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`endDate-${education.id}`}>End Date</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-${education.id}`}
                            checked={education.isOngoing}
                            onCheckedChange={(checked) => 
                              updateEducation(education.id, { 
                                isOngoing: checked === true,
                                endDate: checked === true ? '' : education.endDate
                              })
                            }
                          />
                          <Label 
                            htmlFor={`current-${education.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Currently Studying
                          </Label>
                        </div>
                      </div>
                      <Input
                        id={`endDate-${education.id}`}
                        value={education.endDate || ''}
                        onChange={(e) => updateEducation(education.id, { endDate: e.target.value })}
                        placeholder="YYYY-MM"
                        disabled={education.isOngoing}
                      />
                      <p className="text-xs text-muted-foreground">
                        {education.isOngoing ? "Currently studying here" : "Format: YYYY-MM (e.g., 2022-05)"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`description-${education.id}`}>Description (optional)</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => enhanceEducationWithAI(education.id)}
                        disabled={isEnhancing === education.id}
                      >
                        {isEnhancing === education.id ? (
                          <>
                            <LoadingSpinner className="mr-2 h-3 w-3" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-3 w-3" />
                            Enhance with AI
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id={`description-${education.id}`}
                      value={education.description || ''}
                      onChange={(e) => updateEducation(education.id, { description: e.target.value })}
                      placeholder="Briefly describe your studies, thesis work, or special honors."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Academic Achievements (optional)</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addAchievement(education.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Achievement
                      </Button>
                    </div>
                    
                    {(!education.achievements || education.achievements.length === 0) ? (
                      <div className="border rounded-md p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Add notable academic achievements like awards, scholarships, high GPA, etc.
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => addAchievement(education.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {education.achievements.map((achievement, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-3 text-muted-foreground">•</span>
                            <Input
                              value={achievement}
                              onChange={(e) => updateAchievement(education.id, i, e.target.value)}
                              placeholder="Describe an academic achievement"
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="mt-1"
                              onClick={() => deleteAchievement(education.id, i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Include dean's list, scholarships, academic honors, or relevant coursework.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteEducation(education.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Education
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert className="bg-muted">
        <ThumbsUp className="h-4 w-4" />
        <AlertDescription>
          Pro tip: List your education in reverse chronological order, with your most recent degree first.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EducationSection;