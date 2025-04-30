"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonalInformation } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Wand2, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PersonalInfoSectionProps {
  data: PersonalInformation;
  onChange: (data: PersonalInformation) => void;
  isHighlighted?: boolean;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ 
  data, 
  onChange,
  isHighlighted = false
}) => {
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize default data if data is undefined
  const safeData: PersonalInformation = data || {
    firstName: '',
    lastName: '',
    title: '',
    summary: '',
    contact: {
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      website: ''
    }
  };
  
  // Update a single field
  const updateField = <K extends keyof PersonalInformation>(
    field: K,
    value: PersonalInformation[K]
  ) => {
    onChange({
      ...safeData,
      [field]: value
    });
  };
  
  // Update a contact field
  const updateContactField = <K extends keyof PersonalInformation['contact']>(
    field: K,
    value: PersonalInformation['contact'][K]
  ) => {
    onChange({
      ...safeData,
      contact: {
        ...safeData.contact,
        [field]: value
      }
    });
  };
  
  // Enhance summary with AI
  const enhanceSummaryWithAI = async () => {
    try {
      setIsEnhancingSummary(true);
      setError(null);
      
      // Construct the API request
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanceType: 'summary',
          personalInfo: safeData,
          workExperience: [] // In a real implementation, we would include work experience data
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance summary');
      }
      
      const result = await response.json();
      
      if (result.summary) {
        // Update the summary in the form
        updateField('summary', result.summary);
        
        toast({
          title: "Summary Enhanced",
          description: "Your professional summary has been enhanced with AI.",
        });
      }
    } catch (err: any) {
      console.error('Error enhancing summary:', err);
      setError(err.message || 'Failed to enhance summary. Please try again.');
      toast({
        title: "Enhancement Failed",
        description: err.message || "Failed to enhance summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancingSummary(false);
    }
  };
  
  // Determine the CSS class for the section based on highlight status
  const sectionClass = isHighlighted 
    ? "space-y-6 p-4 rounded-md bg-green-50 border border-green-200 transition-all duration-500" 
    : "space-y-6";
    
  return (
    <div className={sectionClass}>
      {isHighlighted && (
        <Alert className="bg-green-100 border-green-200 text-green-800">
          <ThumbsUp className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            This section was populated from your imported resume.
          </AlertDescription>
        </Alert>
      )}
    
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={safeData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="John"
            required
            className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={safeData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Doe"
            required
            className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">Professional Title</Label>
        <Input
          id="title"
          value={safeData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Software Engineer, Product Manager, etc."
          className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
        />
      </div>
      
      <Card className={isHighlighted ? "border-green-200 bg-green-50/50" : ""}>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Contact Information</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={safeData.contact.email}
                onChange={(e) => updateContactField('email', e.target.value)}
                placeholder="john.doe@example.com"
                required
                className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={safeData.contact.phone || ''}
                onChange={(e) => updateContactField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={safeData.contact.location || ''}
                onChange={(e) => updateContactField('location', e.target.value)}
                placeholder="New York, NY"
                className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
              <Input
                id="linkedIn"
                value={safeData.contact.linkedIn || ''}
                onChange={(e) => updateContactField('linkedIn', e.target.value)}
                placeholder="linkedin.com/in/johndoe"
                className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                value={safeData.contact.website || ''}
                onChange={(e) => updateContactField('website', e.target.value)}
                placeholder="johndoe.com"
                className={isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="summary">Professional Summary</Label>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 text-xs"
            onClick={enhanceSummaryWithAI}
            disabled={isEnhancingSummary}
          >
            {isEnhancingSummary ? (
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
          id="summary"
          value={safeData.summary || ''}
          onChange={(e) => updateField('summary', e.target.value)}
          placeholder="A brief overview of your professional background, skills, and career goals."
          className={`min-h-[120px] ${isHighlighted ? "border-green-500 focus-visible:ring-green-500" : ""}`}
        />
        
        <p className="text-sm text-muted-foreground mt-1">
          Aim for 3-5 sentences that highlight your most relevant experience and skills.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert className="bg-muted">
        <ThumbsUp className="h-4 w-4" />
        <AlertDescription>
          A complete personal information section significantly improves your resume effectiveness.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PersonalInfoSection;