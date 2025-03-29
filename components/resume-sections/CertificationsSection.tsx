"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Certification } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  MoveUp,
  MoveDown,
  Award,
  ExternalLink,
  ThumbsUp
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ data, onChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [newCertName, setNewCertName] = useState<string>('');
  const [newCertIssuer, setNewCertIssuer] = useState<string>('');
  const [newCertDate, setNewCertDate] = useState<string>('');
  const [newCertExpiryDate, setNewCertExpiryDate] = useState<string>('');
  const [newCertUrl, setNewCertUrl] = useState<string>('');
  const { toast } = useToast();
  
  // Add a new certification
  const addCertification = () => {
    if (!newCertName.trim() || !newCertIssuer.trim() || !newCertDate.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in the name, issuer, and date fields",
        variant: "destructive",
      });
      return;
    }
    
    const newCertification: Certification = {
      id: crypto.randomUUID(),
      name: newCertName.trim(),
      issuer: newCertIssuer.trim(),
      date: newCertDate.trim(),
      expiryDate: newCertExpiryDate.trim() || undefined,
      url: newCertUrl.trim() || undefined
    };
    
    const updatedData = [...data, newCertification];
    onChange(updatedData);
    
    // Reset input fields
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertDate('');
    setNewCertExpiryDate('');
    setNewCertUrl('');
  };
  
  // Delete a certification
  const deleteCertification = (id: string) => {
    const updatedData = data.filter(cert => cert.id !== id);
    onChange(updatedData);
  };
  
  // Move certification up in the list
  const moveCertification = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(cert => cert.id === id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === data.length - 1)) {
      return; // Already at the top/bottom
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedData = [...data];
    
    // Swap positions
    [updatedData[index], updatedData[newIndex]] = [updatedData[newIndex], updatedData[index]];
    
    onChange(updatedData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Certifications</h3>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cert-name">Certification Name*</Label>
                <Input
                  id="cert-name"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  placeholder="AWS Certified Solutions Architect, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cert-issuer">Issuing Organization*</Label>
                <Input
                  id="cert-issuer"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  placeholder="Amazon Web Services, Coursera, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cert-date">Date Issued*</Label>
                <Input
                  id="cert-date"
                  value={newCertDate}
                  onChange={(e) => setNewCertDate(e.target.value)}
                  placeholder="YYYY-MM"
                />
                <p className="text-xs text-muted-foreground">Format: YYYY-MM (e.g., 2022-03)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cert-expiry">Expiry Date (optional)</Label>
                <Input
                  id="cert-expiry"
                  value={newCertExpiryDate}
                  onChange={(e) => setNewCertExpiryDate(e.target.value)}
                  placeholder="YYYY-MM"
                />
                <p className="text-xs text-muted-foreground">Leave blank if no expiration</p>
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cert-url">Certificate URL (optional)</Label>
                <Input
                  id="cert-url"
                  value={newCertUrl}
                  onChange={(e) => setNewCertUrl(e.target.value)}
                  placeholder="https://credly.com/badges/..."
                />
              </div>
            </div>
            
            <Button onClick={addCertification}>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3">
              <Award className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-medium text-lg">No certifications added</h3>
              <p className="text-sm text-muted-foreground">
                Add your certifications to showcase your validated skills and knowledge.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((cert, index) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{cert.name}</h4>
                      {cert.url && (
                        <a 
                          href={cert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cert.issuer}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Issued: {cert.date}</span>
                      {cert.expiryDate && (
                        <Badge variant="outline" className="text-xs">
                          Expires: {cert.expiryDate}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {index > 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveCertification(cert.id, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < data.length - 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => moveCertification(cert.id, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteCertification(cert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert className="bg-muted">
        <ThumbsUp className="h-4 w-4" />
        <AlertDescription>
          Pro tip: Include certifications that are relevant to your target position and list them in order of importance.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CertificationsSection;