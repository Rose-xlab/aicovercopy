"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Download, 
  Star, 
  Copy, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Calendar, 
  Filter 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for demonstration
const mockLetters = [
  { 
    id: '1', 
    title: 'Marketing Manager at Company A', 
    createdAt: '2023-05-10T14:23:00Z',
    tone: 'professional',
    status: 'completed',
  },
  { 
    id: '2', 
    title: 'Software Developer at Company B', 
    createdAt: '2023-05-08T09:15:00Z',
    tone: 'enthusiastic',
    status: 'completed',
  },
  { 
    id: '3', 
    title: 'Project Coordinator at Company C', 
    createdAt: '2023-05-05T16:45:00Z',
    tone: 'formal',
    status: 'completed',
  },
  { 
    id: '4', 
    title: 'UX Designer at Company D', 
    createdAt: '2023-05-01T11:30:00Z',
    tone: 'professional',
    status: 'completed',
  },
  { 
    id: '5', 
    title: 'Sales Representative at Company E', 
    createdAt: '2023-04-28T13:20:00Z',
    tone: 'enthusiastic',
    status: 'completed',
  },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Filter and sort the letters based on user selections
  const filteredLetters = mockLetters
    .filter(letter => {
      // Apply search filter
      if (searchTerm && !letter.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply type filter
      if (filter !== "all" && letter.tone !== filter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (sortBy === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">View and manage your cover letter history</p>
      </header>

      <Tabs defaultValue="all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Letters</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search letters..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-[250px]"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Tone</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    All Tones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("professional")}>
                    Professional
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("enthusiastic")}>
                    Enthusiastic
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("formal")}>
                    Formal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-6">
              {filteredLetters.length > 0 ? (
                <div className="space-y-4">
                  {filteredLetters.map((letter) => (
                    <div key={letter.id} className="flex flex-col md:flex-row justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start flex-1">
                        <div className="bg-primary/10 p-2 rounded mr-4">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{letter.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(letter.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{letter.tone}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4 md:mt-0 ml-0 md:ml-4">
                        <Button variant="outline" size="sm" className="mr-2">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="mr-2">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              <span>Add to Favorites</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No cover letters found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                    {searchTerm || filter !== "all" 
                      ? "No cover letters match your search criteria. Try adjusting your filters."
                      : "You haven't created any cover letters yet."}
                  </p>
                  <Button asChild>
                    <a href="/dashboard">Create a Cover Letter</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No favorite cover letters</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                  You haven't marked any cover letters as favorites yet. Use the star icon to add letters to your favorites.
                </p>
                <Button variant="outline" asChild>
                  <a href="/dashboard/history">View All Letters</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}