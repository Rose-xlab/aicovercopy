//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\resumes\templates\page.tsx

"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function ResumeTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user) {
          setError('You must be logged in to view templates');
          return;
        }
        
        // Fetch from resume_templates table
        const { data, error } = await supabase
          .from('resume_templates')
          .select('*')
          .eq('is_public', true);
        
        if (error) throw error;
        
        setTemplates(data || []);
      } catch (err: any) {
        console.error('Error fetching templates:', err);
        setError(err.message || 'Failed to load templates');
        toast({
          title: "Error",
          description: "Failed to load templates. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [supabase, toast, user]);
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/resumes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resumes
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Resume Templates</h1>
          <p className="text-muted-foreground">Choose a template for your new resume</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="overflow-hidden flex flex-col">
            <div className="aspect-video bg-muted relative overflow-hidden">
              {template.thumbnail ? (
                <Image 
                  src={template.thumbnail} 
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/resumes/new?template=${template.id}`}>
                  Use This Template
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {templates.length === 0 && !error && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">No templates available</h3>
          <p className="text-muted-foreground mb-4">There are no resume templates available at the moment.</p>
          <Button asChild>
            <Link href="/dashboard/resumes/new">Create a resume without a template</Link>
          </Button>
        </div>
      )}
    </div>
  );
}