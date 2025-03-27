"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Copy, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function DemoPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Empty job description",
        description: "Please enter a job description to generate a cover letter.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    // Simulate API call with timeout
    setTimeout(() => {
      const sampleLetter = `
Olav Nordmann
Osloveien 123
0123 Oslo
Tlf: 912 34 567
E-post: olav.nordmann@epost.no

[DATO]

[BEDRIFT]
[ADRESSE]
[POSTNUMMER STED]

SØKNAD OM STILLING SOM [STILLINGSTITTEL]

Jeg søker med dette på stillingen som [STILLINGSTITTEL] som jeg så annonsert på [KILDE]. Med min bakgrunn innen [RELEVANT ERFARING] og stor interesse for [RELEVANT FAGOMRÅDE], mener jeg at jeg kan bidra positivt til [BEDRIFTENS NAVN].

Jeg har [X] års erfaring fra [RELEVANTE ARBEIDSOMRÅDER] og har opparbeidet meg solid kompetanse innen [RELEVANTE FERDIGHETER]. I min nåværende stilling hos [NÅVÆRENDE ARBEIDSGIVER] har jeg [KONKRET EKSEMPEL PÅ RELEVANT ARBEIDSERFARING], noe som har gitt meg verdifull innsikt i [RELEVANT ERFARING FOR NY STILLING].

Mine kolleger beskriver meg som [PERSONLIGE EGENSKAPER] og jeg trives godt med å [RELEVANTE ARBEIDSOPPGAVER]. Jeg er spesielt motivert for denne stillingen fordi [SPESIFIKK MOTIVASJON].

Jeg håper å få muligheten til å diskutere hvordan min kompetanse og erfaring kan være verdifull for [BEDRIFTENS NAVN]. Jeg kan kontaktes på telefon 912 34 567 eller e-post olav.nordmann@epost.no.

Med vennlig hilsen,
Olav Nordmann

---
Dette er en demo-versjon. Opprett en konto for å få tilgang til personaliserte søknadsbrev basert på din egen profil og CV!
      `;

      setGeneratedLetter(sampleLetter);
      setGenerating(false);
    }, 1500);
  };

  const handleCopy = async () => {
    if (!generatedLetter) return;
    
    await navigator.clipboard.writeText(generatedLetter);
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center">
        <Link href="/">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Cover Letter Demo</h1>
          <p className="text-muted-foreground">Try our cover letter generator with limited features</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Enter a job description to generate a sample cover letter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[300px]"
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerate} 
              disabled={generating || !jobDescription.trim()}
              className="w-full"
            >
              {generating ? "Generating..." : "Generate Sample Cover Letter"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Cover Letter</CardTitle>
            <CardDescription>
              This is a sample cover letter based on the job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedLetter}
              readOnly
              placeholder="Your generated cover letter will appear here..."
              className="min-h-[300px] font-mono"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!generatedLetter}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            
            <Button asChild>
              <Link href="/auth/register">
                Create Account for Full Features
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-8 border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Get Full Access to Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Personalized Cover Letters</h3>
              <p className="text-sm text-muted-foreground">
                Tailored to your specific skills and experience from your profile
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Multiple Export Options</h3>
              <p className="text-sm text-muted-foreground">
                Download your cover letters in PDF, Word, or text formats
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Save & Manage Cover Letters</h3>
              <p className="text-sm text-muted-foreground">
                Store your cover letters and access them whenever you need
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/auth/register">Sign Up Free</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}