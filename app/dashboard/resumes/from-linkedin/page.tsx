// app/dashboard/resumes/from-linkedin/page.tsx
import { LinkedInToResumeGenerator } from "@/components/LinkedInToResumeGenerator";

export default function LinkedInResumeImport() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Resume from LinkedIn</h1>
      <p className="text-center text-muted-foreground mb-8">
        Import your professional experience from LinkedIn to create a complete resume
      </p>
      
      <LinkedInToResumeGenerator />
    </div>
  );
}