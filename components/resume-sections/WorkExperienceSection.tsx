"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkExperience } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Wand2, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Copy,
  ArrowUpDown,
  ExternalLink,
  MoveUp,
  MoveDown,
  ThumbsUp,
  Briefcase 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface WorkExperienceSectionProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

const WorkExperienceSection: React.FC<WorkExperienceSectionProps> = ({ data, onChange }) => {
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [isGeneratingAchievements, setIsGeneratingAchievements] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add a new work experience entry
  const addExperience = () => {
    const newExperience: WorkExperience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      description: '',
      achievements: []
    };
    
    const updatedData = [...data, newExperience];
    onChange(updatedData);
    
    // Set the new entry as active
    setActiveExperience(newExperience.id);
  };
  
  // Delete a work experience entry
  const deleteExperience = (id: string) => {
    const updatedData = data.filter(exp => exp.id !== id);
    onChange(updatedData);
    
    // If the deleted entry was active, clear the active state
    if (activeExperience === id) {
      setActiveExperience(null);
    }
  };
  
  // Update a specific work experience
  const updateExperience = (id: string, updates: Partial<WorkExperience>) => {
    const updatedData = data.map(exp => 
      exp.id === id ? { ...exp, ...updates } : exp
    );
    onChange(updatedData);
  };
  
  // Move experience up or down in the list
  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(exp => exp.id === id);
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
  
  // Add a new achievement to a work experience
  const addAchievement = (experienceId: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (!experience) return;
    
    const updatedAchievements = [...experience.achievements, ''];
    updateExperience(experienceId, { achievements: updatedAchievements });
  };
  
  // Update an achievement
  const updateAchievement = (experienceId: string, index: number, value: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (!experience) return;
    
    const updatedAchievements = [...experience.achievements];
    updatedAchievements[index] = value;
    
    updateExperience(experienceId, { achievements: updatedAchievements });
  };
  
  // Delete an achievement
  const deleteAchievement = (experienceId: string, index: number) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (!experience) return;
    
    const updatedAchievements = experience.achievements.filter((_, i) => i !== index);
    updateExperience(experienceId, { achievements: updatedAchievements });
  };
  
  // Enhance work experience with AI
  const enhanceExperienceWithAI = async (experienceId: string) => {
    try {
      const experience = data.find(exp => exp.id === experienceId);
      if (!experience) return;
      
      setIsEnhancing(experienceId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'experience',
          experienceId,
          workExperience: experience,
          params: {
            // Optional parameters for customization
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance experience');
      }
      
      const result = await response.json();
      
      if (result.experience) {
        // Update the experience in the form
        updateExperience(experienceId, result.experience);
        
        toast({
          title: "Experience Enhanced",
          description: "Your work experience has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing experience:', err);
      setError(err.message || 'Failed to enhance experience. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance experience. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  // Generate achievements with AI
  const generateAchievementsWithAI = async (experienceId: string) => {
    try {
      const experience = data.find(exp => exp.id === experienceId);
      if (!experience) return;
      
      setIsGeneratingAchievements(experienceId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'achievements',
          experienceId,
          workExperience: experience
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate achievements');
      }
      
      const result = await response.json();
      
      if (result.achievements && Array.isArray(result.achievements)) {
        // Update the achievements in the form
        const currentAchievements = experience.achievements || [];
        const newAchievements = [...currentAchievements, ...result.achievements];
        
        updateExperience(experienceId, { achievements: newAchievements });
        
        toast({
          title: "Achievements Generated",
          description: `${result.achievements.length} achievements have been generated.`,
        });
      }
    } catch (err: any) {
      console.error('Error generating achievements:', err);
      setError(err.message || 'Failed to generate achievements. Please try again.');
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAchievements(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Button onClick={addExperience} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No work experience added</h3>
              <p className="text-sm text-muted-foreground">
                Add your work experience to increase your resume impact.
              </p>
              <Button onClick={addExperience}>
                <Plus className="h-4 w-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeExperience || undefined}
          onValueChange={setActiveExperience}
          className="space-y-4"
        >
          {data.map((experience, index) => (
            <AccordionItem
              key={experience.id}
              value={experience.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="text-left">
                    <h4 className="font-medium">
                      {experience.position || 'New Position'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {experience.company 
                        ? `${experience.company}${experience.location ? ` • ${experience.location}` : ''}`
                        : 'New Company'
                      }
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
                          moveExperience(experience.id, 'up');
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
                          moveExperience(experience.id, 'down');
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
                      <Label htmlFor={`position-${experience.id}`}>Position</Label>
                      <Input
                        id={`position-${experience.id}`}
                        value={experience.position}
                        onChange={(e) => updateExperience(experience.id, { position: e.target.value })}
                        placeholder="Software Engineer, Project Manager, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`company-${experience.id}`}>Company</Label>
                      <Input
                        id={`company-${experience.id}`}
                        value={experience.company}
                        onChange={(e) => updateExperience(experience.id, { company: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`location-${experience.id}`}>Location (optional)</Label>
                      <Input
                        id={`location-${experience.id}`}
                        value={experience.location || ''}
                        onChange={(e) => updateExperience(experience.id, { location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${experience.id}`}>Start Date</Label>
                      <Input
                        id={`startDate-${experience.id}`}
                        value={experience.startDate}
                        onChange={(e) => updateExperience(experience.id, { startDate: e.target.value })}
                        placeholder="YYYY-MM"
                      />
                      <p className="text-xs text-muted-foreground">Format: YYYY-MM (e.g., 2020-06)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`endDate-${experience.id}`}>End Date</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-${experience.id}`}
                            checked={experience.isOngoing}
                            onCheckedChange={(checked) => 
                              updateExperience(experience.id, { 
                                isOngoing: checked === true,
                                endDate: checked === true ? '' : experience.endDate
                              })
                            }
                          />
                          <Label 
                            htmlFor={`current-${experience.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Current Position
                          </Label>
                        </div>
                      </div>
                      <Input
                        id={`endDate-${experience.id}`}
                        value={experience.endDate || ''}
                        onChange={(e) => updateExperience(experience.id, { endDate: e.target.value })}
                        placeholder="YYYY-MM"
                        disabled={experience.isOngoing}
                      />
                      <p className="text-xs text-muted-foreground">
                        {experience.isOngoing ? "Currently working here" : "Format: YYYY-MM (e.g., 2023-03)"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`description-${experience.id}`}>Job Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => enhanceExperienceWithAI(experience.id)}
                        disabled={isEnhancing === experience.id}
                      >
                        {isEnhancing === experience.id ? (
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
                      id={`description-${experience.id}`}
                      value={experience.description || ''}
                      onChange={(e) => updateExperience(experience.id, { description: e.target.value })}
                      placeholder="Describe your role, responsibilities, and the company."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Key Achievements</Label>
                      <div className="space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => generateAchievementsWithAI(experience.id)}
                          disabled={isGeneratingAchievements === experience.id}
                        >
                          {isGeneratingAchievements === experience.id ? (
                            <>
                              <LoadingSpinner className="mr-2 h-3 w-3" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-3 w-3" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8"
                          onClick={() => addAchievement(experience.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    </div>
                    
                    {(experience.achievements || []).length === 0 ? (
                      <div className="border rounded-md p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Add quantifiable achievements to make your experience stand out.
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => addAchievement(experience.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(experience.achievements || []).map((achievement, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-3 text-muted-foreground">•</span>
                            <Input
                              value={achievement}
                              onChange={(e) => updateAchievement(experience.id, i, e.target.value)}
                              placeholder="Describe a measurable achievement"
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="mt-1"
                              onClick={() => deleteAchievement(experience.id, i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Start with action verbs and include measurable results.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteExperience(experience.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Experience
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
          Pro tip: Focus on achievements and results rather than just listing responsibilities.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WorkExperienceSection;