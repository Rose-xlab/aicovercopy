"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Info, Send } from "lucide-react";
import { FollowUpEmailFormData, FollowUpStyle, FollowUpTone } from "@/types/follow-up";
import { LoadingSpinner } from "./LoadingSpinner";

interface FollowUpEmailFormProps {
  formData: FollowUpEmailFormData;
  onChange: (data: Partial<FollowUpEmailFormData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function FollowUpEmailForm({
  formData,
  onChange,
  onSubmit,
  isSubmitting
}: FollowUpEmailFormProps) {
  const handleInputChange = (field: keyof FollowUpEmailFormData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="e.g. Marketing Manager"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactName">Contact Person (Optional)</Label>
            <Input
              id="contactName"
              value={formData.contactName || ''}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              placeholder="e.g. Hiring Manager, John Smith"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use "Hiring Manager" as default
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="applicationDate">Application Date <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="applicationDate"
                type="date"
                value={formData.applicationDate}
                onChange={(e) => handleInputChange('applicationDate', e.target.value)}
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              When did you submit your application?
            </p>
          </div>
          
          <div>
            <Label htmlFor="followUpStyle">Follow-Up Style</Label>
            <Select 
              value={formData.followUpStyle} 
              onValueChange={(value) => handleInputChange('followUpStyle', value as FollowUpStyle)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle Reminder</SelectItem>
                <SelectItem value="direct">Direct Inquiry</SelectItem>
                <SelectItem value="value-add">Value-Add Approach</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              How you want to approach the follow-up
            </p>
          </div>
          
          <div>
            <Label htmlFor="tone">Tone (Optional)</Label>
            <Select 
              value={formData.tone || 'default'} 
              onValueChange={(value) => handleInputChange('tone', value === 'default' ? '' : value as FollowUpTone)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Professional)</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              The overall tone of your email
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="additionalInfo">
          Updates Since Applying (Optional)
        </Label>
        <Textarea
          id="additionalInfo"
          value={formData.additionalInfo || ''}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          placeholder="e.g. Recently completed a relevant certification, published an article, or made progress on a project"
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Any updates about your qualifications since you applied that would strengthen your candidacy
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="intentToCall"
          checked={formData.intentToCall || false}
          onCheckedChange={(checked) => handleInputChange('intentToCall', checked)}
        />
        <Label htmlFor="intentToCall">
          I plan to follow up with a phone call
        </Label>
      </div>

      {/* Info Card at the bottom of the form */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Follow-Up Email Best Practices</h4>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc pl-4">
                <li>Send your follow-up 1-2 weeks after applying</li>
                <li>Keep it concise and professional (3-4 short paragraphs)</li>
                <li>Refer to your specific application but don't repeat your entire cover letter</li>
                <li>Express continued interest and add any relevant new information</li>
                <li>End with a clear call to action, but remain respectful of the hiring process</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || !formData.jobTitle || !formData.companyName || !formData.applicationDate}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate Follow-Up Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}