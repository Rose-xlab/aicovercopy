//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthContextProvider } from '@/contexts/AuthContext';
// import { AuthProvider } from '@/components/AuthProvider'; // <-- REMOVE THIS LINE
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Resumemate',
  description: 'Create professional resumes, cover letters with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Only use the one context provider we have been debugging */}
        <AuthContextProvider>
          {children}
          <Toaster />
        </AuthContextProvider>
      </body>
    </html>
  );
}