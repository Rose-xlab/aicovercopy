"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CompanySelectorProps {
  value: string;
  onChange: (company: string) => void;
}

// Popular companies with their Greenhouse board tokens
const POPULAR_COMPANIES = [
  { name: "Shopify", token: "shopify" },
  { name: "Airbnb", token: "airbnb" },
  { name: "Stripe", token: "stripe" },
  { name: "Coinbase", token: "coinbase" },
  { name: "DoorDash", token: "doordash" },
  { name: "Robinhood", token: "robinhood" },
  { name: "Figma", token: "figma" },
  { name: "Discord", token: "discord" },
  { name: "Notion", token: "notion" },
  { name: "Canva", token: "canva" },
  { name: "Slack", token: "slack" },
  { name: "Zoom", token: "zoom" },
  { name: "Twilio", token: "twilio" },
  { name: "GitHub", token: "github" },
  { name: "Dropbox", token: "dropbox" }
];

export default function CompanySelector({ value, onChange }: CompanySelectorProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customToken, setCustomToken] = useState("");

  const handleCompanySelect = (companyToken: string) => {
    if (companyToken === "custom") {
      setCustomMode(true);
      return;
    }
    onChange(companyToken);
    setCustomMode(false);
  };

  const handleCustomSubmit = () => {
    if (customToken.trim()) {
      onChange(customToken.trim());
      setCustomMode(false);
    }
  };

  const selectedCompany = POPULAR_COMPANIES.find(c => c.token === value);

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Building2 className="h-4 w-4" />
          Select Company
        </Label>
        
        {!customMode ? (
          <Select value={value} onValueChange={handleCompanySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a company to search jobs from">
                {selectedCompany ? selectedCompany.name : "Select company..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select company...</SelectItem>
              {POPULAR_COMPANIES.map((company) => (
                <SelectItem key={company.token} value={company.token}>
                  {company.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <span>Other company (enter board token)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Enter company board token (e.g., 'companyname')"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCustomSubmit}
                disabled={!customToken.trim()}
              >
                Use This Token
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCustomMode(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <div className="space-y-2">
            <p>
              <strong>How to find a company's board token:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Visit the company's careers page</li>
              <li>Look for job listings hosted on Greenhouse</li>
              <li>Check the URL format: boards.greenhouse.io/<strong>company-token</strong>/jobs</li>
              <li>The company token is the part after "boards.greenhouse.io/"</li>
            </ol>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs"
              onClick={() => window.open('https://boards.greenhouse.io/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Browse Greenhouse job boards
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}