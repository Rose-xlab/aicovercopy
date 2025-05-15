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



export default function EditCoverLetterPage({
  params,
}: {
  params: { id: string };
}) {

  const supabase = createBrowserClient();
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetter | null>();


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
        // Use the new API route for fetching a single cover letter
        const response = await fetch(`/api/cover-letters/fetch?id=${resolvedParams.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch cover letter (Status: ${response.status})`);
        }
    
        const data = await response.json();
        console.log('Cover letter data fetched:', data);
    
        // Set data for preview
        setCoverLetterData(data);
      } catch (err) {
        console.error('Error fetching cover letter:', err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    }

    fetchCoverLetter();
  }, [resolvedParams.id]);



  

  return (
    coverLetterData ? (
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
    )
  );
}
