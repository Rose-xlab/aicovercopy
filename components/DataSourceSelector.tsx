"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Linkedin, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Upload,
  CalendarCheck
} from "lucide-react";
import { CvFile } from "./CVManager";
import { LinkedInProfile } from "./LinkedInManager";
import { useToast } from "@/hooks/use-toast";

interface DataSourceSelectorProps {
  cvFiles: CvFile[];
  linkedInProfile: LinkedInProfile | null;
  onDataSourceChange: (source: 'cv' | 'linkedin' | 'both' | 'none') => void;
  onCreateCoverLetter: () => void;
}

export function DataSourceSelector({
  cvFiles,
  linkedInProfile,
  onDataSourceChange,
  onCreateCoverLetter
}: DataSourceSelectorProps) {
  const { toast } = useToast();
  const [dataSource, setDataSource] = useState<'cv' | 'linkedin' | 'both' | 'none'>('none');
  
  // Get the selected CV
  const selectedCv = cvFiles.find(cv => cv.isSelected);
  
  // Check if LinkedIn is connected
  const isLinkedInConnected = linkedInProfile && linkedInProfile.status === 'connected';
  
  // Effect to handle data source changes
  useEffect(() => {
    // Automatically determine the best data source based on available data
    if (selectedCv && isLinkedInConnected) {
      setDataSource('both');
    } else if (selectedCv) {
      setDataSource('cv');
    } else if (isLinkedInConnected) {
      setDataSource('linkedin');
    } else {
      setDataSource('none');
    }
  }, [selectedCv, isLinkedInConnected]);
  
  // Effect to notify parent of data source changes
  useEffect(() => {
    onDataSourceChange(dataSource);
  }, [dataSource, onDataSourceChange]);
  
  // Handle data source change
  const handleDataSourceChange = (value: string) => {
    setDataSource(value as 'cv' | 'linkedin' | 'both' | 'none');
    
    toast({
      title: "Data Source Updated",
      description: `Your cover letter will be generated using ${
        value === 'both' 
          ? 'both your CV and LinkedIn profile' 
          : value === 'cv' 
            ? 'your selected CV' 
            : 'your LinkedIn profile'
      }`,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source Selection</CardTitle>
        <CardDescription>
          Choose which information to use for your cover letter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status alerts */}
          {!selectedCv && !isLinkedInConnected && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              <AlertDescription className="text-amber-500 text-sm">
                Please upload a CV or connect your LinkedIn profile to generate better cover letters
              </AlertDescription>
            </Alert>
          )}
          
          {/* Data source selection */}
          <RadioGroup 
            value={dataSource} 
            onValueChange={handleDataSourceChange}
            className="space-y-4"
            disabled={!selectedCv && !isLinkedInConnected}
          >
            {/* CV Option */}
            <div className={`flex items-center space-x-2 rounded-md border p-4 ${
              dataSource === 'cv' ? 'bg-primary/5 border-primary' : 'border-border'
            } ${!selectedCv ? 'opacity-50' : ''}`}>
              <RadioGroupItem 
                value="cv" 
                id="cv" 
                disabled={!selectedCv}
              />
              <Label 
                htmlFor="cv"
                className={`flex flex-1 items-center ${!selectedCv ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <FileText className={`h-5 w-5 mr-2 ${
                  dataSource === 'cv' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="space-y-1">
                  <p className="font-medium">Use CV Data</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCv 
                      ? `Using "${selectedCv.name}"`
                      : "No CV selected - please upload or select a CV"
                    }
                  </p>
                </div>
              </Label>
            </div>
            
            {/* LinkedIn Option */}
            <div className={`flex items-center space-x-2 rounded-md border p-4 ${
              dataSource === 'linkedin' ? 'bg-primary/5 border-primary' : 'border-border'
            } ${!isLinkedInConnected ? 'opacity-50' : ''}`}>
              <RadioGroupItem 
                value="linkedin" 
                id="linkedin" 
                disabled={!isLinkedInConnected}
              />
              <Label 
                htmlFor="linkedin"
                className={`flex flex-1 items-center ${!isLinkedInConnected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Linkedin className={`h-5 w-5 mr-2 ${
                  dataSource === 'linkedin' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="space-y-1">
                  <p className="font-medium">Use LinkedIn Data</p>
                  <p className="text-sm text-muted-foreground">
                    {isLinkedInConnected
                      ? `Using "${linkedInProfile?.name || 'Your'}" LinkedIn profile`
                      : "LinkedIn not connected - please connect your profile"
                    }
                  </p>
                </div>
              </Label>
            </div>
            
            {/* Both Option */}
            <div className={`flex items-center space-x-2 rounded-md border p-4 ${
              dataSource === 'both' ? 'bg-primary/5 border-primary' : 'border-border'
            } ${(!selectedCv || !isLinkedInConnected) ? 'opacity-50' : ''}`}>
              <RadioGroupItem 
                value="both" 
                id="both" 
                disabled={!selectedCv || !isLinkedInConnected}
              />
              <Label 
                htmlFor="both"
                className={`flex flex-1 items-center ${(!selectedCv || !isLinkedInConnected) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <CheckCircle2 className={`h-5 w-5 mr-2 ${
                  dataSource === 'both' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <div className="space-y-1">
                  <p className="font-medium">Use Both Sources</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCv && isLinkedInConnected
                      ? "Combined data for the most comprehensive cover letter"
                      : "Both CV and LinkedIn required for this option"
                    }
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <Alert className="bg-blue-500/10 border-blue-500/30 mt-4">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <AlertDescription className="text-blue-500 text-sm">
              Using both sources provides the most complete information for generating 
              tailored cover letters.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button
          onClick={onCreateCoverLetter}
          disabled={dataSource === 'none'}
          className="w-full sm:w-auto"
        >
          <CalendarCheck className="mr-2 h-4 w-4" />
          Continue to Cover Letter
        </Button>
      </CardFooter>
    </Card>
  );
}