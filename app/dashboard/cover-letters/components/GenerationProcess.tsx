"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

// Define an interface for the component's props to fix implicit 'any' types
interface GenerationProcessProps {
  progress: number;
  isRegenerating: boolean;
  dataSource: 'both' | 'cv' | 'linkedin';
}

const GenerationProcess = ({ 
  progress, 
  isRegenerating, 
  dataSource 
}: GenerationProcessProps) => {
  return (
    <Card className="border border-primary/20">
      <CardContent className="pt-6">
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="relative mb-8">
            {/* Circular background */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              {/* Inner spinner */}
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center z-10 shadow-lg">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            {/* Rotating progress indicator */}
            <div 
              className="absolute top-0 left-0 w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, #6366f1 0%, #8b5cf6 ${progress}%, transparent ${progress}%, transparent 100%)`,
                transform: "rotate(-90deg)",
                transition: "all 0.3s ease"
              }}
            />
            
            {/* Progress percentage in the bottom right */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md">
              {Math.round(progress)}%
            </div>
          </div>
          
          <div className="text-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {isRegenerating ? "Regenerating your cover letter..." : "Generating your cover letter..."}
          </div>
          
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {dataSource === 'both' 
              ? 'Analyzing job description and matching with your CV and LinkedIn profile'
              : dataSource === 'cv'
                ? 'Analyzing job description and matching with your CV'
                : 'Analyzing job description and matching with your LinkedIn profile'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationProcess;