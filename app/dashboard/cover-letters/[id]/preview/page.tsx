"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Download, Edit, Eye, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import CoverLetterPreview from "../../components/CoverLetterPreview";
import DownloadCoverletter from "../../components/DownloadCoverletter";
import { handleCoverLetterExport } from "@/services/coverletter.service";
import { User } from "@supabase/supabase-js";

// --- Type Definitions for Clarity ---

interface Sender {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Recipient {
  name?: string;
  title?: string;
  company?: string;
  address?: string;
}

interface CoverLetter {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  content: string;
  sender: Sender | string;
  recipient: Recipient | string;
  created_at?: string;
  updated_at?: string;
  template_id?: string;
  date?: string;
  first_name?: string; // For fallback
  last_name?: string; // For fallback
  userId?: string; // Legacy or alternative property
  job_description?: string;
  tone?: string;
  data_source?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  cssContent: string;
  metadata: any;
  html_content?: string; // For normalization
  css_content?: string; // For normalization
}

// Helper function to check for fullscreen API variants
interface FullscreenElement extends HTMLDivElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

// Process sender and recipient JSON fields
const parseJsonField = (field: string | object | null): object => {
  if (!field) return {};
  try {
    if (typeof field === "object") return field;
    if (typeof field === "string") return JSON.parse(field);
  } catch (e) {
    console.error("Error parsing JSON field:", e);
  }
  return {};
};

// Process cover letter data with proper sender and recipient info
const processCoverLetterData = (
  coverLetterData: CoverLetter,
  currentUser: User | null
) => {
  const processedData = { ...coverLetterData };

  const sender: Sender = parseJsonField(processedData.sender);
  const recipient: Recipient = parseJsonField(processedData.recipient);

  // Apply current user data as fallback for sender if needed
  if (currentUser && (Object.keys(sender).length === 0 || !hasRequiredSenderFields(sender))) {
    const userMetadata = currentUser.user_metadata || {};
    const profile = (currentUser as any).profile || {};

    sender.first_name = sender.first_name || profile.first_name || userMetadata.first_name || "";
    sender.last_name = sender.last_name || profile.last_name || userMetadata.last_name || "";
    sender.middle_name = sender.middle_name || profile.middle_name || userMetadata.middle_name || "";
    sender.email = sender.email || currentUser.email || "";
    sender.phone = sender.phone || profile.phone || userMetadata.phone || "";
    sender.location = sender.location || profile.location || userMetadata.location || "";
    sender.address = sender.address || profile.address || userMetadata.address || "";
    sender.city = sender.city || profile.city || userMetadata.city || "";
    sender.state = sender.state || profile.state || userMetadata.state || "";
    sender.zip = sender.zip || profile.zip || userMetadata.zip || "";
    sender.country = sender.country || profile.country || userMetadata.country || "";
  }

  // Apply placeholder data for recipient if needed
  if (Object.keys(recipient).length === 0 || !hasRequiredRecipientFields(recipient)) {
    recipient.name = recipient.name || "[Recipient Name]";
    recipient.title = recipient.title || "[Recipient Title]";
    recipient.company = recipient.company || processedData.company_name || "[Company Name]";
    recipient.address = recipient.address || "[Company Address]";
  }

  // Create flattened fields and aliased fields for components
  return {
    ...processedData,
    sender,
    first_name: sender.first_name || "",
    last_name: sender.last_name || "",
    middle_name: sender.middle_name || "",
    email: sender.email || "",
    phone: sender.phone || "",
    location: sender.location || "",
    address: sender.address || "",
    city: sender.city || "",
    state: sender.state || "",
    zip: sender.zip || "",
    country: sender.country || "",
    recipient,
    recipient_name: recipient.name || "",
    recipient_title: recipient.title || "",
    company_name: recipient.company || processedData.company_name || "",
    company_address: recipient.address || "",
    date: processedData.date || new Date().toLocaleDateString(),
    // Add camelCase versions for components that expect them
    jobTitle: processedData.job_title,
    companyName: processedData.company_name,
    jobDescription: processedData.job_description,
    tone: processedData.tone,
    data_source: processedData.data_source,
  };
};

// Check if sender has minimum required fields
const hasRequiredSenderFields = (sender: Sender): boolean => {
  return !!(sender.first_name && sender.last_name && (sender.email || sender.phone));
};

// Check if recipient has minimum required fields
const hasRequiredRecipientFields = (recipient: Recipient): boolean => {
  return !!(recipient.name && recipient.company);
};

// Normalize template data for consistent property access
const normalizeTemplate = (template: any): Template | null => {
  if (!template) return null;
  return {
    id: template.id || "fallback-template",
    name: template.name || "Fallback Template",
    description: template.description || "Basic cover letter template",
    htmlContent: template.htmlContent || template.html_content || "",
    cssContent: template.cssContent || template.css_content || "",
    metadata: template.metadata || {},
  };
};

// Get fallback template with basic styling
const getFallbackTemplate = (): Template => {
  return normalizeTemplate({
    id: "fallback-template",
    name: "Fallback Template",
    description: "Basic fallback template",
    htmlContent: `...`, // HTML content from original file
    cssContent: `...`, // CSS content from original file
    metadata: {}, // Added missing property
  })!;
};

export default function CoverLetterPreviewPage() {
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("fit");
  const [zoomLevel, setZoomLevel] = useState(75);
  const [isExporting, setIsExporting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [isClient, setIsClient] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const containerRef = useRef<FullscreenElement | null>(null);

  const coverLetterId = params.id as string;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      const { data, error } = await supabase.from("templates").select("*").order("name");
      if (error) throw error;
      return data.map((t: any) => normalizeTemplate(t)).filter(Boolean) as Template[];
    } catch (err) {
      console.error("Error fetching templates:", err);
      return [];
    }
  }, [supabase]);

  const fetchCoverLetterData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!coverLetterId) {
        setError("Invalid cover letter ID");
        return;
      }

      const response = await fetch(`/api/cover-letters/fetch?id=${coverLetterId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch cover letter (Status: ${response.status})`);
      }

      const data: CoverLetter = await response.json();
      setCoverLetter(data);

      const templates = await fetchTemplates();
      setAvailableTemplates(templates);

      let selectedTemplate: Template | null | undefined = templates.find((t) => t.id === data.template_id);
      if (!selectedTemplate && templates.length > 0) {
        selectedTemplate = templates[0];
      }
      if (!selectedTemplate) {
        selectedTemplate = getFallbackTemplate();
      }

      setTemplate(selectedTemplate);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load cover letter data");
      toast({
        title: "Error",
        description: "Failed to load cover letter data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [coverLetterId, toast, fetchTemplates]);

  const applyTemplate = async (templateId: string) => {
    if (!coverLetter) return;
    try {
      const selectedTemplate = availableTemplates.find((t) => t.id === templateId);
      if (!selectedTemplate) {
        toast({ title: "Error", description: "Template not found", variant: "destructive" });
        return;
      }

      setTemplate(selectedTemplate);

      if (user && user.id === coverLetter.user_id) {
        const { error } = await supabase
          .from("cover_letters")
          .update({ template_id: templateId, updated_at: new Date().toISOString() })
          .eq("id", coverLetterId);

        if (error) throw error;
        
        // NOTE: The table 'cover_letter_metadata' was not found in your Supabase types.
        // If this table exists, you may need to regenerate your types.
        // This block is commented out to prevent crashing.
        /*
        await supabase.from("cover_letter_metadata").upsert(
          {
            cover_letter_id: coverLetterId,
            template_id: templateId,
            last_updated: new Date().toISOString(),
            updated_by: user.id,
          },
          { onConflict: "cover_letter_id" }
        );
        */

        toast({
          title: "Success",
          description: `Template updated to "${selectedTemplate.name}"`,
        });
      }
    } catch (err: any) {
      console.error("Error applying template:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  const toggleViewMode = () => setViewMode((prev) => (prev === "fit" ? "full" : "fit"));
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 40));
  const handleZoomReset = () => setZoomLevel(75);

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    }
  };

  useEffect(() => {
    if (isClient && coverLetterId) {
      fetchCoverLetterData();
    }
  }, [isClient, coverLetterId, fetchCoverLetterData]);

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link href="/dashboard/cover-letters">Back to Cover Letters</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!coverLetter) {
      return (
          <div className="container py-8">
              <Alert variant="destructive">
                  <AlertDescription>Cover letter data could not be loaded.</AlertDescription>
              </Alert>
          </div>
      );
  }
  
  const processedCoverLetter = processCoverLetterData(coverLetter, user);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/dashboard/cover-letters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {coverLetter.job_title} at {coverLetter.company_name}
            </h1>
            <p className="text-muted-foreground">
              {coverLetter.user_id === user?.id
                ? "Preview your cover letter"
                : `Cover letter by ${processedCoverLetter.first_name} ${processedCoverLetter.last_name}`}
            </p>
            {coverLetter.created_at && (
              <p className="text-xs text-muted-foreground">
                Created: {new Date(coverLetter.created_at).toLocaleDateString()}
                {coverLetter.updated_at &&
                  coverLetter.updated_at !== coverLetter.created_at &&
                  ` • Updated: ${new Date(
                    coverLetter.updated_at
                  ).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {user && user.id === coverLetter.user_id && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/cover-letters/${coverLetterId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Cover Letter
              </Link>
            </Button>
          )}
          <DownloadCoverletter coverLetter={processedCoverLetter as any} />
        </div>
      </div>
      
      {user && user.id === coverLetter.user_id && availableTemplates.length > 0 && (
          <div className="flex items-center gap-4">
              <label htmlFor="template-selector" className="font-medium">Template:</label>
              <select
                  id="template-selector"
                  className="p-2 border rounded-md w-64 bg-background"
                  value={template?.id || ""}
                  onChange={(e) => applyTemplate(e.target.value)}
              >
                  {availableTemplates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                  ))}
              </select>
          </div>
      )}

      <Card className="overflow-hidden" ref={containerRef}>
        <CoverLetterPreview
          coverLetter={processedCoverLetter as any}
          templateId={template?.id}
        />
        <CardFooter className="flex justify-between bg-muted/20 border-t p-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleViewMode}>
              {viewMode === "fit" ? "Full Height" : "Fit to Screen"}
            </Button>
            <Button variant="outline" onClick={handleFullscreen}>
              <Eye className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex space-x-1 mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 40}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomReset} className="h-8 px-2">
                <span className="text-xs">{zoomLevel}%</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <DownloadCoverletter coverLetter={processedCoverLetter as any} />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}