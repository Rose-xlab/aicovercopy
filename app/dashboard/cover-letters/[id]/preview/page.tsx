"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Download, Edit, Eye, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import CoverLetterPreview from "../../components/CoverLetterPreview";

// Process sender and recipient JSON fields
const parseJsonField = (field) => {
  if (!field) return {};

  try {
    // If it's already an object, return it
    if (typeof field === "object") {
      return field;
    }

    // If it's a string, try to parse it
    if (typeof field === "string") {
      return JSON.parse(field);
    }
  } catch (e) {
    console.error("Error parsing JSON field:", e);
  }

  return {};
};

// Process cover letter data with proper sender and recipient info
const processCoverLetterData = (coverLetterData, currentUser) => {
  const processedData = { ...coverLetterData };

  // Process sender information (JSON column)
  let sender = {};
  try {
    // Parse sender JSON if it exists as a string
    if (typeof processedData.sender === "string") {
      sender = JSON.parse(processedData.sender);
    } else if (
      processedData.sender &&
      typeof processedData.sender === "object"
    ) {
      sender = processedData.sender;
    }
  } catch (e) {
    console.error("Error parsing sender JSON:", e);
    // Continue with empty sender object
  }

  // Process recipient information (JSON column)
  let recipient = {};
  try {
    // Parse recipient JSON if it exists as a string
    if (typeof processedData.recipient === "string") {
      recipient = JSON.parse(processedData.recipient);
    } else if (
      processedData.recipient &&
      typeof processedData.recipient === "object"
    ) {
      recipient = processedData.recipient;
    }
  } catch (e) {
    console.error("Error parsing recipient JSON:", e);
    // Continue with empty recipient object
  }

  // Apply current user data as fallback for sender if needed
  if (
    currentUser &&
    (Object.keys(sender).length === 0 || !hasRequiredSenderFields(sender))
  ) {
    const userMetadata = currentUser.user_metadata || {};

    // Fill in missing sender fields from user data
    sender = {
      first_name:
        sender.first_name ||
        userMetadata.first_name ||
        currentUser.first_name ||
        "",
      last_name:
        sender.last_name ||
        userMetadata.last_name ||
        currentUser.last_name ||
        "",
      middle_name: sender.middle_name || userMetadata.middle_name || "",
      email: sender.email || currentUser.email || "",
      phone: sender.phone || userMetadata.phone || currentUser.phone || "",
      location:
        sender.location || userMetadata.location || currentUser.location || "",
      address: sender.address || userMetadata.address || "",
      city: sender.city || userMetadata.city || "",
      state: sender.state || userMetadata.state || "",
      zip: sender.zip || userMetadata.zip || "",
      country: sender.country || userMetadata.country || "",
      ...sender, // Keep any other existing sender fields
    };
  }

  // Apply placeholder data for recipient if needed
  if (
    Object.keys(recipient).length === 0 ||
    !hasRequiredRecipientFields(recipient)
  ) {
    recipient = {
      name: recipient.name || "[Recipient Name]",
      title: recipient.title || "[Recipient Title]",
      company:
        recipient.company || processedData.company_name || "[Company Name]",
      address: recipient.address || "[Company Address]",
      ...recipient, // Keep any other existing recipient fields
    };
  }

  // Create flattened fields for template variable replacement
  // This allows templates to use both sender.first_name and first_name syntax
  const flattenedData = {
    ...processedData,

    // Add sender fields both as nested and flat properties
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

    // Add recipient fields both as nested and flat properties
    recipient,
    recipient_name: recipient.name || "",
    recipient_title: recipient.title || "",
    company_name: recipient.company || processedData.company_name || "",
    company_address: recipient.address || "",

    // Format the current date if not already set
    date: processedData.date || new Date().toLocaleDateString(),
  };

  return flattenedData;
};

// Check if sender has minimum required fields
const hasRequiredSenderFields = (sender) => {
  return (
    sender.first_name && sender.last_name && (sender.email || sender.phone)
  );
};

// Check if recipient has minimum required fields
const hasRequiredRecipientFields = (recipient) => {
  return recipient.name && recipient.company;
};

// Normalize template data for consistent property access
const normalizeTemplate = (template) => {
  if (!template) return null;

  return {
    id: template.id || "fallback-template",
    name: template.name || "Fallback Template",
    description: template.description || "Basic cover letter template",
    htmlContent: template.htmlContent || template.html_content || "",
    cssContent: template.cssContent || template.css_content || "",
    metadata: template.metadata || {},
    // Add any additional template properties that need normalization
  };
};

// Get fallback template with basic styling
const getFallbackTemplate = () => {
  return normalizeTemplate({
    id: "fallback-template",
    name: "Fallback Template",
    description: "Basic fallback template",
    htmlContent: `
      <div class="container">
        <header>
          <div class="sender-info">
            {{first_name}} {{last_name}}
            {{email}}
            {{phone}}
            {{location}}
          </div>
          
          <div class="date">
            {{date}}
          </div>
          
          <div class="recipient-info">
            {{recipient_name}}
            {{job_title}}
            {{company_name}}
            {{company_address}}
          </div>
        </header>
        
        <main>
          <div class="salutation">
            Dear {{recipient_name}},
          </div>
          
          <div class="content">
            <div class="opening">
              {{content}}
            </div>
          </div>
          
          <div class="signature">
            Sincerely,<br>
            {{first_name}} {{last_name}}
          </div>
        </main>
      </div>
    `,
    cssContent: `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
        line-height: 1.6;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      
      .sender-info {
        margin-bottom: 20px;
      }
      
      .date {
        margin-bottom: 20px;
      }
      
      .recipient-info {
        margin-bottom: 30px;
      }
      
      .salutation {
        margin-bottom: 20px;
      }
      
      .content {
        margin-bottom: 30px;
      }
      
      .signature {
        margin-top: 40px;
      }
    `,
  });
};

export default function CoverLetterPreviewPage() {
  const [coverLetter, setCoverLetter] = useState(null);
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("fit");
  const [zoomLevel, setZoomLevel] = useState(75);
  const [isExporting, setIsExporting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const containerRef = useRef(null);

  const coverLetterId = params.id;

  // Fetch all available templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("name");

      if (error) throw error;

      return data.map((template) => normalizeTemplate(template));
    } catch (err) {
      console.error("Error fetching templates:", err);
      return [];
    }
  };

  // Fetch cover letter data and associated template
  const fetchCoverLetterData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!coverLetterId) {
        setError("Invalid cover letter ID");
        return;
      }

      const response = await fetch(`/api/cover-letters/fetch?id=${params.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch cover letter (Status: ${response.status})`
        );
      }

      const data = await response.json();
      console.log("Cover letter data fetched:", data);

      setCoverLetter(data);

      // Fetch all available templates
      const templates = await fetchTemplates();
      setAvailableTemplates(templates);

      // Try to get the specific template
      let selectedTemplate = null;

      // First try to get template from cover letter's template_id
      

      // If no template found, try to find one in available templates
      if (!selectedTemplate && templates.length > 0) {
        selectedTemplate = templates[0];
      }

      // Use fallback template as last resort
      if (!selectedTemplate) {
        selectedTemplate = getFallbackTemplate();
      }

      setTemplate(selectedTemplate);
    } catch (err) {
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
  };

  // Apply a different template to the current cover letter
  const applyTemplate = async (templateId) => {
    try {
      const selectedTemplate = availableTemplates.find(
        (t) => t.id === templateId
      );

      if (!selectedTemplate) {
        toast({
          title: "Error",
          description: "Template not found",
          variant: "destructive",
        });
        return;
      }

      setTemplate(selectedTemplate);

      // Update the cover letter's template_id in the database
      if (user && user.id === coverLetter.user_id) {
        const { error } = await supabase
          .from("cover_letters")
          .update({
            template_id: templateId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", coverLetterId);

        if (error) throw error;

        // Update the cover letter metadata to indicate the template used
        await supabase.from("cover_letter_metadata").upsert(
          {
            cover_letter_id: coverLetterId,
            template_id: templateId,
            last_updated: new Date().toISOString(),
            updated_by: user.id,
          },
          { onConflict: "cover_letter_id" }
        );

        toast({
          title: "Success",
          description: `Template updated to "${selectedTemplate.name}"`,
        });
      }
    } catch (err) {
      console.error("Error applying template:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCoverLetterData();
  }, [coverLetterId]);

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch("/api/cover-letters/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverLetterId: coverLetter.id,
          templateId: template.id,
          format,
          filename: `${coverLetter.first_name}-${coverLetter.last_name}-Cover-Letter`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${coverLetter.first_name}-${coverLetter.last_name}-Cover-Letter.${format}`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your cover letter has been exported as ${format.toUpperCase()}.`,
      });
    } catch (err) {
      console.error("Error exporting cover letter:", err);
      toast({
        title: "Export Failed",
        description:
          err.message || "Failed to export cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "fit" ? "full" : "fit"));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 40));
  };

  const handleZoomReset = () => {
    setZoomLevel(75);
  };

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

  const heightClass =
    viewMode === "fit"
      ? "h-screen sm:h-[600px] md:h-[700px] lg:h-[800px] xl:h-[900px]"
      : "h-screen";

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
                : `Cover letter by ${coverLetter.first_name} ${coverLetter.last_name}`}
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

          <Button onClick={() => handleExport("pdf")} disabled={isExporting}>
            {isExporting ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Template selector (only for the cover letter owner) */}
      {user &&
        user.id === coverLetter.user_id &&
        availableTemplates.length > 0 && (
          <div className="flex items-center gap-4">
            <label htmlFor="template-selector" className="font-medium">
              Template:
            </label>
            <select
              id="template-selector"
              className="p-2 border rounded-md w-64"
              value={template?.id || ""}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              {availableTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        )}

      <Card className="overflow-hidden" ref={containerRef}>
        {/* <CoverLetterPreview 
          coverLetter={coverLetter} 
          templateId={template}
          height="1500px"
          defaultZoom={zoomLevel}
          removeCard={true}
        /> */}
        <CoverLetterPreview
          coverLetter={coverLetter}
          templateId={coverLetter?.templateId}
          // height="600px"
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
                className="h-8 px-2"
              >
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

            <Button
              variant="outline"
              onClick={() => handleExport("docx")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              DOCX
            </Button>
            <Button onClick={() => handleExport("pdf")} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
