// 6. Recent Cover Letters Tab Component
// src/components/cover-letter/RecentCoverLettersTab.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import RecentCoverLetter from './RecentCoverLetter';

const RecentCoverLettersTab = ({ user }: { user: any }) => {
  const [recentLetters, setRecentLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load recent cover letters
  async function loadRecentLetters () {
    if (user) {
      try {
        setLoading(true);
        const response = await fetch(`/api/cover-letters/fetch`, {
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
        
        
        
        if (data) {
          setRecentLetters(data);
        }
      } catch (error) {
        console.error('Error loading recent cover letters:', error);
      } finally {
        setLoading(false);
      }
    }
  }
  
  // Load recent letters on component mount
  useEffect(() => {
    const fetchLetters = async () => {
      if (user) {
        await loadRecentLetters();
        console.log('recent cover', recentLetters);
      }

    }
    fetchLetters()
  }, [user]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cover Letters</CardTitle>
        <CardDescription>
          Quick access to your recently created cover letters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading your recent cover letters...</p>
            </div>
          ) : recentLetters.length > 0 ? (
            <div className="divide-y">
              {recentLetters.map((letter) => (
                <RecentCoverLetter key={letter.id} coverLetter={letter} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-medium mb-2">No cover letters yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any cover letters recently.
              </p>
              <Button onClick={() => {
                onTabChange("create");
              }}>
                Create a New Cover Letter
              </Button>
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

export default RecentCoverLettersTab;