//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\cover-letters\components\CoverLetterEditor.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type {
  CoverLetter,
  SenderInfo,
  RecipientInfo,
} from "@/types/cover-letter";
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { saveCoverLetter } from "@/lib/coverLetterGenerator";
import CoverLetterPreview from "./CoverLetterPreview";
import TemplateSelection from "./TemplateSelection";
import DownloadCoverLetter from "./DownloadCoverletter";

interface Props {
  coverLetter: CoverLetter;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
  // This prop now expects the function from the parent
  onRegenerateLetter?: (letter: CoverLetter) => Promise<void>; 
}

const CoverLetterEditor = ({
  coverLetter,
  onBack = () => {},
  onTabChange = () => {},
  onRegenerateLetter, // Use the prop directly
}: Props) => {
  const { toast } = useToast();

  // Use a single state object to manage the entire cover letter, preventing sync issues.
  const [editedLetter, setEditedLetter] = useState<CoverLetter>(coverLetter);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // This effect syncs the editor's state if a new coverLetter prop is received from the parent
  useEffect(() => {
    setEditedLetter(coverLetter);
  }, [coverLetter]);

  // Unified update handlers to prevent data loss
  const handleInputChange = (
    section: "sender" | "recipient",
    field: keyof SenderInfo | keyof RecipientInfo,
    value: string
  ) => {
    setEditedLetter((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleJobDetailChange = (
    field: "jobTitle" | "companyName" | "content",
    value: string
  ) => {
    setEditedLetter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const onApplyTemplate = (templateId: string) => {
     setEditedLetter((prev) => ({
       ...prev,
       templateId: templateId,
     }));
     // Save when the template changes
     handleSaveCoverLetter({ ...editedLetter, templateId });
  };

  // This function now correctly calls the prop from the parent
  const handleRegenerate = async () => {
    if (typeof onRegenerateLetter !== 'function') {
        console.error("onRegenerateLetter is not a function.");
        return;
    }
    setIsRegenerating(true);
    try {
        await onRegenerateLetter(editedLetter);
    } catch (error: any) {
        toast({
            title: "Regeneration Failed",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleSaveCoverLetter = async (letterToSave: CoverLetter) => {
    try {
      await saveCoverLetter(letterToSave);
      toast({
        title: "Cover Letter Saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving cover letter:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your cover letter.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCoverLetter = async () => {
    if (!editedLetter.content) {
        toast({ title: "Nothing to Copy", variant: "destructive" });
        return;
    }
    try {
      await navigator.clipboard.writeText(editedLetter.content);
      toast({
        title: "Copied to Clipboard",
        description: "Your cover letter has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1">
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <AlertDescription className="text-green-500 text-sm">
              Your cover letter has been generated. You can now edit the details and see a live preview.
              <p className="mt-2">
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-700 font-medium underline"
                  onClick={() => onTabChange("follow-up")}
                >
                  Create a follow-up email
                </Button>{" "}
                to increase your chances of getting a response.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Cover Letter</CardTitle>
              <CardDescription>
                {editedLetter.jobTitle ? `For ${editedLetter.jobTitle}` : "For the position"}
                {editedLetter.companyName ? ` at ${editedLetter.companyName}` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <TemplateSelection
                selectedTemplate={editedLetter.templateId || ""}
                onApplyTemplate={onApplyTemplate}
                onSkipSelection={() => {}}
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleRegenerate} // This now calls the correct handler
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2 flex flex-col h-full">
              <div className="space-y-6 mb-6">
                <div>
                  <Label className="text-base font-semibold">Job Details</Label>
                  <div className="mt-3">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={editedLetter.jobTitle || ""}
                      onChange={(e) => handleJobDetailChange("jobTitle", e.target.value)}
                      placeholder="e.g., Software Engineer"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-semibold">Your Information</Label>
                    <div className="grid gap-3 mt-3">
                      <div>
                        <Label htmlFor="senderName">Your Full Name</Label>
                        <Input
                          id="senderName"
                          value={editedLetter.sender?.name || ""}
                          onChange={(e) => handleInputChange("sender", "name", e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderAddress">Your Address</Label>
                        <Input
                          id="senderAddress"
                          value={editedLetter.sender?.address || ""}
                          onChange={(e) => handleInputChange("sender", "address", e.target.value)}
                          placeholder="123 Street Name, City, Country"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderEmail">Your Email</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          value={editedLetter.sender?.email || ""}
                          onChange={(e) => handleInputChange("sender", "email", e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderPhone">Your Phone</Label>
                        <Input
                          id="senderPhone"
                          type="tel"
                          value={editedLetter.sender?.phone || ""}
                          onChange={(e) => handleInputChange("sender", "phone", e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Recipient Information</Label>
                    <div className="grid gap-3 mt-3">
                      <div>
                        <Label htmlFor="recipientName">Recipient's Name</Label>
                        <Input
                          id="recipientName"
                          value={editedLetter.recipient?.name || ""}
                          onChange={(e) => handleInputChange("recipient", "name", e.target.value)}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientTitle">Recipient's Title</Label>
                        <Input
                          id="recipientTitle"
                          value={editedLetter.recipient?.title || ""}
                          onChange={(e) => handleInputChange("recipient", "title", e.target.value)}
                          placeholder="Hiring Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientCompany">Company Name</Label>
                        <Input
                          id="recipientCompany"
                          value={editedLetter.recipient?.company || ""}
                          onChange={(e) => {
                              handleInputChange("recipient", "company", e.target.value);
                              handleJobDetailChange("companyName", e.target.value);
                          }}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientAddress">Company Address</Label>
                        <Input
                          id="recipientAddress"
                          value={editedLetter.recipient?.address || ""}
                          onChange={(e) => handleInputChange("recipient", "address", e.target.value)}
                          placeholder="456 Company Street, Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Textarea
                value={editedLetter.content || ""}
                onChange={(e) => handleJobDetailChange("content", e.target.value)}
                className="min-h-[300px] font-serif lg:flex-grow lg:min-h-[600px]"
              />
            </div>

            <div className="lg:w-1/2">
              <div className="sticky top-6">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <CoverLetterPreview
                  coverLetter={editedLetter}
                  templateId={editedLetter.templateId}
                  defaultZoom={100}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleCopyCoverLetter}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => handleSaveCoverLetter(editedLetter)}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {editedLetter && <DownloadCoverLetter coverLetter={editedLetter} />}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CoverLetterEditor;