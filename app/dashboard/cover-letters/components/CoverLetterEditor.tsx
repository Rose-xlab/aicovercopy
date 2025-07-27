//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\cover-letters\components\CoverLetterEditor.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
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
import {
  generateCoverLetter,
  saveCoverLetter,
} from "@/lib/coverLetterGenerator";
import CoverLetterPreview from "./CoverLetterPreview";
import TemplateSelection from "./TemplateSelection";
import DownloadCoverLetter from "./DownloadCoverletter";

interface Props {
  coverLetter: CoverLetter;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
  onRegenerateLetter?: () => void;
}

const CoverLetterEditor = ({
  coverLetter,
  onBack = () => {},
  onTabChange = () => {},
  onRegenerateLetter = () => {},
}: Props) => {
  console.log("preview coverletter", coverLetter);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const [jobTitle, setJobTitle] = useState<string | null>(coverLetter.jobTitle);
  const [jobDescription, setJobDescription] = useState<string>(
    coverLetter.jobDescription
  );
  const [dataSource, setDataSource] = useState<"cv" | "linkedin" | "both" | "none">(
    (coverLetter.data_source as "cv" | "linkedin" | "both" | "none") || "cv"
  );
  const [selectedTone, setSelectedTone] = useState<string>(coverLetter.tone);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [companyName, setCompanyName] = useState<string>(
    coverLetter.companyName || ""
  );
  const [content, setContent] = useState<string | null>(coverLetter.content);
  const [generatingLetter, setGeneratingLetter] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    coverLetter.templateId || ""
  );
  const [showTemplateSelection, setShowTemplateSelection] =
    useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);

  const [sender, setSender] = useState<SenderInfo>({
    name: coverLetter.sender?.name || "",
    address: coverLetter.sender?.address || "",
    email: coverLetter.sender?.email || "",
    phone: coverLetter.sender?.phone || "",
  });

  const [recipient, setRecipient] = useState<RecipientInfo>({
    name: "",
    title: coverLetter?.recipient?.title || "Hiring Manager",
    company: coverLetter?.recipient?.company || coverLetter.companyName || "",
    address: "",
  });

  const [editedLetter, setEditedLetter] = useState<CoverLetter>({
    id: coverLetter?.id,
    userId: coverLetter.userId,
    jobDescription,
    jobTitle,
    content,
    sender,
    recipient,
    templateId: selectedTemplate,
    companyName,
    tone: coverLetter.tone,
    data_source: dataSource as "linkedin" | "none" | "both" | "cv",
    created_at: coverLetter.created_at || new Date(),
  });

  // *** FIX ADDED HERE ***
  // This useEffect hook syncs the component's internal state
  // whenever the `coverLetter` prop from the parent changes.
  useEffect(() => {
    if (coverLetter) {
      setContent(coverLetter.content);
      setJobTitle(coverLetter.jobTitle);
      setCompanyName(coverLetter.companyName || "");
      setDataSource(
        (coverLetter.data_source as "cv" | "linkedin" | "both" | "none") || "cv"
      );
      setSelectedTone(coverLetter.tone);
      setSelectedTemplate(coverLetter.templateId || "");
      setSender(
        coverLetter.sender || {
          name: "",
          address: "",
          email: "",
          phone: "",
        }
      );
      setRecipient(
        coverLetter.recipient || {
          name: "",
          title: "Hiring Manager",
          company: coverLetter.companyName || "",
          address: "",
        }
      );
    }
  }, [coverLetter]);

  function onApplyTemplate(templateId: string) {
    console.log("selected template", templateId);
    setSelectedTemplate(templateId);

    // Update the editedLetter state with the new template
    setEditedLetter((prevState) => ({
      ...prevState,
      templateId: templateId,
    }));

    // Auto-save the cover letter with the new template
    handleSaveCoverLetterWithTemplate(templateId);
  }

  // Save cover letter with specific template
  const handleSaveCoverLetterWithTemplate = async (templateId: string) => {
    try {
      const coverLetterToSave = {
        id: coverLetter.id, // Make sure we include the ID to update existing record
        userId: coverLetter.userId,
        jobTitle: jobTitle || undefined,
        content: content || undefined,
        sender,
        recipient,
        companyName,
        template_id: templateId, // Use template_id (snake_case) as expected by the database
        jobDescription,
        tone: selectedTone,
        data_source: dataSource as "linkedin" | "none" | "both" | "cv",
        updatedAt: new Date().toISOString(),
      };

      console.log("Auto-saving cover letter with template:", templateId);
      console.log("Cover letter data being saved:", coverLetterToSave);

      await saveCoverLetter(coverLetterToSave);

      toast({
        title: "Template Applied & Saved",
        description: `Your cover letter has been saved with the selected template.`,
      });
    } catch (error) {
      console.error("Error saving cover letter with template:", error);
      toast({
        title: "Save Failed",
        description:
          "There was an error saving your cover letter with the template.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateCoverLetter = useCallback(async () => {
    setGeneratingLetter(true);
    setIsRegenerating(true);
    setGenerationProgress(0);

    try {
      const generatedContent = await generateCoverLetter({
        jobDescription,
        jobTitle: jobTitle || undefined,
        companyName,
        tone: selectedTone,
        resumeData: null,
        dataSource: dataSource as "linkedin" | "none" | "both" | "cv",
        regenerate: true,
      });

      console.log("the generated content", generatedContent);
      setContent(generatedContent);
      setGeneratedLetter(generatedContent);

      // Reset editing state if user was editing
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error regenerating cover letter:", error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Error regenerating cover letter.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLetter(false);
      setIsRegenerating(false);
    }
  }, [
    jobDescription,
    jobTitle,
    companyName,
    sender,
    recipient,
    selectedTone,
    dataSource,
    toast,
  ]);

  useEffect(() => {
    setEditedLetter((prevState) => ({
      ...prevState,
      jobTitle,
      content,
      sender,
      recipient,
      companyName,
      templateId: selectedTemplate,
      data_source: dataSource as "linkedin" | "none" | "both" | "cv",
      tone: selectedTone,
    }));
  }, [
    jobTitle,
    companyName,
    content,
    sender,
    recipient,
    selectedTemplate,
    dataSource,
    selectedTone,
  ]);

  // Update sender info
  const updateSender = (field: string, value: string) => {
    setSender((prevSender) => ({
      ...prevSender,
      [field]: value,
    }));
  };

  // Update recipient info
  const updateRecipient = (field: string, value: string) => {
    setRecipient((prevRecipient) => ({
      ...prevRecipient,
      [field]: value,
    }));
    if (field == "company") {
      setCompanyName(value);
    }
  };

  // Handle toggle editing mode
  const handleToggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle changes to the edited letter
  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Save the edited version as the current letter
  const handleSaveEdits = () => {
    setIsEditing(false);
    toast({
      title: "Edits Saved",
      description: "Your edits to the cover letter have been saved.",
    });
  };

  // Save cover letter
  const handleSaveCoverLetter = async () => {
    try {
      // Create a complete cover letter object with all current state
      const coverLetterToSave = {
        id: coverLetter.id, // Make sure we include the ID to update existing record
        userId: coverLetter.userId,
        jobTitle: jobTitle || undefined,
        content: content || undefined,
        sender,
        recipient,
        companyName,
        template_id: selectedTemplate, // Use template_id (snake_case) as expected by the database
        jobDescription,
        tone: selectedTone,
        data_source: dataSource as "linkedin" | "none" | "both" | "cv",
        updatedAt: new Date().toISOString(),
      };

      console.log("Saving cover letter with template:", selectedTemplate);
      console.log("Cover letter to save:", coverLetterToSave);

      await saveCoverLetter(coverLetterToSave);

      toast({
        title: "Cover Letter Saved",
        description: `Your cover letter has been saved successfully${
          selectedTemplate ? " with the selected template" : ""
        }.`,
      });
    } catch (error) {
      console.error("Error saving cover letter:", error);
      toast({
        title: "Save Failed",
        description:
          "There was an error saving your cover letter. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy cover letter to clipboard
  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(content || "");

      toast({
        title: "Copied to Clipboard",
        description: "Your cover letter has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description:
          "There was an error copying to your clipboard. Please try manually selecting and copying the text.",
        variant: "destructive",
      });
    }
  };

  // Handle regenerate letter
  const handleRegenerateLetter = () => {
    setIsRegenerating(true);
    setGeneratingLetter(true);
    handleRegenerateCoverLetter();
  };

  // Fix: Add onSkipSelection function that was missing
  const onSkipSelection = () => {
    setShowTemplateSelection(false);
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
              Your cover letter has been generated using{" "}
              {dataSource === "both"
                ? "both your CV and LinkedIn profile"
                : dataSource === "cv"
                ? "your CV"
                : "your LinkedIn profile"}
              {selectedTemplate && templates && (
                <>
                  {" "}
                  and formatted with the{" "}
                  <span className="font-medium">
                    {templates.find((t) => t.id === selectedTemplate)?.name ||
                      selectedTemplate}
                  </span>{" "}
                  template
                </>
              )}
              <p className="mt-2">
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-700 font-medium underline"
                  onClick={() => onTabChange("follow-up")}
                >
                  Create a follow-up email
                </Button>{" "}
                to increase your chances of getting a response
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
                {jobTitle ? `For ${jobTitle}` : "For the position"}
                {companyName ? ` at ${companyName}` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <TemplateSelection
                selectedTemplate={selectedTemplate}
                onApplyTemplate={(templateId: string) =>
                  onApplyTemplate(templateId)
                }
                onSkipSelection={() => onSkipSelection()}
              />

              {/* Regenerate button */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleRegenerateLetter}
                disabled={generatingLetter}
              >
                {generatingLetter && isRegenerating ? (
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
                      value={jobTitle || ""}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Software Engineer"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-semibold">
                      Your Information
                    </Label>
                    <div className="grid gap-3 mt-3">
                      <div>
                        <Label htmlFor="senderName">Your Full Name</Label>
                        <Input
                          id="senderName"
                          value={sender.name}
                          onChange={(e) => updateSender("name", e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderAddress">Your Address</Label>
                        <Input
                          id="senderAddress"
                          value={sender.address}
                          onChange={(e) =>
                            updateSender("address", e.target.value)
                          }
                          placeholder="123 Street Name, City, Country"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderEmail">Your Email</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          value={sender.email}
                          onChange={(e) =>
                            updateSender("email", e.target.value)
                          }
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderPhone">Your Phone</Label>
                        <Input
                          id="senderPhone"
                          type="tel"
                          value={sender.phone}
                          onChange={(e) =>
                            updateSender("phone", e.target.value)
                          }
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">
                      Recipient Information
                    </Label>
                    <div className="grid gap-3 mt-3">
                      <div>
                        <Label htmlFor="recipientName">Recipient's Name</Label>
                        <Input
                          id="recipientName"
                          value={recipient.name}
                          onChange={(e) =>
                            updateRecipient("name", e.target.value)
                          }
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientTitle">
                          Recipient's Title
                        </Label>
                        <Input
                          id="recipientTitle"
                          value={recipient.title}
                          onChange={(e) =>
                            updateRecipient("title", e.target.value)
                          }
                          placeholder="Hiring Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientCompany">Company Name</Label>
                        <Input
                          id="recipientCompany"
                          value={recipient.company}
                          onChange={(e) =>
                            updateRecipient("company", e.target.value)
                          }
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipientAddress">
                          Company Address
                        </Label>
                        <Input
                          id="recipientAddress"
                          value={recipient.address}
                          onChange={(e) =>
                            updateRecipient("address", e.target.value)
                          }
                          placeholder="456 Company Street, Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Textarea
                value={content || ""}
                onChange={handleEditChange}
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
            onClick={handleSaveCoverLetter}
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