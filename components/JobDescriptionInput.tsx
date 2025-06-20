//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\JobDescriptionInput.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link as LinkIcon, Info, PenTool } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Filename: components/JobDescriptionInput.tsx
interface JobDescriptionInputProps {
  onSubmit: (description: string, tone: string) => void;
  cvUploaded?: boolean;
  linkedInConnected?: boolean;
}

export default function JobDescriptionInput({ 
  onSubmit,
  cvUploaded = false,
  linkedInConnected = false
}: JobDescriptionInputProps) {
  const [description, setDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");
  const [selectedTone, setSelectedTone] = useState("professional");

  const handleSubmit = async () => {
    setIsLoading(true);
    // Pass both the description/URL and the selected tone
    onSubmit(activeTab === "paste" ? description : jobUrl, selectedTone);
    setIsLoading(false);
  };

  return (
    <div>
      {/* Alert message removed */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="paste">
            <FileText className="w-4 h-4 mr-2" />
            Paste Description
          </TabsTrigger>
          {/*
<TabsTrigger value="url">
  <LinkIcon className="w-4 h-4 mr-2" />
  Job URL
</TabsTrigger>
*/}
        </TabsList>

        <TabsContent value="paste">
          <Textarea
            placeholder="Paste the job description here..."
            className="min-h-[200px] mb-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </TabsContent>

        <TabsContent value="url">
          <Input
            type="url"
            placeholder="Enter job listing URL (e.g., Finn.no, NAV.no)"
            className="mb-4"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
        </TabsContent>
      </Tabs>

      {/* Tone selection - moved from settings page */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <PenTool className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Choose Writing Style</Label>
        </div>
        <Select value={selectedTone} onValueChange={setSelectedTone}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="confident">Confident</SelectItem>
          </SelectContent>
        </Select>
        
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || (activeTab === "paste" ? !description : !jobUrl)}
        className="w-full"
      >
        {isLoading ? "Analyzing..." : "Generate"}
      </Button>

      {!cvUploaded && !linkedInConnected && (
        <p className="text-center text-sm text-muted-foreground mt-4">
         
        </p>
      )}
    </div>
  );
}