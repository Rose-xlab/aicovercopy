"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, MapPin, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface JobSearchInputProps {
  onSearch: (query: string, location?: string) => Promise<void>;
  isSearching: boolean;
}

export default function JobSearchInput({ onSearch, isSearching }: JobSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Missing search query",
        description: "Please enter what kind of job you're looking for.",
        variant: "destructive",
      });
      return;
    }
    
    await onSearch(searchQuery, location);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          Smart Job Search
        </CardTitle>
        <CardDescription>
          Describe your ideal job in natural language, and we'll find matches for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-prompt" className="text-base font-medium mb-2 block">
                What job are you looking for?
              </Label>
              <Textarea
                id="job-prompt"
                placeholder="E.g., 'I'm looking for a senior developer role with React experience in Oslo' or 'Marketing manager position in the technology sector'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="relative">
              <Button 
                type="button" 
                variant="link" 
                className="px-0 text-sm text-muted-foreground"
                onClick={() => setIsAdvanced(!isAdvanced)}
              >
                {isAdvanced ? "Hide advanced options" : "Show advanced options"}
              </Button>
            </div>

            {isAdvanced && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <div>
                  <Label htmlFor="location" className="text-sm font-medium mb-1 block">
                    Location
                  </Label>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Oslo, Bergen, etc."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Specify a location or leave blank for a nationwide search
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6">
            <Button type="submit" className="w-full" disabled={isSearching}>
              {isSearching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find Jobs
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}