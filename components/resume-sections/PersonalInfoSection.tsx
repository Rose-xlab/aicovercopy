//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\resume-sections\PersonalInfoSection.tsx
"use client";

import { useState, useEffect } from 'react'; // Import useEffect
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
  isHighlighted = false,
}) => {
  // *** FIX #1: Use component-level state ***
  const [personalInfo, setPersonalInfo] = useState<PersonalInformation>(data || {
    firstName: '', lastName: '', title: '', summary: '',
    contact: { email: '', phone: '', location: '', linkedIn: '', website: '' },
    image: ''
  });

  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // *** FIX #2: Add useEffect to sync with props ***
  useEffect(() => {
    if (data) {
      setPersonalInfo(data);
    }
  }, [data]); // This hook runs whenever the 'data' prop from ResumeBuilder changes

  const handleChange = (field: keyof PersonalInformation, value: any) => {
    const updatedInfo = { ...personalInfo, [field]: value };
    setPersonalInfo(updatedInfo);
    onChange(updatedInfo);
  };

  const handleContactChange = (field: keyof PersonalInformation['contact'], value: any) => {
    const updatedInfo = {
      ...personalInfo,
      contact: {
        ...personalInfo.contact,
        [field]: value,
      },
    };
    setPersonalInfo(updatedInfo);
    onChange(updatedInfo);
  };
  
  // Enhance summary with AI
  const enhanceSummaryWithAI = async () => {
    // This function remains unchanged, but now uses the internal 'personalInfo' state
    try {
      setIsEnhancingSummary(true);
      setError(null);
      
      const response = await fetch('/api/resumes/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enhanceType: 'summary',
          personalInfo: personalInfo,
          workExperience: []
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance summary');
      }
      
      const result = await response.json();
      
      if (result.summary) {
        handleChange('summary', result.summary);
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

  const sectionClass = isHighlighted
    ? "space-y-6 p-4 rounded-md bg-green-50 border border-green-200 transition-all duration-500"
    : "space-y-6";

  // *** FIX #3: Update JSX to use internal state and new handlers ***
  return (
    <div className={sectionClass}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={personalInfo.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="John"
            required
            className={isHighlighted ? "border-green-500" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={personalInfo.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Doe"
            required
            className={isHighlighted ? "border-green-500" : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Profile Image</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                handleChange('image', reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        {personalInfo.image && (
          <img
            src={personalInfo.image}
            alt="Profile"
            className="mt-2 h-24 w-24 rounded-full object-cover border"
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">Professional Title</Label>
        <Input
          id="title"
          value={personalInfo.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Software Engineer, Product Manager, etc."
          className={isHighlighted ? "border-green-500" : ""}
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
                value={personalInfo.contact?.email || ''}
                onChange={(e) => handleContactChange('email', e.target.value)}
                placeholder="john.doe@example.com"
                required
                className={isHighlighted ? "border-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={personalInfo.contact?.phone || ''}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={isHighlighted ? "border-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={personalInfo.contact?.location || ''}
                onChange={(e) => handleContactChange('location', e.target.value)}
                placeholder="New York, NY"
                className={isHighlighted ? "border-green-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
              <Input
                id="linkedIn"
                value={personalInfo.contact?.linkedIn || ''}
                onChange={(e) => handleContactChange('linkedIn', e.target.value)}
                placeholder="linkedin.com/in/johndoe"
                className={isHighlighted ? "border-green-500" : ""}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                value={personalInfo.contact?.website || ''}
                onChange={(e) => handleContactChange('website', e.target.value)}
                placeholder="johndoe.com"
                className={isHighlighted ? "border-green-500" : ""}
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
              <><LoadingSpinner className="mr-2 h-3 w-3" /> Enhancing...</>
            ) : (
              <><Wand2 className="mr-2 h-3 w-3" /> Enhance with AI</>
            )}
          </Button>
        </div>
        
        <Textarea
          id="summary"
          value={personalInfo.summary || ''}
          onChange={(e) => handleChange('summary', e.target.value)}
          placeholder="A brief overview of your professional background..."
          className={`min-h-[120px] ${isHighlighted ? "border-green-500" : ""}`}
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;