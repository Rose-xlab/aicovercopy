//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\dashboard\cover-letters\components\RecentCoverLetter.tsx
"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import type { CoverLetter } from "@/types/cover-letter";
import { FileText, Clock, Eye, Pencil, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import DownloadCoverLetter from "./DownloadCoverletter";

interface Props {
  coverLetter: CoverLetter;
}

export default function RecentCoverLetter({ coverLetter }: Props) {
  const [title, setTitle] = useState<string | null>(null);
  const [fullTitle, setFullTitle] = useState<string>("");
  // const [timeAgo, setTimeAgo] = useState<string | null>(null)
  const [timeAgo, setTimeAgo] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Create the full title first
    const fullTitle = `${coverLetter.jobTitle ?? "position"} at ${
      coverLetter.companyName || "company"
    }`;
    
    // Create shorter version for display
    const jobTitle = coverLetter.jobTitle || 'Position';
    const companyName = coverLetter.companyName || 'Company';
    
    // Truncate job title and company name if too long
    const shortJobTitle = jobTitle.length > 15 ? jobTitle.substring(0, 15) + '...' : jobTitle;
    const shortCompanyName = companyName.length > 12 ? companyName.substring(0, 12) + '...' : companyName;
    
    const shortTitle = `${shortJobTitle} at ${shortCompanyName}`;
    
    setTitle(shortTitle);
    // Store full title for potential tooltip use
    setFullTitle(fullTitle);
    // setTimeAgo(moment(coverLetter.updated_at || coverLetter.created_at).fromNow())

    const dateToUse = coverLetter.createdAt;
    if (dateToUse) {
      const momentDate = moment(dateToUse);
      if (momentDate.isValid()) {
        // Format: "8 days ago at Jun 3, 2025 10:38 AM"
        const relativeTime = momentDate.fromNow();
        const fullDateTime = momentDate.format("MMM D, YYYY h:mm A");
        setTimeAgo(`${relativeTime} at ${fullDateTime}`);
      } else {
        console.log("Invalid date:", dateToUse);
        setTimeAgo("Unknown time");
      }
    } else {
      console.log("No date available");
      setTimeAgo("No date");
    }
  }, [coverLetter]);

  const handleEdit = () => {
    router.push(`cover-letters/${coverLetter.id}/edit`);
  };

  const handleView = () => {
    router.push(`cover-letters/${coverLetter.id}/preview`);
  };

  return (
    <div
      key={coverLetter.id}
      className="py-4 flex flex-col sm:flex-row justify-between gap-4"
    >
      <div className="flex items-start">
        <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p 
            className="font-medium" 
            title={fullTitle}
          >
            {title}
          </p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 ml-9 sm:ml-0">
        <Button variant="outline" size="sm" onClick={handleView}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        {coverLetter && <DownloadCoverLetter coverLetter={coverLetter} />}
      </div>
    </div>
  );
}
