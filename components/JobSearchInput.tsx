//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\JobSearchInput.tsx

"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, Building, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface JobSearchInputProps {
  onSearch: (query: string, location?: string, filters?: any) => void;
  isSearching: boolean;
}

// Available companies for filtering (updated with working companies)
const COMPANIES = [
  "Buffer", "GitLab", "InVision", "Lattice", "Mixpanel", 
  "Segment", "Grammarly", "Docker", "Hashicorp", "Automattic"
];

// Available industries for filtering (updated)
const INDUSTRIES = [
  "Social Media", "Developer Tools", "Design Tools", "HR Tech", "Analytics",
  "Data", "Writing Tools", "Infrastructure", "Web Services"
];

export default function JobSearchInput({ onSearch, isSearching }: JobSearchInputProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), location.trim() || undefined, {
        industries: selectedIndustries,
        companies: selectedCompanies
      });
    }
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    if (checked) {
      setSelectedIndustries([...selectedIndustries, industry]);
    } else {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    }
  };

  const handleCompanyChange = (company: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, company]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(c => c !== company));
    }
  };

  const clearFilters = () => {
    setSelectedIndustries([]);
    setSelectedCompanies([]);
  };

  const hasFilters = selectedIndustries.length > 0 || selectedCompanies.length > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search jobs (e.g., Frontend Developer, Data Scientist, Product Manager)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
            
            <div className="sm:w-64 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!query.trim() || isSearching}
              className="sm:w-auto w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Advanced Filters
                  {hasFilters && (
                    <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                      {selectedIndustries.length + selectedCompanies.length}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear filters
                </Button>
              )}
            </div>
            
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industries */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Industries</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {INDUSTRIES.map((industry) => (
                      <div key={industry} className="flex items-center space-x-2">
                        <Checkbox
                          id={`industry-${industry}`}
                          checked={selectedIndustries.includes(industry)}
                          onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                        />
                        <Label htmlFor={`industry-${industry}`} className="text-xs leading-tight">
                          {industry}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Companies</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {COMPANIES.map((company) => (
                      <div key={company} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company}`}
                          checked={selectedCompanies.includes(company)}
                          onCheckedChange={(checked) => handleCompanyChange(company, checked as boolean)}
                        />
                        <Label htmlFor={`company-${company}`} className="text-xs">
                          {company}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Info about search */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <Building className="inline h-4 w-4 mr-1" />
              Searching across {COMPANIES.length} companies powered by Greenhouse
            </p>
            {hasFilters && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {selectedIndustries.map(industry => (
                  <Badge key={industry} variant="secondary" className="text-xs">
                    {industry}
                  </Badge>
                ))}
                {selectedCompanies.map(company => (
                  <Badge key={company} variant="outline" className="text-xs">
                    {company}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}