"use client";

import { useState, useEffect } from "react";
import { Template } from "@/types/templates";
import { useTemplates } from "@/lib/hooks/useTemplates";
import TemplateCard from "@/components/TemplateCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { sampleCoverLetter } from "@/lib/sample-content";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Number of templates to display per page
const TEMPLATES_PER_PAGE = 4;

export default function TemplateBrowser() {
  const { templates, isLoading, error, fetchTemplates } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Get unique categories from templates - ensure they're always strings
  const categories = ["all", ...Array.from(new Set(templates.map(template => template.category || "uncategorized")))].filter(Boolean);
  
  // Get all unique tags from templates
  const allTags = Array.from(new Set(templates.flatMap(template => template.tags || []))).sort();
  
  // Toggle a tag in the selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Filter templates based on search query, category, and tags
  const filteredTemplates = templates.filter(template => {
    // Match search query
    const matchesSearch = searchQuery === "" || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.tags && template.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    // Match category
    const matchesCategory = selectedCategory === "all" || 
                          template.category === selectedCategory || 
                          (selectedCategory === "uncategorized" && !template.category);
    
    // Match tags (if any selected)
    const matchesTags = selectedTags.length === 0 || 
      (template.tags && selectedTags.every(tag => template.tags?.includes(tag) || false));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedTags]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE);
  
  // Get current page templates
  const currentTemplates = filteredTemplates.slice(
    (currentPage - 1) * TEMPLATES_PER_PAGE,
    currentPage * TEMPLATES_PER_PAGE
  );

  // Handle page navigation
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of component
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    
    // Display up to 5 page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cover Letter Templates</CardTitle>
        <CardDescription>
          Browse our selection of professional cover letter templates
        </CardDescription>
        <div className="flex flex-col sm:flex-row mt-4 items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Tabs 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto overflow-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Tags
                  {selectedTags.length > 0 && (
                    <Badge className="ml-2 h-5 px-1.5">{selectedTags.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-auto">
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2">Loading templates...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading templates: {error}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 px-8">
            {currentTemplates.map((template) => (
              <div key={template.id} className="p-4">
                <TemplateCard
                  template={template}
                  isSelected={false}
                  onSelect={() => {}}
                  coverLetterContent={sampleCoverLetter}
                  showPreviewOnly={true}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {filteredTemplates.length > 0 && totalPages > 1 && (
        <CardFooter className="flex justify-center py-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              
              {getPageNumbers().map(page => (
                <PaginationItem key={page}>
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className="h-9 w-9"
                  >
                    {page}
                  </Button>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}