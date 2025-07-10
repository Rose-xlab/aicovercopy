"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skill } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Plus,
  Trash2,
  Wand2,
  Filter,
  ThumbsUp,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SkillsSectionProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
  displayStyle?: 'stars' | 'bar';
}



const SkillsSection: React.FC<SkillsSectionProps> = ({ data, onChange, displayStyle = 'stars' }) => {
  const [isGeneratingSkills, setIsGeneratingSkills] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState<string>("");
  const [newSkillLevel, setNewSkillLevel] = useState<string>("Intermediate");
  const [newSkillCategory, setNewSkillCategory] = useState<string>("Technical");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { toast } = useToast();
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editedSkillName, setEditedSkillName] = useState<string>("");
  const [editedSkillLevel, setEditedSkillLevel] =
    useState<string>("Intermediate");
  // Add a new skill
  const addSkill = () => {
    if (!newSkillName.trim()) {
      toast({
        title: "Skill name required",
        description: "Please enter a skill name",
        variant: "destructive",
      });
      return;
    }

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      level: newSkillLevel as any,
      category: newSkillCategory,
    };

    const updatedData = [...data, newSkill];
    onChange(updatedData);

    // Reset input fields
    setNewSkillName("");
  };

  // Delete a skill
  const deleteSkill = (id: string) => {
    const updatedData = data.filter((skill) => skill.id !== id);
    onChange(updatedData);
  };

  // Update a skill
  const updateSkill = (id: string, updates: Partial<Skill>) => {
    const updatedData = data.map((skill) =>
      skill.id === id ? { ...skill, ...updates } : skill
    );
    onChange(updatedData);
  };

  // Get unique categories from skills
  const getCategories = (): string[] => {
    const categories = new Set<string>();
    data.forEach((skill) => {
      if (skill.category) {
        categories.add(skill.category);
      }
    });
    return Array.from(categories);
  };

  // Filter skills by category
  const filteredSkills =
    activeCategory === "all"
      ? data
      : data.filter((skill) => skill.category === activeCategory);

  // Generate skills with AI
  const generateSkillsWithAI = async () => {
    try {
      setIsGeneratingSkills(true);
      setError(null);

      // Call the API to generate skills
      const response = await fetch("/api/resumes/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enhanceType: "skills",
          params: {
            targetPosition: "", // Optional target position
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate skills");
      }

      const result = await response.json();

      if (result.skills && Array.isArray(result.skills)) {
        // Merge new skills with existing ones, avoiding duplicates
        const existingSkillNames = new Set(
          data.map((skill) => skill.name.toLowerCase())
        );
        const newSkills = result.skills.filter(
          (skill: Skill) => !existingSkillNames.has(skill.name.toLowerCase())
        );

        const updatedData = [...data, ...newSkills];
        onChange(updatedData);

        toast({
          title: "Skills Generated",
          description: `${newSkills.length} new skills have been added to your resume.`,
        });
      }
    } catch (err: any) {
      console.error("Error generating skills:", err);
      setError(err.message || "Failed to generate skills. Please try again.");
      toast({
        title: "Generation Failed",
        description:
          err.message || "Failed to generate skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSkills(false);
    }
  };

const renderStars = (level: string) => {
  const levelMap: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Expert: 4,
  };
  const stars = levelMap[level] || 0;
  return (
    <div className="flex text-yellow-500 text-sm">
      {[1, 2, 3, 4].map((i) => (
        <span key={i}>{i <= stars ? '★' : '☆'}</span>
      ))}
    </div>
  );
};
  
const getSkillProgress = (level: string): number => {
  switch (level) {
    case "Beginner":
      return 25;
    case "Intermediate":
      return 50;
    case "Advanced":
      return 75;
    case "Expert":
      return 100;
    default:
      return 0;
  }
};


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Skills</h3>
        <Button
          variant="outline"
          onClick={generateSkillsWithAI}
          disabled={isGeneratingSkills}
        >
          {isGeneratingSkills ? (
            <>
              <LoadingSpinner className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Suggest Skills with AI
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="JavaScript, Project Management, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-level">Level</Label>
                <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                  <SelectTrigger id="skill-level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-category">Category</Label>
                <Select
                  value={newSkillCategory}
                  onValueChange={setNewSkillCategory}
                >
                  <SelectTrigger id="skill-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full" onClick={addSkill}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Tag className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No skills added</h3>
              <p className="text-sm text-muted-foreground">
                Add your skills to highlight your expertise and increase your
                resume's impact.
              </p>
              <Button
                variant="outline"
                onClick={generateSkillsWithAI}
                disabled={isGeneratingSkills}
              >
                {isGeneratingSkills ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Suggest Skills with AI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList className="overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {getCategories().map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Filter className="h-4 w-4 mr-1" />
                  <span>{filteredSkills.length} skills</span>
                </div>
              </div>
            </Tabs>
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredSkills.map((skill) => {
              const isEditing = editingSkillId === skill.id;

              return (
                <Badge
                  key={skill.id}
                  variant="outline"
                  className="py-2 px-3 flex items-center gap-2 bg-background"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedSkillName}
                        onChange={(e) => setEditedSkillName(e.target.value)}
                        className="h-7"
                      />
                      <Select
                        value={editedSkillLevel}
                        onValueChange={setEditedSkillLevel}
                      >
                        <SelectTrigger className="h-7 w-[120px]">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600"
                        onClick={() => {
                          updateSkill(skill.id, {
                            name: editedSkillName,
                            level: editedSkillLevel as any,
                          });
                          setEditingSkillId(null);
                        }}
                      >
                        ✅
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">


                      <span className="font-medium">{skill.name}</span>
                      {skill.level && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({skill.level})
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-muted ml-1"
                        onClick={() => {
                          setEditingSkillId(skill.id);
                          setEditedSkillName(skill.name);
                          setEditedSkillLevel(skill.level || "Intermediate");
                        }}
                      >
                        ✏️
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-muted ml-1"
                    onClick={() => deleteSkill(skill.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
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
          Pro tip: Group your skills by category and include proficiency levels
          for better organization.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SkillsSection;
