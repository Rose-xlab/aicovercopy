//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\resume-sections\ProjectsSection.tsx
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
import { Project } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  ExternalLink,
  MoveUp,
  MoveDown,
  Folder,
  ThumbsUp,
  Wand2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ProjectsSectionProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ data, onChange }) => {
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add a new project
  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
      url: '',
      startDate: '',
      endDate: '',
      achievements: []
    };
    
    const updatedData = [...data, newProject];
    onChange(updatedData);
    
    // Set the new entry as active
    setActiveProject(newProject.id);
  };
  
  // Delete a project
  const deleteProject = (id: string) => {
    const updatedData = data.filter(project => project.id !== id);
    onChange(updatedData);
    
    // If the deleted entry was active, clear the active state
    if (activeProject === id) {
      setActiveProject(null);
    }
  };
  
  // Update a specific project
  const updateProject = (id: string, updates: Partial<Project>) => {
    const updatedData = data.map(project => 
      project.id === id ? { ...project, ...updates } : project
    );
    onChange(updatedData);
  };
  
  // Move project up or down in the list
  const moveProject = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(project => project.id === id);
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
  
  // Handle technologies input
  const handleTechnologiesChange = (id: string, technologiesString: string) => {
    const technologies = technologiesString
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech !== '');
    
    updateProject(id, { technologies });
  };
  
  // Add a new achievement to a project
  const addAchievement = (projectId: string) => {
    const project = data.find(p => p.id === projectId);
    if (!project) return;
    
    const updatedAchievements = [...(project.achievements || []), ''];
    updateProject(projectId, { achievements: updatedAchievements });
  };
  
  // Update an achievement
  const updateAchievement = (projectId: string, index: number, value: string) => {
    const project = data.find(p => p.id === projectId);
    if (!project || !project.achievements) return;
    
    const updatedAchievements = [...project.achievements];
    updatedAchievements[index] = value;
    
    updateProject(projectId, { achievements: updatedAchievements });
  };
  
  // Delete an achievement
  const deleteAchievement = (projectId: string, index: number) => {
    const project = data.find(p => p.id === projectId);
    if (!project || !project.achievements) return;
    
    const updatedAchievements = project.achievements.filter((_, i) => i !== index);
    updateProject(projectId, { achievements: updatedAchievements });
  };
  
  // Enhance project description with AI
  const enhanceProjectWithAI = async (projectId: string) => {
    try {
      const project = data.find(p => p.id === projectId);
      if (!project) return;
      
      setIsEnhancing(projectId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'project',
          projectId,
          project: project,
          params: {
            // Optional parameters for customization
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance project');
      }
      
      const result = await response.json();
      
      if (result.project) {
        // Update the project in the form
        updateProject(projectId, result.project);
        
        toast({
          title: "Project Enhanced",
          description: "Your project description has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing project:', err);
      setError(err.message || 'Failed to enhance project. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Projects</h3>
        <Button onClick={addProject} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Folder className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No projects added</h3>
              <p className="text-sm text-muted-foreground">
                Add your projects to showcase your practical skills and accomplishments.
              </p>
              <Button onClick={addProject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeProject || undefined}
          onValueChange={setActiveProject}
          className="space-y-4"
        >
          {data.map((project, index) => (
            <AccordionItem
              key={project.id}
              value={project.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="text-left">
                    <h4 className="font-medium">
                      {project.name || 'New Project'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {project.technologies?.length > 0 
                        ? project.technologies.join(', ')
                        : 'No technologies specified'
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
                          moveProject(project.id, 'up');
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
                          moveProject(project.id, 'down');
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
                      <Label htmlFor={`name-${project.id}`}>Project Name</Label>
                      <Input
                        id={`name-${project.id}`}
                        value={project.name}
                        onChange={(e) => updateProject(project.id, { name: e.target.value })}
                        placeholder="Project Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`url-${project.id}`}>Project URL (optional)</Label>
                      <Input
                        id={`url-${project.id}`}
                        value={project.url || ''}
                        onChange={(e) => updateProject(project.id, { url: e.target.value })}
                        placeholder="https://example.com/project"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${project.id}`}>Start Date (optional)</Label>
                      <Input
                        id={`startDate-${project.id}`}
                        value={project.startDate || ''}
                        onChange={(e) => updateProject(project.id, { startDate: e.target.value })}
                        placeholder="YYYY-MM"
                      />
                      <p className="text-xs text-muted-foreground">Format: YYYY-MM (e.g., 2022-03)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`endDate-${project.id}`}>End Date (optional)</Label>
                      <Input
                        id={`endDate-${project.id}`}
                        value={project.endDate || ''}
                        onChange={(e) => updateProject(project.id, { endDate: e.target.value })}
                        placeholder="YYYY-MM or 'Ongoing'"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: YYYY-MM (or leave blank if ongoing)
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`description-${project.id}`}>Project Description</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => enhanceProjectWithAI(project.id)}
                        disabled={isEnhancing === project.id}
                      >
                        {isEnhancing === project.id ? (
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
                      id={`description-${project.id}`}
                      value={project.description}
                      onChange={(e) => updateProject(project.id, { description: e.target.value })}
                      placeholder="Describe your project, its purpose, and your role in it."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`technologies-${project.id}`}>Technologies Used</Label>
                    <Input
                      id={`technologies-${project.id}`}
                      value={(project.technologies || []).join(', ')}
                      onChange={(e) => handleTechnologiesChange(project.id, e.target.value)}
                      placeholder="React, Node.js, MongoDB, etc. (comma-separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter technologies separated by commas
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Project Achievements (optional)</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addAchievement(project.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Achievement
                      </Button>
                    </div>
                    
                    {(!project.achievements || project.achievements.length === 0) ? (
                      <div className="border rounded-md p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Add specific achievements or measurable outcomes from this project.
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => addAchievement(project.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {project.achievements.map((achievement, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-3 text-muted-foreground">•</span>
                            <Input
                              value={achievement}
                              onChange={(e) => updateAchievement(project.id, i, e.target.value)}
                              placeholder="Describe a project achievement"
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="mt-1"
                              onClick={() => deleteAchievement(project.id, i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
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
          Pro tip: Include projects that showcase skills relevant to your target position, and highlight measurable results.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ProjectsSection;