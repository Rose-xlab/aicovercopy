import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, MessagesSquare, ChevronDown, ChevronUp, FileText, Lightbulb, Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewQuestion {
  id: string;
  question: string;
  suggestedAnswer: string;
  category: string;
  difficulty: string;
}

interface InterviewQuestionListProps {
  questions: InterviewQuestion[];
}

export default function InterviewQuestionList({ questions }: InterviewQuestionListProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  
  // Toggle question expansion
  const toggleQuestion = (id: string) => {
    setOpenQuestion(openQuestion === id ? null : id);
  };
  
  // Copy question and answer to clipboard
  const handleCopy = async (question: InterviewQuestion) => {
    try {
      const textToCopy = `Q: ${question.question}\n\nA: ${question.suggestedAnswer}`;
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  };
  
  // Toggle bookmark for a question
  const toggleBookmark = (id: string) => {
    setBookmarkedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };
  
  // Get badge color based on category
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('technical')) return "bg-blue-100 text-blue-800 border-blue-200";
    if (lowerCategory.includes('behavioral')) return "bg-green-100 text-green-800 border-green-200";
    if (lowerCategory.includes('experience')) return "bg-purple-100 text-purple-800 border-purple-200";
    if (lowerCategory.includes('background')) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (lowerCategory.includes('scenario')) return "bg-orange-100 text-orange-800 border-orange-200";
    if (lowerCategory.includes('culture')) return "bg-pink-100 text-pink-800 border-pink-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };
  
  // Get badge color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    const lowerDifficulty = difficulty.toLowerCase();
    if (lowerDifficulty.includes('basic') || lowerDifficulty.includes('easy')) 
      return "bg-green-100 text-green-800 border-green-200";
    if (lowerDifficulty.includes('intermediate') || lowerDifficulty.includes('medium')) 
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (lowerDifficulty.includes('advanced') || lowerDifficulty.includes('hard')) 
      return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className={cn(
          "transition-all duration-200",
          openQuestion === question.id ? "border-primary/50 shadow-md" : "",
          bookmarkedQuestions.includes(question.id) ? "border-l-4 border-l-yellow-400" : ""
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <MessagesSquare className="h-4 w-4 mr-2 text-primary" />
                Question {index + 1}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor(question.category)}>
                  {question.category}
                </Badge>
                
                <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => toggleBookmark(question.id)}
                >
                  {bookmarkedQuestions.includes(question.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <Collapsible open={openQuestion === question.id}>
              <div className="text-base font-medium mb-2">
                {question.question}
              </div>
              
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full justify-between mt-2"
                >
                  <span>{openQuestion === question.id ? "Hide Answer" : "Show Answer"}</span>
                  {openQuestion === question.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    <h3 className="font-medium">Suggested Answer</h3>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 ml-auto"
                      onClick={() => handleCopy(question)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="whitespace-pre-line text-sm">
                    {question.suggestedAnswer}
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-md p-3 text-sm border border-blue-100">
                  <div className="flex items-center mb-1">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    <h3 className="font-medium text-blue-800">Tips for this question</h3>
                  </div>
                  <ul className="pl-6 space-y-1 text-blue-700 list-disc">
                    <li>Focus on concrete examples from your past experience</li>
                    <li>Keep your answer concise and structured</li>
                    <li>Highlight the skills relevant to the job description</li>
                    <li>Practice this answer until it feels natural, not memorized</li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}