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
import { useToast } from "@/hooks/use-toast";


import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  GraduationCap,
  Briefcase,
  ThumbsUp,
  Wand2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Define an Internship interface if not already in your resume types
interface Internship {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  description?: string;
  achievements: string[];
}

interface InternshipsSectionProps {
  data: Internship[];
  onChange: (data: Internship[]) => void;
}

const InternshipsSection: React.FC<InternshipsSectionProps> = ({ data = [], onChange }) => {
  const [activeInternship, setActiveInternship] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add a new internship entry
  const addInternship = () => {
    const newInternship: Internship = {
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
    
    const updatedData = [...data, newInternship];
    onChange(updatedData);
    
    // Set the new entry as active
    setActiveInternship(newInternship.id);
  };
  
  // Delete an internship entry
  const deleteInternship = (id: string) => {
    const updatedData = data.filter(internship => internship.id !== id);
    onChange(updatedData);
    
    // If the deleted entry was active, clear the active state
    if (activeInternship === id) {
      setActiveInternship(null);
    }
  };
  
  // Update a specific internship entry
  const updateInternship = (id: string, updates: Partial<Internship>) => {
    const updatedData = data.map(internship => 
      internship.id === id ? { ...internship, ...updates } : internship
    );
    onChange(updatedData);
  };
  
  // Move internship up or down in the list
  const moveInternship = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(internship => internship.id === id);
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
  
  // Add a new achievement to an internship entry
  const addAchievement = (internshipId: string) => {
    const internship = data.find(intern => intern.id === internshipId);
    if (!internship) return;
    
    const updatedAchievements = [...internship.achievements, ''];
    updateInternship(internshipId, { achievements: updatedAchievements });
  };
  
  // Update an achievement
  const updateAchievement = (internshipId: string, index: number, value: string) => {
    const internship = data.find(intern => intern.id === internshipId);
    if (!internship) return;
    
    const updatedAchievements = [...internship.achievements];
    updatedAchievements[index] = value;
    
    updateInternship(internshipId, { achievements: updatedAchievements });
  };
  
  // Delete an achievement
  const deleteAchievement = (internshipId: string, index: number) => {
    const internship = data.find(intern => intern.id === internshipId);
    if (!internship) return;
    
    const updatedAchievements = internship.achievements.filter((_, i) => i !== index);
    updateInternship(internshipId, { achievements: updatedAchievements });
  };
  
  // Enhance internship with AI
  const enhanceInternshipWithAI = async (internshipId: string) => {
    try {
      const internship = data.find(intern => intern.id === internshipId);
      if (!internship) return;
      
      setIsEnhancing(internshipId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'internship',
          internshipId,
          internship: internship,
          params: {
            // Optional parameters for customization
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance internship');
      }
      
      const result = await response.json();
      
      if (result.internship) {
        // Update the internship in the form
        updateInternship(internshipId, result.internship);
        
        toast({
          title: "Internship Enhanced",
          description: "Your internship description has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing internship:', err);
      setError(err.message || 'Failed to enhance internship. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance internship. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Internships</h3>
        <Button onClick={addInternship} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Internship
        </Button>
      </div>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No internships added</h3>
              <p className="text-sm text-muted-foreground">
                Add your internship experiences to highlight your practical training.
              </p>
              <Button onClick={addInternship}>
                <Plus className="h-4 w-4 mr-2" />
                Add Internship
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeInternship || undefined}
          onValueChange={setActiveInternship}
          className="space-y-4"
        >
          {data.map((internship, index) => (
            <AccordionItem
              key={internship.id}
              value={internship.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="text-left">
                    <h4 className="font-medium">
                      {internship.position || 'New Internship'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {internship.company || 'New Company'}
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
                          moveInternship(internship.id, 'up');
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
                          moveInternship(internship.id, 'down');
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
                      <Label htmlFor={`position-${internship.id}`}>Position</Label>
                      <Input
                        id={`position-${internship.id}`}
                        value={internship.position}
                        onChange={(e) => updateInternship(internship.id, { position: e.target.value })}
                        placeholder="Intern, Engineering Intern, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`company-${internship.id}`}>Company</Label>
                      <Input
                        id={`company-${internship.id}`}
                        value={internship.company}
                        onChange={(e) => updateInternship(internship.id, { company: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`location-${internship.id}`}>Location (optional)</Label>
                      <Input
                        id={`location-${internship.id}`}
                        value={internship.location || ''}
                        onChange={(e) => updateInternship(internship.id, { location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${internship.id}`}>Start Date</Label>
                      <Input
                        id={`startDate-${internship.id}`}
                        value={internship.startDate}
                        onChange={(e) => updateInternship(internship.id, { startDate: e.target.value })}
                        placeholder="YYYY-MM"
                      />
                      <p className="text-xs text-muted-foreground">Format: YYYY-MM (e.g., 2022-06)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`endDate-${internship.id}`}>End Date</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-${internship.id}`}
                            checked={internship.isOngoing}
                            onCheckedChange={(checked) => 
                              updateInternship(internship.id, { 
                                isOngoing: checked === true,
                                endDate: checked === true ? '' : internship.endDate
                              })
                            }
                          />
                          <Label 
                            htmlFor={`current-${internship.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Current Position
                          </Label>
                        </div>
                      </div>
                      <Input
                        id={`endDate-${internship.id}`}
                        value={internship.endDate || ''}
                        onChange={(e) => updateInternship(internship.id, { endDate: e.target.value })}
                        placeholder="YYYY-MM"
                        disabled={internship.isOngoing}
                      />
                      <p className="text-xs text-muted-foreground">
                        {internship.isOngoing ? "Currently working here" : "Format: YYYY-MM (e.g., 2022-08)"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`description-${internship.id}`}>Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => enhanceInternshipWithAI(internship.id)}
                        disabled={isEnhancing === internship.id}
                      >
                        {isEnhancing === internship.id ? (
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
                      id={`description-${internship.id}`}
                      value={internship.description || ''}
                      onChange={(e) => updateInternship(internship.id, { description: e.target.value })}
                      placeholder="Describe your role, responsibilities, and the company."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Key Achievements</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addAchievement(internship.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Achievement
                      </Button>
                    </div>
                    
                    {internship.achievements.length === 0 ? (
                      <div className="border rounded-md p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Add measurable achievements from your internship.
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => addAchievement(internship.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {internship.achievements.map((achievement, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-3 text-muted-foreground">•</span>
                            <Input
                              value={achievement}
                              onChange={(e) => updateAchievement(internship.id, i, e.target.value)}
                              placeholder="Describe a measurable achievement"
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="mt-1"
                              onClick={() => deleteAchievement(internship.id, i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Focus on your contributions and what you learned during the internship.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteInternship(internship.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Internship
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
          Pro tip: Even short internships can be valuable on your resume if you highlight the skills you gained.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InternshipsSection;