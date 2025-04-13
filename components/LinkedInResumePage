"use client";

import { useState } from "react";
import { LinkedInResumeSelector } from "./LinkedInResumeSelector";

export default function LinkedInResumePage() {
  const [selectedResume, setSelectedResume] = useState<any>(null);
  
  // These functions are now in the client component with the "use client" directive
  const handleResumeSelect = (resumeId: string, resumeData: any) => {
    setSelectedResume(resumeData);
    // Additional logic...
  };
  
  const handleCancel = () => {
    // Handle cancel logic
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Select LinkedIn Resume</h1>
      
      {/* Now we pass the callback functions from the client component */}
      <LinkedInResumeSelector 
        onSelect={handleResumeSelect}
        onCancel={handleCancel}
      />
      
      {selectedResume && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Selected Resume</h2>
          {/* Display selected resume details */}
          <pre className="bg-gray-100 p-4 rounded-lg">
            {JSON.stringify(selectedResume, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}