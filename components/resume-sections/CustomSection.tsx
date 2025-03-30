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
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  PencilRuler,
  ThumbsUp,
  Wand2,
  Copy
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define a CustomContent interface with optional fields
interface CustomContent {
  id: string;
  title: string;
  content: string;
  city?: string; // Made optional
  startDate?: string; // Made optional
  endDate?: string; // Made optional
}

interface CustomSectionProps {
  data: CustomContent[];
  onChange: (data: CustomContent[]) => void;
}

const CustomSection: React.FC<CustomSectionProps> = ({ data = [], onChange }) => {
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add a new custom section
  const addCustomSection = () => {
    if (!newSectionTitle.trim()) {
      toast({
        title: "Section title required",
        description: "Please enter a title for your custom section",
        variant: "destructive",
      });
      return;
    }
    
    const newSection: CustomContent = {
      id: crypto.randomUUID(),
      title: newSectionTitle.trim(),
      content: '',
      city: '',
      startDate: '',
      endDate: ''
    };
    
    const updatedData = [...data, newSection];
    onChange(updatedData);
    
    // Reset input and set the new section as active
    setNewSectionTitle('');
    setActiveSection(newSection.id);
  };
  
  // Delete a custom section
  const deleteCustomSection = (id: string) => {
    const updatedData = data.filter(section => section.id !== id);
    onChange(updatedData);
    
    if (activeSection === id) {
      setActiveSection(null);
    }
  };
  
  // Update a custom section
  const updateCustomSection = (id: string, updates: Partial<CustomContent>) => {
    const updatedData = data.map(section => 
      section.id === id ? { ...section, ...updates } : section
    );
    onChange(updatedData);
  };
  
  // Move section up or down in the list
  const moveCustomSection = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(section => section.id === id);
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
  
  // Duplicate a custom section
  const duplicateCustomSection = (id: string) => {
    const sectionToDuplicate = data.find(section => section.id === id);
    if (!sectionToDuplicate) return;
    
    const duplicatedSection: CustomContent = {
      id: crypto.randomUUID(),
      title: `${sectionToDuplicate.title} (Copy)`,
      content: sectionToDuplicate.content,
      city: sectionToDuplicate.city,
      startDate: sectionToDuplicate.startDate,
      endDate: sectionToDuplicate.endDate
    };
    
    const updatedData = [...data, duplicatedSection];
    onChange(updatedData);
    
    toast({
      title: "Section Duplicated",
      description: `"${sectionToDuplicate.title}" has been duplicated.`,
    });
  };
  
  // Enhance custom section content with AI
  const enhanceCustomSectionWithAI = async (sectionId: string) => {
    try {
      const section = data.find(s => s.id === sectionId);
      if (!section) return;
      
      setIsEnhancing(sectionId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'customSection',
          sectionId,
          section: section
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance section');
      }
      
      const result = await response.json();
      
      if (result.section) {
        // Update the section
        updateCustomSection(sectionId, result.section);
        
        toast({
          title: "Section Enhanced",
          description: "Your custom section has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing custom section:', err);
      setError(err.message || 'Failed to enhance section. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Sections</h3>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="section-title">New Section Title</Label>
                <Input
                  id="section-title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Volunteering, Publications, Awards, etc."
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={addCustomSection} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
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
              <PencilRuler className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No custom sections added</h3>
              <p className="text-sm text-muted-foreground">
                Add custom sections to include additional information on your resume.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((section, index) => (
            <Card key={section.id} className={activeSection === section.id ? 'border-primary' : ''}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input 
                      value={section.title} 
                      onChange={(e) => updateCustomSection(section.id, { title: e.target.value })}
                      className="text-lg font-medium border-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Section Title"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveCustomSection(section.id, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < data.length - 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveCustomSection(section.id, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateCustomSection(section.id)}
                      title="Duplicate Section"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteCustomSection(section.id)}
                      title="Delete Section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Added City, Start Date, and End Date fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`city-${section.id}`}>City</Label>
                    <Input
                      id={`city-${section.id}`}
                      value={section.city || ''}
                      onChange={(e) => updateCustomSection(section.id, { city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`start-date-${section.id}`}>Start Date</Label>
                    <Input
                      id={`start-date-${section.id}`}
                      type="date"
                      value={section.startDate || ''}
                      onChange={(e) => updateCustomSection(section.id, { startDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`end-date-${section.id}`}>End Date</Label>
                    <Input
                      id={`end-date-${section.id}`}
                      type="date"
                      value={section.endDate || ''}
                      onChange={(e) => updateCustomSection(section.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`content-${section.id}`}>Content</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => enhanceCustomSectionWithAI(section.id)}
                      disabled={isEnhancing === section.id}
                    >
                      {isEnhancing === section.id ? (
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
                    id={`content-${section.id}`}
                    value={section.content}
                    onChange={(e) => updateCustomSection(section.id, { content: e.target.value })}
                    placeholder="Enter content for this section. You can include bullet points by starting lines with '- ' or '* '."
                    className="min-h-[150px]"
                    onClick={() => setActiveSection(section.id)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Format text with line breaks. You can use markdown-style formatting like *italic* or **bold**.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
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
          Pro tip: Custom sections are perfect for highlighting volunteer work, publications, patents, awards, or any other information that doesn't fit in standard resume sections.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CustomSection;