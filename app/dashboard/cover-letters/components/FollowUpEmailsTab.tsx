// 8. Follow-Up Emails Tab Component 
// src/components/cover-letter/FollowUpEmailsTab.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, MailCheck, FileText } from "lucide-react";
import Link from "next/link";
import { FollowUpEmailGenerator } from "@/components/FollowUpEmailGenerator";

const FollowUpEmailsTab = ({ user, supabase, onTabChange }) => {
  const [recentLetters, setRecentLetters] = useState([]);
  const [recentFollowUpEmails, setRecentFollowupEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load recent cover letters and follow-up emails
  const loadRecentData = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        
        // Load recent cover letters
        const { data: coverLetters, error: coverLettersError } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (coverLettersError) throw coverLettersError;
        
        if (coverLetters) {
          setRecentLetters(coverLetters);
        }
        
        // Load recent follow-up emails
        const { data: followUpEmails, error: followUpEmailsError } = await supabase
          .from('follow_up_emails')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (followUpEmailsError) throw followUpEmailsError;
        
        if (followUpEmails) {
          setRecentFollowupEmails(followUpEmails);
        }
      } catch (error) {
        console.error('Error loading recent data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [user, supabase]);
  
  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadRecentData();
    }
  }, [user, loadRecentData]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-Up Emails</CardTitle>
        <CardDescription>
          Create professional follow-up emails for your job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading your recent data...</p>
            </div>
          ) : recentLetters.length > 0 ? (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  Select one of your recent cover letters to create a targeted follow-up email
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                {recentLetters.map((letter) => (
                  <div key={letter.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div>
                        <h3 className="font-medium">{letter.title || `${letter.job_title} at ${letter.company_name}`}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {letter.created_at ? new Date(letter.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <FollowUpEmailGenerator
                          variant="modal"
                          initialJobTitle={letter.job_title || ''}
                          initialCompanyName={letter.company_name || ''}
                          initialCoverLetterId={letter.id}
                          initialCoverLetterContent={letter.content || ''}
                          candidateName={user?.display_name || user?.email?.split('@')[0] || ''}
                          candidateEmail={user?.email || ''}
                          triggerText="Create Follow-Up Email"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <MailCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-medium mb-2">No cover letters yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a cover letter first, then come back to write a follow-up email
              </p>
              <Button onClick={() => onTabChange("create")}>
                Create a Cover Letter
              </Button>
            </div>
          )}
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Create a Stand-Alone Follow-Up Email</h3>
            <p className="text-muted-foreground mb-4">
              Don&apos;t see the cover letter you need or want to create a follow-up from scratch?
            </p>
            <FollowUpEmailGenerator
              variant="modal"
              candidateName={user?.display_name || user?.email?.split('@')[0] || ''}
              candidateEmail={user?.email || ''}
              triggerText="Create New Follow-Up Email"
            />
          </div>
          
          {recentFollowUpEmails?.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Recent Follow-Up Emails</h3>
              <div className="divide-y">
                {recentFollowUpEmails.map((email) => (
                  <div key={email.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start">
                      <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
                        <MailCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{email.subject || `Follow-up for ${email.job_title}`}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>{email.created_at ? new Date(email.created_at).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-9 sm:ml-0">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Copy</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <Link href="/dashboard/history">
          <Button variant="link">
            View your full history
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FollowUpEmailsTab;