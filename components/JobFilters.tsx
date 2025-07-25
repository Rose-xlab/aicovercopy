//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\JobFilters.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface JobFiltersProps {
  onFilter: (filters: any) => void;
}

export default function JobFilters({ onFilter }: JobFiltersProps) {
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [workplaceTypes, setWorkplaceTypes] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [postedWithin, setPostedWithin] = useState<string>("any");
  const [experienceLevel, setExperienceLevel] = useState<number[]>([0]);

  const handleEmploymentTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setEmploymentTypes([...employmentTypes, type]);
    } else {
      setEmploymentTypes(employmentTypes.filter(t => t !== type));
    }
  };

  const handleWorkplaceTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setWorkplaceTypes([...workplaceTypes, type]);
    } else {
      setWorkplaceTypes(workplaceTypes.filter(t => t !== type));
    }
  };

  const handleDepartmentChange = (dept: string, checked: boolean) => {
    if (checked) {
      setDepartments([...departments, dept]);
    } else {
      setDepartments(departments.filter(d => d !== dept));
    }
  };

  const handleSectorChange = (sector: string, checked: boolean) => {
    if (checked) {
      setSectors([...sectors, sector]);
    } else {
      setSectors(sectors.filter(s => s !== sector));
    }
  };

  const applyFilters = () => {
    onFilter({
      employmentTypes,
      workplaceTypes,
      departments,
      sectors,
      postedWithin: postedWithin === "any" ? "" : postedWithin,
      experienceLevel: experienceLevel[0]
    });
  };

  const clearFilters = () => {
    setEmploymentTypes([]);
    setWorkplaceTypes([]);
    setDepartments([]);
    setSectors([]);
    setPostedWithin("any");
    setExperienceLevel([0]);
    onFilter({});
  };

  const hasActiveFilters = employmentTypes.length > 0 || 
                          workplaceTypes.length > 0 || 
                          departments.length > 0 || 
                          sectors.length > 0 ||
                          postedWithin !== "any" || 
                          experienceLevel[0] > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Employment Type */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Employment Type</Label>
          <div className="space-y-2">
            {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`employment-${type}`}
                  checked={employmentTypes.includes(type)}
                  onCheckedChange={(checked) => handleEmploymentTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`employment-${type}`} className="text-sm">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Workplace Type */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Workplace Type</Label>
          <div className="space-y-2">
            {["Remote", "On-site", "Hybrid"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`workplace-${type}`}
                  checked={workplaceTypes.includes(type)}
                  onCheckedChange={(checked) => handleWorkplaceTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`workplace-${type}`} className="text-sm">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Departments</Label>
          <div className="space-y-2">
            {["Engineering", "Product", "Design", "Marketing", "Sales", "Data"].map((dept) => (
              <div key={dept} className="flex items-center space-x-2">
                <Checkbox
                  id={`dept-${dept}`}
                  checked={departments.includes(dept)}
                  onCheckedChange={(checked) => handleDepartmentChange(dept, checked as boolean)}
                />
                <Label htmlFor={`dept-${dept}`} className="text-sm">
                  {dept}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Sectors/Industries */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Industries</Label>
          <div className="space-y-2">
            {["E-commerce", "Fintech", "Travel", "Cryptocurrency", "Food Delivery", "Design Tools"].map((sector) => (
              <div key={sector} className="flex items-center space-x-2">
                <Checkbox
                  id={`sector-${sector}`}
                  checked={sectors.includes(sector)}
                  onCheckedChange={(checked) => handleSectorChange(sector, checked as boolean)}
                />
                <Label htmlFor={`sector-${sector}`} className="text-sm">
                  {sector}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Posted Within */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Posted Within</Label>
          <Select value={postedWithin} onValueChange={setPostedWithin}>
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last week</SelectItem>
              <SelectItem value="14">Last 2 weeks</SelectItem>
              <SelectItem value="30">Last month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Experience Level: {experienceLevel[0]} years
          </Label>
          <Slider
            value={experienceLevel}
            onValueChange={setExperienceLevel}
            max={10}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Entry</span>
            <span>Senior</span>
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button onClick={applyFilters} className="w-full" size="sm">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}