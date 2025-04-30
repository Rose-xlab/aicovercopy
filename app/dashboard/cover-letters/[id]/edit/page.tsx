'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';

// Validation schema for cover letter
const coverLetterSchema = z.object({
  jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters" }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  content: z.string().min(50, { message: "Cover letter content must be at least 50 characters" }),
});

type CoverLetterFormInputs = z.infer<typeof coverLetterSchema>;

export default function EditCoverLetterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<CoverLetterFormInputs>({
    resolver: zodResolver(coverLetterSchema)
  });

  // Fetch existing cover letter data
  useEffect(() => {
    async function fetchCoverLetter() {
      try {
        const response = await fetch(`/api/cover-letters/fetch?id=${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch cover letter');
        
        const data = await response.json();
        setValue('jobTitle', data.jobTitle);
        setValue('companyName', data.companyName);
        setValue('content', data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    }

    fetchCoverLetter();
  }, [params.id, setValue]);

  // Submit handler
  const onSubmit: SubmitHandler<CoverLetterFormInputs> = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cover-letters/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          ...data
        }),
      });

      if (!response.ok) throw new Error('Failed to update cover letter');

      router.push('/dashboard/cover-letters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Cover Letter</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            {...register('jobTitle')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-red-500 text-sm">{errors.jobTitle.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            {...register('companyName')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.companyName && (
            <p className="mt-1 text-red-500 text-sm">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Cover Letter Content
          </label>
          <textarea
            {...register('content')}
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.content && (
            <p className="mt-1 text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            type="button" 
            onClick={() => router.push('/dashboard/cover-letters')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Cover Letter'}
          </button>
        </div>
      </form>
    </div>
  );
}