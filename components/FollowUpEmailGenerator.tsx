"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FollowUpEmailForm } from './FollowUpEmailForm';
import { FollowUpEmailPreview } from './FollowUpEmailPreview';
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Copy, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  MailCheck,
  Calendar,
  RefreshCw,
  FileText,
  X 
} from 'lucide-react';
import { 
  FollowUpEmailFormData, 
  FollowUpEmailGenerationResult,
  FollowUpStyle,
  FollowUpTone 
} from '@/types/follow-up';

interface FollowUpEmailGeneratorProps {
  // Initial data if coming from a cover letter
  initialJobTitle?: string;
  initialCompanyName?: string;
  initialCoverLetterId?: string;
  initialCoverLetterContent?: string;
  candidateName?: string; // User's name
  candidateEmail?: string; // User's email
  candidatePhone?: string; // User's phone
  
  // Optional callback when email is generated/saved
  onEmailGenerated?: (emailData: FollowUpEmailGenerationResult) => void;
  
  // Styling options
  variant?: 'default' | 'modal' | 'inline';
  triggerText?: string;
}

export function FollowUpEmailGenerator({
  initialJobTitle = '',
  initialCompanyName = '',
  initialCoverLetterId = '',
  initialCoverLetterContent = '',
  candidateName = '',
  candidateEmail = '',
  candidatePhone = '',
  onEmailGenerated,
  variant = 'default',
  triggerText = 'Generate Follow-Up Email'
}: FollowUpEmailGeneratorProps) {
  // State for dialog open/close (for modal variant)
  const [isOpen, setIsOpen] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<FollowUpEmailFormData>({
    jobTitle: initialJobTitle,
    companyName: initialCompanyName,
    applicationDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 2 weeks ago
    followUpStyle: 'gentle' as FollowUpStyle,
    relatedCoverLetterId: initialCoverLetterId,
  });
  
  // Generation state
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<FollowUpEmailGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [editedEmail, setEditedEmail] = useState<Partial<FollowUpEmailGenerationResult>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();
  
  // Update form data
  const handleFormChange = (updatedData: Partial<FollowUpEmailFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updatedData
    }));
  };
  
  // Generate follow-up email
  const handleGenerateEmail = async () => {
    try {
      setGeneratingEmail(true);
      setError(null);
      
      // Validate form data
      if (!formData.jobTitle || !formData.companyName) {
        throw new Error('Job title and company name are required');
      }
      
      // Prepare the request payload
      const payload = {
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        contactName: formData.contactName,
        applicationDate: formData.applicationDate,
        candidateName: candidateName || 'Your Name',
        candidateEmail: candidateEmail || 'your.email@example.com',
        candidatePhone: candidatePhone,
        followUpStyle: formData.followUpStyle,
        tone: formData.tone,
        additionalInfo: formData.additionalInfo,
        intentToCall: formData.intentToCall,
        originalCoverLetterContent: initialCoverLetterContent,
        // Optional resume highlights could be added here
        coverLetterId: formData.relatedCoverLetterId,
      };
      
      // Call the API
      const response = await fetch('/api/follow-up/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate follow-up email');
      }
      
      const data = await response.json();
      setGeneratedEmail(data);
      
      // Reset edited email state
      setEditedEmail({});
      setIsEditing(false);
      
      // Switch to preview tab
      setActiveTab('preview');
      
      // Notify parent component if callback provided
      if (onEmailGenerated) {
        onEmailGenerated(data);
      }
      
      toast({
        title: "Email Generated Successfully",
        description: "Your follow-up email has been created. You can now review and edit it.",
      });
    } catch (err: any) {
      console.error('Error generating follow-up email:', err);
      setError(err.message || 'Failed to generate follow-up email. Please try again.');
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate follow-up email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingEmail(false);
    }
  };
  
  // Handle editing email content
  const handleEditChange = (field: keyof FollowUpEmailGenerationResult, value: string) => {
    setEditedEmail(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Get the current email content (generated or edited)
  const getCurrentEmail = (): FollowUpEmailGenerationResult => {
    if (!generatedEmail) {
      return {
        subject: '',
        greeting: '',
        body: '',
        signature: '',
        suggestions: []
      };
    }
    
    return {
      subject: editedEmail.subject ?? generatedEmail.subject,
      greeting: editedEmail.greeting ?? generatedEmail.greeting,
      body: editedEmail.body ?? generatedEmail.body,
      signature: editedEmail.signature ?? generatedEmail.signature,
      suggestions: generatedEmail.suggestions
    };
  };
  
  // Copy email to clipboard
  const handleCopyEmail = async () => {
    try {
      const currentEmail = getCurrentEmail();
      const emailText = `${currentEmail.subject}\n\n${currentEmail.greeting}\n\n${currentEmail.body}\n\n${currentEmail.signature}`;
      
      await navigator.clipboard.writeText(emailText);
      
      toast({
        title: "Copied to Clipboard",
        description: "Your follow-up email has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try selecting and copying the text manually.",
        variant: "destructive",
      });
    }
  };
  
  // Download email as text file
  const handleDownloadEmail = () => {
    try {
      const currentEmail = getCurrentEmail();
      const emailText = `${currentEmail.subject}\n\n${currentEmail.greeting}\n\n${currentEmail.body}\n\n${currentEmail.signature}`;
      
      const blob = new Blob([emailText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Follow-Up-${formData.companyName}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Email Downloaded",
        description: "Your follow-up email has been downloaded as a text file.",
      });
    } catch (err) {
      console.error('Error downloading email:', err);
      toast({
        title: "Download Failed",
        description: "Failed to download the email. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Regenerate the email
  const handleRegenerateEmail = () => {
    handleGenerateEmail();
  };
  
  // Content for the form tab
  const formContent = (
    <div className="space-y-6">
      <FollowUpEmailForm 
        formData={formData} 
        onChange={handleFormChange} 
        onSubmit={handleGenerateEmail}
        isSubmitting={generatingEmail}
      />
    </div>
  );
  
  // Content for the preview tab
  const previewContent = (
    <div className="space-y-6">
      {generatedEmail ? (
        <FollowUpEmailPreview 
          email={getCurrentEmail()}
          isEditing={isEditing}
          onEdit={handleEditChange}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onSave={() => setIsEditing(false)}
        />
      ) : (
        <div className="text-center py-8">
          <MailCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Email Generated Yet</h3>
          <p className="text-muted-foreground mb-4">
            Fill out the form and click "Generate" to create your follow-up email.
          </p>
          <Button onClick={() => setActiveTab('form')}>
            Go to Form
          </Button>
        </div>
      )}
    </div>
  );
  
  // If using the modal variant
  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={() => setIsOpen(true)}>
            <MailCheck className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Follow-Up Email</DialogTitle>
            <DialogDescription>
              Create a professional follow-up email for your job application
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="form">Details</TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedEmail}>Email Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-4 mt-4">
              {formContent}
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4 mt-4">
              {previewContent}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            
            {generatedEmail && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyEmail}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleDownloadEmail}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleRegenerateEmail} disabled={generatingEmail}>
                  {generatingEmail ? (
                    <LoadingSpinner className="mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Default variant (full page)
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Follow-Up Email</CardTitle>
        <CardDescription>
          Create a professional follow-up email for your job application
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="form">Application Details</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedEmail}>Email Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="space-y-4 mt-4">
            {formContent}
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4 mt-4">
            {previewContent}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        {activeTab === 'form' ? (
          <div className="flex justify-end w-full">
            <Button 
              onClick={handleGenerateEmail} 
              disabled={generatingEmail || !formData.jobTitle || !formData.companyName}
            >
              {generatingEmail ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate Follow-Up Email
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setActiveTab('form')}>
              <FileText className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button variant="outline" onClick={handleCopyEmail}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDownloadEmail}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleRegenerateEmail} disabled={generatingEmail}>
              {generatingEmail ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}