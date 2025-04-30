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
  HeartHandshake,
  ThumbsUp,
  Wand2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Hobby } from "@/types/resume"; // Import the type from your central types file

interface InterestsSectionProps {
  data: string[] | Hobby[];
  onChange: (data: string[] | Hobby[]) => void;
  useStructured?: boolean; // Whether to use structured hobby objects or simple strings
}

// The component name remains HobbiesSection for UI consistency, but it works with the 'interests' field
const HobbiesSection: React.FC<InterestsSectionProps> = ({ 
  data = [], 
  onChange,
  useStructured = false // By default, use simple strings
}) => {
  const [newInterest, setNewInterest] = useState<string>('');
  const [newInterestDesc, setNewInterestDesc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Add a new interest
  const addInterest = () => {
    if (!newInterest.trim()) {
      toast({
        title: "Hobby name required",
        description: "Please enter a hobby name",
        variant: "destructive",
      });
      return;
    }
    
    if (useStructured) {
      const newInterestObj: Hobby = {
        id: crypto.randomUUID(),
        name: newInterest.trim(),
        description: newInterestDesc.trim() || undefined
      };
      
      // Safely cast data to Hobby[] when in structured mode
      const currentInterests = data as Hobby[];
      const updatedData = [...currentInterests, newInterestObj];
      onChange(updatedData);
    } else {
      // Safely cast data to string[] when in simple mode
      const currentInterests = data as string[];
      const updatedData = [...currentInterests, newInterest.trim()];
      onChange(updatedData);
    }
    
    // Reset input fields
    setNewInterest('');
    setNewInterestDesc('');
  };
  
  // Delete an interest
  const deleteInterest = (index: number) => {
    if (useStructured) {
      const currentInterests = data as Hobby[];
      const updatedData = currentInterests.filter((_, i) => i !== index);
      onChange(updatedData);
    } else {
      const currentInterests = data as string[];
      const updatedData = currentInterests.filter((_, i) => i !== index);
      onChange(updatedData);
    }
  };
  
  // Move interest up or down in the list
  const moveInterest = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === data.length - 1)) {
      return; // Already at the top/bottom
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (useStructured) {
      const currentInterests = [...data as Hobby[]];
      // Swap positions
      [currentInterests[index], currentInterests[newIndex]] = [currentInterests[newIndex], currentInterests[index]];
      onChange(currentInterests);
    } else {
      const currentInterests = [...data as string[]];
      // Swap positions
      [currentInterests[index], currentInterests[newIndex]] = [currentInterests[newIndex], currentInterests[index]];
      onChange(currentInterests);
    }
  };
  
  // Update an interest (for structured mode)
  const updateInterest = (index: number, updates: Partial<Hobby>) => {
    if (!useStructured) return;
    
    const currentInterests = [...data as Hobby[]];
    currentInterests[index] = { ...currentInterests[index], ...updates };
    
    onChange(currentInterests);
  };
  
  // Enhance interests with AI
  const enhanceInterestsWithAI = async () => {
    try {
      if (data.length === 0) {
        toast({
          title: "No hobbies to enhance",
          description: "Add some hobbies first before enhancing",
          variant: "destructive",
        });
        return;
      }
      
      setIsEnhancing(true);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'interests', // Using 'interests' to match DB schema
          interests: data, // Using 'interests' to match DB schema
          useStructured: useStructured
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance hobbies');
      }
      
      const result = await response.json();
      
      if (result.interests) { // Using 'interests' to match DB schema
        // Update the interests
        onChange(result.interests);
        
        toast({
          title: "Hobbies Enhanced",
          description: "Your hobbies section has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing hobbies:', err);
      setError(err.message || 'Failed to enhance hobbies. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance hobbies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Hobbies & Interests</h3>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8"
          onClick={enhanceInterestsWithAI}
          disabled={isEnhancing || data.length === 0}
        >
          {isEnhancing ? (
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
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {useStructured ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hobby-name">Hobby Name</Label>
                    <Input
                      id="hobby-name"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Reading, Photography, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hobby-description">Description (optional)</Label>
                    <Input
                      id="hobby-description"
                      value={newInterestDesc}
                      onChange={(e) => setNewInterestDesc(e.target.value)}
                      placeholder="Brief description of your hobby"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="hobby-name">Hobby or Interest</Label>
                <Input
                  id="hobby-name"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Reading, Photography, Hiking, etc."
                />
              </div>
            )}
            
            <Button onClick={addInterest}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hobby
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <HeartHandshake className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No hobbies added</h3>
              <p className="text-sm text-muted-foreground">
                Add your hobbies and interests to show more of your personality.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {useStructured ? (
            // Structured interests display
            (data as Hobby[]).map((hobby, index) => (
              <Card key={hobby.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{hobby.name}</h4>
                      {hobby.description && (
                        <p className="text-sm text-muted-foreground">{hobby.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => moveInterest(index, 'up')}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                      )}
                      {index < data.length - 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => moveInterest(index, 'down')}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteInterest(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Simple interests display as tags
            <div className="flex flex-wrap gap-2">
              {(data as string[]).map((hobby, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="py-2 px-3 flex items-center gap-2 bg-background"
                >
                  <span>{hobby}</span>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-muted"
                        onClick={() => moveInterest(index, 'up')}
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                    )}
                    {index < data.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-muted"
                        onClick={() => moveInterest(index, 'down')}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full hover:bg-red-50 hover:text-red-500"
                      onClick={() => deleteInterest(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Badge>
              ))}
            </div>
          )}
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
          Pro tip: Include hobbies that demonstrate valuable skills or showcase your personality.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default HobbiesSection;