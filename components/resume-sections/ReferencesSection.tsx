//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\resume-sections\ReferencesSection.tsx

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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  Users,
  ThumbsUp,
  Wand2,
  Mail,
  Phone,
  Building
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Define a Reference interface
interface Reference {
  id: string;
  name: string;
  company: string;
  position: string;
  relationship: string;
  email: string;
  phone?: string;
  includeInResume: boolean;
}

interface ReferencesSectionProps {
  data: Reference[];
  onChange: (data: Reference[]) => void;
  generalStatement?: string;
  onStatementChange?: (statement: string) => void;
  enableStatement?: boolean;
}

const ReferencesSection: React.FC<ReferencesSectionProps> = ({ 
  data = [], 
  onChange,
  generalStatement = "References available upon request",
  onStatementChange,
  enableStatement = true
}) => {
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [useGeneralStatement, setUseGeneralStatement] = useState<boolean>(enableStatement);
  const { toast } = useToast();
  
  // Add a new reference
  const addReference = () => {
    const newReference: Reference = {
      id: crypto.randomUUID(),
      name: '',
      company: '',
      position: '',
      relationship: '',
      email: '',
      phone: '',
      includeInResume: true
    };
    
    const updatedData = [...data, newReference];
    onChange(updatedData);
    
    // Set the new entry as active
    setActiveReference(newReference.id);
  };
  
  // Delete a reference
  const deleteReference = (id: string) => {
    const updatedData = data.filter(ref => ref.id !== id);
    onChange(updatedData);
    
    // If the deleted entry was active, clear the active state
    if (activeReference === id) {
      setActiveReference(null);
    }
  };
  
  // Update a reference
  const updateReference = (id: string, updates: Partial<Reference>) => {
    const updatedData = data.map(ref => 
      ref.id === id ? { ...ref, ...updates } : ref
    );
    onChange(updatedData);
  };
  
  // Move reference up or down in the list
  const moveReference = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(ref => ref.id === id);
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
  
  // Handle general statement toggle
  const handleStatementToggle = (checked: boolean) => {
    setUseGeneralStatement(checked);
    if (!checked && data.length === 0) {
      addReference(); // Add an empty reference if no references exist
    }
  };
  
  // Enhance reference with AI
  const enhanceReferenceWithAI = async (referenceId: string) => {
    try {
      const reference = data.find(ref => ref.id === referenceId);
      if (!reference) return;
      
      setIsEnhancing(referenceId);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'reference',
          referenceId,
          reference: reference
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance reference');
      }
      
      const result = await response.json();
      
      if (result.reference) {
        // Update the reference
        updateReference(referenceId, result.reference);
        
        toast({
          title: "Reference Enhanced",
          description: "Your reference has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing reference:', err);
      setError(err.message || 'Failed to enhance reference. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance reference. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  // Enhance general statement with AI
  const enhanceStatementWithAI = async () => {
    try {
      setIsEnhancing('statement');
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'referenceStatement',
          currentStatement: generalStatement
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance statement');
      }
      
      const result = await response.json();
      
      if (result.statement && onStatementChange) {
        // Update the statement
        onStatementChange(result.statement);
        
        toast({
          title: "Statement Enhanced",
          description: "Your reference statement has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing statement:', err);
      setError(err.message || 'Failed to enhance statement. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">References</h3>
        <Button onClick={addReference} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      </div>
      
      {enableStatement && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Use General Statement</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a general statement instead of listing references
                  </p>
                </div>
                <Switch
                  checked={useGeneralStatement}
                  onCheckedChange={handleStatementToggle}
                />
              </div>
              
              {useGeneralStatement && onStatementChange && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="reference-statement">Reference Statement</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={enhanceStatementWithAI}
                      disabled={isEnhancing === 'statement'}
                    >
                      {isEnhancing === 'statement' ? (
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
                    id="reference-statement"
                    value={generalStatement}
                    onChange={(e) => onStatementChange(e.target.value)}
                    placeholder="References available upon request"
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This statement will appear instead of listing your references.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!useGeneralStatement && (
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="text-center space-y-3">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="font-medium text-lg">No references added</h3>
                  <p className="text-sm text-muted-foreground">
                    Add professional references who can vouch for your work.
                  </p>
                  <Button onClick={addReference}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reference
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={activeReference || undefined}
              onValueChange={setActiveReference}
              className="space-y-4"
            >
              {data.map((reference, index) => (
                <AccordionItem
                  key={reference.id}
                  value={reference.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                    <div className="flex flex-1 items-center justify-between pr-4">
                      <div className="text-left">
                        <h4 className="font-medium">
                          {reference.name || 'New Reference'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {reference.position && reference.company
                            ? `${reference.position} at ${reference.company}`
                            : reference.position || reference.company || 'No position or company specified'
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
                              moveReference(reference.id, 'up');
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
                              moveReference(reference.id, 'down');
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
                          <Label htmlFor={`name-${reference.id}`}>Name</Label>
                          <Input
                            id={`name-${reference.id}`}
                            value={reference.name}
                            onChange={(e) => updateReference(reference.id, { name: e.target.value })}
                            placeholder="Full Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`relationship-${reference.id}`}>Relationship</Label>
                          <Input
                            id={`relationship-${reference.id}`}
                            value={reference.relationship}
                            onChange={(e) => updateReference(reference.id, { relationship: e.target.value })}
                            placeholder="Manager, Colleague, etc."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`company-${reference.id}`}>Company</Label>
                          <Input
                            id={`company-${reference.id}`}
                            value={reference.company}
                            onChange={(e) => updateReference(reference.id, { company: e.target.value })}
                            placeholder="Company Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`position-${reference.id}`}>Position</Label>
                          <Input
                            id={`position-${reference.id}`}
                            value={reference.position}
                            onChange={(e) => updateReference(reference.id, { position: e.target.value })}
                            placeholder="Job Title"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`email-${reference.id}`}>Email</Label>
                          <Input
                            id={`email-${reference.id}`}
                            type="email"
                            value={reference.email}
                            onChange={(e) => updateReference(reference.id, { email: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`phone-${reference.id}`}>Phone (optional)</Label>
                          <Input
                            id={`phone-${reference.id}`}
                            value={reference.phone || ''}
                            onChange={(e) => updateReference(reference.id, { phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor={`include-${reference.id}`}>Include in Resume</Label>
                            <p className="text-sm text-muted-foreground">
                              Include this reference in your resume
                            </p>
                          </div>
                          <Switch
                            id={`include-${reference.id}`}
                            checked={reference.includeInResume}
                            onCheckedChange={(checked) => 
                              updateReference(reference.id, { includeInResume: checked })
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReference(reference.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Reference
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
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
          Pro tip: Always ask permission before listing someone as a reference on your resume.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReferencesSection;