import type { CoverLetter } from '@/types/cover-letter';
import { toast } from '@/components/ui/use-toast'; // Import toast from your UI library

interface ExportOptions {
  setIsExporting?: (isExporting: boolean) => void;
  onError?: (error: Error) => void;
}

export async function handleCoverLetterExport(
  coverLetter: CoverLetter,
  format: 'pdf' | 'docx' | 'text',
  options: ExportOptions = {}
) {
  const { setIsExporting, onError } = options;

  try {
    setIsExporting?.(true);

    const response = await fetch("/api/cover-letters/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coverLetterId: coverLetter?.id,
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
    
    return true;
  } catch (err) {
    console.error("Error exporting cover letter:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to export cover letter. Please try again.";
    
    toast({
      title: "Export Failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    onError?.(err instanceof Error ? err : new Error(errorMessage));
    return false;
  } finally {
    setIsExporting?.(false);
  }
}