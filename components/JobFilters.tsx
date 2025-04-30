"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  MapPin, 
  Clock, 
  BriefcaseBusiness, 
  CalendarRange, 
  Sparkles, 
  Filter, 
  XCircle
} from "lucide-react";
import { format } from 'date-fns';

interface JobFiltersProps {
  onFilter: (filters: any) => void;
}

export default function JobFilters({ onFilter }: JobFiltersProps) {
  // Filter states
  const [location, setLocation] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState({
    fullTime: false,
    partTime: false,
    contract: false,
    temporary: false,
    internship: false,
  });
  const [postedWithin, setPostedWithin] = useState<Date | undefined>(undefined);
  const [experienceLevel, setExperienceLevel] = useState([5]); // 0-10 scale
  const [onlyMatchingSkills, setOnlyMatchingSkills] = useState(false);
  const [salary, setSalary] = useState([500000]); // Default salary NOK
  
  // Sectors/industries (simplified)
  const [sectors, setSectors] = useState({
    technology: false,
    healthcare: false,
    finance: false,
    education: false,
    manufacturing: false,
    retail: false,
    government: false,
  });

  const applyFilters = () => {
    // Construct filters object
    const filters = {
      location,
      employmentTypes: Object.entries(employmentTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key),
      postedWithin,
      experienceLevel: experienceLevel[0],
      onlyMatchingSkills,
      salary: salary[0],
      sectors: Object.entries(sectors)
        .filter(([_, value]) => value)
        .map(([key]) => key),
    };
    
    onFilter(filters);
  };

  const resetFilters = () => {
    setLocation("");
    setEmploymentTypes({
      fullTime: false,
      partTime: false,
      contract: false,
      temporary: false,
      internship: false,
    });
    setPostedWithin(undefined);
    setExperienceLevel([5]);
    setOnlyMatchingSkills(false);
    setSalary([500000]);
    setSectors({
      technology: false,
      healthcare: false,
      finance: false,
      education: false,
      manufacturing: false,
      retail: false,
      government: false,
    });
    
    onFilter({});
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location filter */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium">Location</Label>
          <div className="flex">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="City or region"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        
        {/* Employment types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Employment Type</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fullTime" 
                checked={employmentTypes.fullTime} 
                onCheckedChange={(checked) => 
                  setEmploymentTypes({...employmentTypes, fullTime: checked as boolean})
                } 
              />
              <label htmlFor="fullTime" className="text-sm cursor-pointer">Full-time</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="partTime" 
                checked={employmentTypes.partTime} 
                onCheckedChange={(checked) => 
                  setEmploymentTypes({...employmentTypes, partTime: checked as boolean})
                } 
              />
              <label htmlFor="partTime" className="text-sm cursor-pointer">Part-time</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="contract" 
                checked={employmentTypes.contract} 
                onCheckedChange={(checked) => 
                  setEmploymentTypes({...employmentTypes, contract: checked as boolean})
                } 
              />
              <label htmlFor="contract" className="text-sm cursor-pointer">Contract</label>
            </div>
          </div>
        </div>
        
        {/* Date Posted */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Posted</Label>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {postedWithin ? (
                    <span>After {format(postedWithin, 'PPP')}</span>
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={postedWithin}
                  onSelect={setPostedWithin}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Experience Level */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Experience Level</Label>
            <span className="text-sm text-muted-foreground">
              {experienceLevel[0] === 0 ? 'Entry Level' : 
               experienceLevel[0] < 3 ? 'Junior' :
               experienceLevel[0] < 6 ? 'Mid-Level' :
               experienceLevel[0] < 9 ? 'Senior' : 'Expert'}
            </span>
          </div>
          <Slider
            defaultValue={[5]}
            max={10}
            step={1}
            value={experienceLevel}
            onValueChange={setExperienceLevel}
          />
        </div>
        
        {/* Skills Match */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="skills-match"
              checked={onlyMatchingSkills}
              onCheckedChange={setOnlyMatchingSkills}
            />
            <Label htmlFor="skills-match" className="text-sm cursor-pointer">
              Only show jobs matching my skills
            </Label>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          <Button className="w-full" onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button variant="outline" className="w-full" onClick={resetFilters}>
            <XCircle className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}