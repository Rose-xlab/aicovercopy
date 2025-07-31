import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export default async function CoverLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In server components, we need to use Supabase directly instead of useAuth hook
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/login');
  }

  // Await the params to get the id
  const { id } = await params;

  // Redirect to the preview page
  return redirect(`/dashboard/cover-letters/${id}/preview`);
}

// This ensures the page is dynamic and not statically generated
export const dynamic = 'force-dynamic';