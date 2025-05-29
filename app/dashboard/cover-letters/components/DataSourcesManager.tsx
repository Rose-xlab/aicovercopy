// 3. Data Sources Manager Component
// src/components/cover-letter/DataSourcesManager.jsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CVManager } from "@/components/CVManager";
import { LinkedInManager } from "@/components/LinkedInManager";

const DataSourcesManager = ({ isOpen, setIsOpen, hasCV, hasLinkedIn, cvFiles, linkedInProfile }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Data Sources</CardTitle>
          </div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {isOpen ? "Hide" : "Manage"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          {/* CV Connection Display */}
          <div className={`flex items-center rounded-md border p-3 ${hasCV ? 'border-green-500/50 bg-green-500/10' : 'border-muted bg-muted/50'} cursor-pointer`} 
            onClick={() => setIsOpen(true)}>
            <div className={`mr-3 rounded-full p-1 ${hasCV ? 'bg-green-500/20' : 'bg-muted'}`}>
              <FileText className={`h-4 w-4 ${hasCV ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Resume/CV</p>
              {hasCV && cvFiles.find(cv => cv.isSelected)?.name ? (
                <p className="text-xs text-green-600">
                  {cvFiles.find(cv => cv.isSelected)?.name?.length > 15 
                    ? cvFiles.find(cv => cv.isSelected)?.name?.substring(0, 15) + '...' 
                    : cvFiles.find(cv => cv.isSelected)?.name}
                </p>
              ) : (
                <p className="text-xs text-blue-600 font-medium hover:underline">
                  Connect
                </p>
              )}
            </div>
          </div>
          
          {/* LinkedIn Connection Display */}
          <div className={`flex items-center rounded-md border p-3 ${hasLinkedIn ? 'border-green-500/50 bg-green-500/10' : 'border-muted bg-muted/50'} cursor-pointer`}
            onClick={() => setIsOpen(true)}>
            <div className={`mr-3 rounded-full p-1 ${hasLinkedIn ? 'bg-green-500/20' : 'bg-muted'}`}>
              <Linkedin className={`h-4 w-4 ${hasLinkedIn ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">LinkedIn</p>
              {hasLinkedIn && linkedInProfile?.name ? (
                <p className="text-xs text-green-600">
                  {linkedInProfile.name.length > 15 
                    ? linkedInProfile.name.substring(0, 15) + '...' 
                    : linkedInProfile.name}
                </p>
              ) : (
                <p className="text-xs text-blue-600 font-medium hover:underline">
                  Connect
                </p>
              )}
            </div>
          </div>
        </div>
        
        <Collapsible open={isOpen}>
          <CollapsibleContent>
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CV Manager */}
                <CVManager />
                
                {/* LinkedIn Manager */}
                <LinkedInManager />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default DataSourcesManager;
