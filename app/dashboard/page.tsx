"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/hooks/useProfile";
import { 
  FileText, 
  History, 
  Star, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Upload, 
  Linkedin, 
  CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Filename: app/dashboard/page.tsx
export default function DashboardPage() {
  const { profile, loading } = useProfile();
  const { toast } = useToast();
  const [hasCVUploaded, setHasCVUploaded] = useState(false);
  const [hasLinkedInConnected, setHasLinkedInConnected] = useState(false);
  const [inProgress, setInProgress] = useState(false);

  // Load saved CV and LinkedIn information on mount
  useEffect(() => {
    const savedCV = localStorage.getItem('userCV');
    const savedLinkedIn = localStorage.getItem('userLinkedIn');
    
    if (savedCV) setHasCVUploaded(true);
    if (savedLinkedIn) setHasLinkedInConnected(true);
  }, []);

  // Mock data for demonstration
  const recentLetters = [
    { id: '1', title: 'Marketing Manager at Company A', date: '2023-05-10' },
    { id: '2', title: 'Software Developer at Company B', date: '2023-05-08' },
  ];

  const stats = {
    totalLetters: 5,
    thisMonth: 3,
    averageLength: 450
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Simulate upload process
      setInProgress(true);
      
      setTimeout(() => {
        // Save CV information to local storage
        const cvData = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          date: new Date().toISOString()
        };
        localStorage.setItem('userCV', JSON.stringify(cvData));
        
        setHasCVUploaded(true);
        setInProgress(false);
        
        toast({
          title: "CV uploaded successfully",
          description: `${selectedFile.name} has been uploaded and will be used for your cover letters.`,
        });
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 mx-auto py-6 max-w-7xl">
      {/* Dashboard Header */}
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome to your cover letter assistant</p>
      </header>

      {/* Profile Status Alert */}
      {(hasCVUploaded || hasLinkedInConnected) && (
        <Alert className="mb-8 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <AlertDescription className="text-blue-500 text-sm sm:text-base py-1">
              <span className="font-semibold">Profile data ready:</span>{' '}
              {hasCVUploaded && <span className="mr-2">✓ CV uploaded</span>}
              {hasLinkedInConnected && <span>✓ LinkedIn connected</span>}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Quick Actions Section */}
      <section className="mb-8">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Get started with your cover letter journey
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              {/* Create New Letter Button - Moderately sized but still prominent */}
              <Link href="/dashboard/cover-letters?tab=create" className="block">
                <Button className="w-full h-auto py-3 flex flex-col items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-all hover:translate-y-[-1px] shadow-sm">
                  <Plus className="h-6 w-6" />
                  <div className="space-y-1 text-center">
                    <h3 className="font-medium">Create New Cover Letter</h3>
                    
                  </div>
                </Button>
              </Link>
              
              {/* CV and LinkedIn in the same row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Upload CV Button */}
                <Button 
                  variant="outline" 
                  className={`w-full h-auto py-2 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-sm
                    ${hasCVUploaded ? 'border-green-500 border text-green-600 hover:bg-green-50/50' : 'hover:border-primary'}`} 
                  onClick={() => document.getElementById('cv-upload')?.click()}
                  disabled={inProgress}
                >
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                  />
                  {inProgress ? (
                    <LoadingSpinner />
                  ) : hasCVUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <div className="space-y-0.5 text-center">
                    <h3 className="font-medium text-sm">
                      {hasCVUploaded ? "CV Uploaded" : "Upload CV"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {hasCVUploaded ? "Your CV is ready" : "Upload your CV"}
                    </p>
                  </div>
                </Button>
                
                {/* Connect LinkedIn Button */}
                <Link href="/dashboard/cover-letters?tab=create" className="block">
                  <Button 
                    variant="outline" 
                    className={`w-full h-auto py-2 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-sm
                      ${hasLinkedInConnected 
                        ? 'border-green-500 border text-green-600 hover:bg-green-50/50' 
                        : 'border-[#0A66C2] hover:bg-[#0A66C2]/5'}`}
                  >
                    {hasLinkedInConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                    )}
                    <div className="space-y-0.5 text-center">
                      <h3 className="font-medium text-sm">
                        {hasLinkedInConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
                      </h3>
                     
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cover Letters Section */}
        <Card className="lg:col-span-2 border-t-4 border-t-blue-400 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Cover Letters</CardTitle>
              <CardDescription>Your latest cover letter creations</CardDescription>
            </div>
            <Link href="/dashboard/history">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLetters.length > 0 ? (
              <div className="divide-y">
                {recentLetters.map((letter) => (
                  <div key={letter.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-start sm:items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-3 mt-1 sm:mt-0 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{letter.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Created on {new Date(letter.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-8 sm:ml-0">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Edit</Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
                <h3 className="text-lg font-medium mb-2">No cover letters yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't created any cover letters yet. Get started by creating your first one.
                </p>
                <Link href="/dashboard/cover-letters?tab=create">
                  <Button className="px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Cover Letter
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter className="sm:hidden border-t pt-4">
            <Link href="/dashboard/history" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View All Cover Letters
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Activity Stats Card */}
        <Card className="border-t-4 border-t-purple-400 shadow-md h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Your Activity</CardTitle>
            <CardDescription>Cover letter stats and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg text-center transition-transform hover:scale-105">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalLetters}</p>
                  <p className="text-sm text-muted-foreground">Total Letters</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg text-center transition-transform hover:scale-105">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/5 to-purple-400/10 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Average Letter Length</h3>
                  <span className="text-sm text-muted-foreground">{stats.averageLength} words</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.averageLength / 500) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Good length for a professional letter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}