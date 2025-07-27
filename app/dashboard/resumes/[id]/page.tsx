//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\resumes\[id]\page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ResumeBuilder from '@/components/ResumeBuilder';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { mapDatabaseToResumeData } from '@/lib/resume-mappers';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  ArrowLeft,
  ScanSearch,
  Download,
  Share2,
  Trash2,
  FileSpreadsheet,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EditResumePage() {
  const [resume, setResume] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'tailor'>('edit');

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const resumeId = params.id as string;

  useEffect(() => {
    // We only fetch the data once when the user is available.
    // The `ResumeBuilder` will handle its own state internally after this initial load.
    if (user) {
      const fetchResume = async () => {
        try {
          setIsLoading(true);
          setError(null);

          if (!resumeId) {
            setError('Invalid resume ID');
            return;
          }

          const { data, error: dbError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();

          if (dbError) throw dbError;

          if (data.user_id !== user.id) {
            setError('You do not have permission to edit this resume');
            return;
          }

          const mappedResume = mapDatabaseToResumeData(data);
          console.log("Mapped resume data for editing:", mappedResume);

          setResume(mappedResume);
        } catch (err: any) {
          console.error('Error fetching resume:', err);
          setError(err.message || 'Failed to load resume data');
          toast({
            title: "Error",
            description: "Failed to load resume data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchResume();
    }
  }, [resumeId, user, supabase, toast]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center w-full">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading Resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto py-8 px-2">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard/resumes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resumes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full m-0 p-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 w-full">
        <div className="w-full py-4 px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start sm:items-center flex-col sm:flex-row sm:gap-4">
              <Button variant="ghost" asChild className="mb-2 sm:mb-0 -ml-2 h-8">
                <Link href="/dashboard/resumes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                  {resume?.title || 'Resume'}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/resumes/${resumeId}/ats-scanner`)}
                  className="ml-auto sm:ml-0 h-7 bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:from-violet-600 hover:to-purple-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <ScanSearch className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-medium">ATS Scan</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Full Width */}
      <div className="w-full px-0">
        <Card className="border-2 border-teal-100 mb-6 w-full">
          <CardHeader className="border-b bg-teal-50/50 py-2">
            <CardTitle className="text-lg text-teal-800">Resume Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={activeTab === 'edit' ? 'default' : 'outline'}
                className="h-12 flex items-center justify-start px-4 bg-teal-600 hover:bg-teal-700"
                onClick={() => setActiveTab('edit')}
              >
                <Edit className="h-4 w-4 mr-3 flex-shrink-0" />
                <div className="font-semibold text-sm">Edit</div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/resumes/${resumeId}/tailor`)}
                className="h-12 flex items-center justify-start px-4 border-2 hover:bg-teal-50"
              >
                <Sparkles className="h-4 w-4 mr-3 flex-shrink-0 text-teal-600" />
                <div className="font-semibold text-sm">Tailor to Job</div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTab === 'edit' && resume && (
          <div className="bg-white w-full m-0 p-0">
            {/* The ResumeBuilder is now only rendered when 'resume' data is available */}
            <ResumeBuilder initialData={resume} resumeId={resumeId} />
          </div>
        )}
      </div>
    </div>
  );
}