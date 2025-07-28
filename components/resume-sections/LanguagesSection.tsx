//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\resume-sections\LanguagesSection.tsx

"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Language } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  Globe,
  ThumbsUp
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface LanguagesSectionProps {
  data: Language[];
  onChange: (data: Language[]) => void;
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ data, onChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [newLanguageName, setNewLanguageName] = useState<string>('');
  const [newLanguageProficiency, setNewLanguageProficiency] = useState<string>('Fluent');
  const { toast } = useToast();
  
  // Add a new language
  const addLanguage = () => {
    if (!newLanguageName.trim()) {
      toast({
        title: "Language name required",
        description: "Please enter a language name",
        variant: "destructive",
      });
      return;
    }
    
    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name: newLanguageName.trim(),
      proficiency: newLanguageProficiency as 'Basic' | 'Conversational' | 'Fluent' | 'Native'
    };
    
    const updatedData = [...data, newLanguage];
    onChange(updatedData);
    
    // Reset input fields
    setNewLanguageName('');
  };
  
  // Delete a language
  const deleteLanguage = (id: string) => {
    const updatedData = data.filter(lang => lang.id !== id);
    onChange(updatedData);
  };
  
  // Move language up or down in the list
  const moveLanguage = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(lang => lang.id === id);
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
  
  // Get color for proficiency badge
  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'Native':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Fluent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Conversational':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Basic':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Languages</h3>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="language-name">Language Name</Label>
                <Input
                  id="language-name"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  placeholder="English, Spanish, Mandarin, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language-proficiency">Proficiency</Label>
                <Select value={newLanguageProficiency} onValueChange={setNewLanguageProficiency}>
                  <SelectTrigger id="language-proficiency">
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Native">Native</SelectItem>
                    <SelectItem value="Fluent">Fluent</SelectItem>
                    <SelectItem value="Conversational">Conversational</SelectItem>
                    <SelectItem value="Basic">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={addLanguage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No languages added</h3>
              <p className="text-sm text-muted-foreground">
                Add languages to demonstrate your communication skills and international capabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((language, index) => (
            <Card key={language.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{language.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getProficiencyColor(language.proficiency)}`}
                    >
                      {language.proficiency}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveLanguage(language.id, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < data.length - 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveLanguage(language.id, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteLanguage(language.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
          Pro tip: Be honest about your proficiency levels and list your strongest languages first.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LanguagesSection;