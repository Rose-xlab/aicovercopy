import { redirect } from 'next/navigation';
import { useAuth } from "@/lib/hooks/useAuth";

export default async function CoverLetterPage({
  params,
}: {
  params: { id: string };
}) {
 const { user } = useAuth();

  if (!user) {
    return redirect('/login');
  }

  // Redirect to the preview page
  return redirect(`/dashboard/cover-letters/${params.id}/preview`);
}

// This ensures the page is dynamic and not statically generated
export const dynamic = 'force-dynamic';
