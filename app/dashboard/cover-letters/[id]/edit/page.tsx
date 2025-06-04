"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import CoverLetterPreview from "../../components/CoverLetterPreview";
import CoverLetterEditor from "../../components/CoverLetterEditor";
import type { CoverLetter } from "@/types/cover-letter";
import { createBrowserClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
export default function EditCoverLetterPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createBrowserClient();
  const resolvedParams = use(params);
  const router = useRouter();

  // Add a proper loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetter | null>(
    null
  );
   

  // const {
  //   register,
  //   handleSubmit,
  //   watch,
  //   setValue,
  //   formState: { errors },
  // } = useForm<CoverLetterFormInputs>({
  //   resolver: zodResolver(coverLetterSchema),
  // });

  // Fetch existing cover letter data
  useEffect(() => {
    async function fetchCoverLetter() {
      try {
        setIsLoading(true); // Set loading to true when starting fetch
        setError(null); // Clear any previous errors

        // Use the new API route for fetching a single cover letter
        const response = await fetch(
          `/api/cover-letters/fetch?id=${resolvedParams.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to fetch cover letter (Status: ${response.status})`
          );
        }

        const data = await response.json();
        console.log("Cover letter data fetched:", data);

        // Set data for preview
        setCoverLetterData(data);
      } catch (err) {
        console.error("Error fetching cover letter:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setCoverLetterData(null); // Explicitly set to null on error
      } finally {
        setIsLoading(false); // Always set loading to false when done
      }
    }

    fetchCoverLetter();
  }, [resolvedParams.id]);



  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading cover letter...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Cover Letter</h1>
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Show not found state
  if (!coverLetterData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Cover Letter</h1>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Cover Letter Not Found
            </h2>
            <p className="text-muted-foreground mb-4">
              The cover letter you're looking for doesn't exist 
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show the actual cover letter when data loaded

  return coverLetterData ? (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Cover Letter</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-full">
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          {/* {json.stringify(coverLetterData)} */}
          <CoverLetterEditor coverLetter={coverLetterData} />
        </div>

        {/* <div className="lg:w-1/2">
            <div className="sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <CoverLetterPreview
                coverLetter={coverLetterData}
                templateId={coverLetterData.template_id}
                height="600px"
              /> 
            </div>
          </div> */}
      </div>
    </div>
  ) : (
    <div>No cover letter data found</div>
  );
}
