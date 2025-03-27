"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  User,
  Briefcase, 
  Menu, 
  Home, 
  FileOutput, 
  History
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation items - Settings removed and merged into Profile
  const navItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
        title: "Jobs", // New navigation item
        href: "/dashboard/jobs",
        icon: Briefcase, // Use the Briefcase icon for jobs
      },
    {
      title: "Cover Letters",
      href: "/dashboard/cover-letters",
      icon: FileOutput,
    },
    {
      title: "History",
      href: "/dashboard/history",
      icon: History,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ];

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="border-b sticky top-0 z-40 bg-background md:hidden">
        <div className="flex h-16 items-center px-4">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav 
                navItems={navItems} 
                pathname={pathname} 
                onNavClick={() => setIsMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="ml-4 flex items-center">
            <FileText className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">AI Cover Letter</h1>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card fixed">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/" className="flex items-center">
              <FileText className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-bold">AI Cover Letter</h1>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-2">
            <ul className="space-y-2 px-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        pathname === item.href
                          ? "bg-secondary font-medium"
                          : "font-normal"
                      )}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.title}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* User info and logout button removed - now in Profile page */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-64">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Mobile Navigation Component
function MobileNav({ 
  navItems, 
  pathname, 
  onNavClick 
}: { 
  navItems: { title: string; href: string; icon: any }[]; 
  pathname: string; 
  onNavClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center h-16 border-b px-6">
        <Link href="/" className="flex items-center" onClick={onNavClick}>
          <FileText className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold">AI Cover Letter</h1>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onNavClick}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href
                      ? "bg-secondary font-medium"
                      : "font-normal"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Mobile user info and logout button removed - now in Profile page */}
    </div>
  );
}