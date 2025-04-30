'use client'

import { useState, useEffect } from 'react'
import moment from 'moment'
import type { CoverLetter } from '@/types/cover-letter'
import { FileText, Clock, Eye, Pencil, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Props {
  coverLetter: CoverLetter
}

export default function RecentCoverLetter({ coverLetter }: Props) {
  const [title, setTitle] = useState<string | null>(null)
  const [timeAgo, setTimeAgo] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setTitle(`${coverLetter.job_title ?? 'position'} at ${coverLetter.company_name || 'company'}`)
    setTimeAgo(moment(coverLetter.updated_at || coverLetter.created_at).fromNow())
  }, [coverLetter])

  const handleEdit = () => {
    router.push(`/cover-letters/${coverLetter.id}/edit`)
  }

  const handleView = () => {
    router.push(`/cover-letters/${coverLetter.id}`)
  }

  const handleDownload = () => {
    // Assuming you have an API route to download the cover letter
    const link = document.createElement('a')
    link.href = `/api/cover-letters/${coverLetter.id}/download`
    link.download = `${coverLetter.job_title}-cover-letter.pdf`
    link.click()
  }

  return (
    <div key={coverLetter.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex items-start">
        <div className="bg-primary/10 p-2 rounded mr-3 mt-1">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
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
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>
    </div>
  )
}
