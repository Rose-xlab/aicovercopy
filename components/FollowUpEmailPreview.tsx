"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FollowUpEmailGenerationResult } from "@/types/follow-up";
import { AlertCircle, Check, Copy, Edit, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FollowUpEmailPreviewProps {
  email: FollowUpEmailGenerationResult;
  isEditing: boolean;
  onEdit: (field: keyof FollowUpEmailGenerationResult, value: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
}

export function FollowUpEmailPreview({
  email,
  isEditing,
  onEdit,
  onToggleEdit,
  onSave
}: FollowUpEmailPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleCopyField = async (field: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedField(field);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: `${field} copied to clipboard`,
        variant: "default",
      });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Email Subject */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="subject" className="text-base">Subject Line</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => handleCopyField('Subject', email.subject)}
          >
            {copiedField === 'Subject' ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copy
          </Button>
        </div>
        
        {isEditing ? (
          <Input
            id="subject"
            value={email.subject}
            onChange={(e) => onEdit('subject', e.target.value)}
          />
        ) : (
          <div className="p-3 bg-muted rounded-md border text-sm">
            {email.subject}
          </div>
        )}
      </div>
      
      {/* Email Greeting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="greeting" className="text-base">Greeting</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => handleCopyField('Greeting', email.greeting)}
          >
            {copiedField === 'Greeting' ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copy
          </Button>
        </div>
        
        {isEditing ? (
          <Input
            id="greeting"
            value={email.greeting}
            onChange={(e) => onEdit('greeting', e.target.value)}
          />
        ) : (
          <div className="p-3 bg-muted rounded-md border text-sm">
            {email.greeting}
          </div>
        )}
      </div>
      
      {/* Email Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body" className="text-base">Email Body</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => handleCopyField('Body', email.body)}
          >
            {copiedField === 'Body' ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copy
          </Button>
        </div>
        
        {isEditing ? (
          <Textarea
            id="body"
            value={email.body}
            onChange={(e) => onEdit('body', e.target.value)}
            className="min-h-[200px]"
          />
        ) : (
          <div className="p-3 bg-muted rounded-md border text-sm whitespace-pre-line">
            {email.body}
          </div>
        )}
      </div>
      
      {/* Email Signature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signature" className="text-base">Signature</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => handleCopyField('Signature', email.signature)}
          >
            {copiedField === 'Signature' ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copy
          </Button>
        </div>
        
        {isEditing ? (
          <Input
            id="signature"
            value={email.signature}
            onChange={(e) => onEdit('signature', e.target.value)}
          />
        ) : (
          <div className="p-3 bg-muted rounded-md border text-sm">
            {email.signature}
          </div>
        )}
      </div>
      
      {/* AI Suggestions */}
      {email.suggestions && email.suggestions.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex">
              <Lightbulb className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Personalization Suggestions</h4>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc pl-4">
                  {email.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Edit/Save Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={isEditing ? onSave : onToggleEdit}
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}