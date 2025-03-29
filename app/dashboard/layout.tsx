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
  LayoutTemplate,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Navigation items
  const navItems = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Jobs", 
      href: "/dashboard/jobs",
      icon: Briefcase,
    },
    {
      title: "Cover Letters",
      href: "/dashboard/cover-letters",
      icon: FileOutput,
    },
    {
      title: "Resumes",
      href: "/dashboard/resumes",
      icon: FileSpreadsheet,
    },
    {
      title: "Templates",
      href: "/dashboard/templates",
      icon: LayoutTemplate,
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header - Always visible on mobile and small screens */}
      <header className="border-b sticky top-0 z-40 bg-white shadow-sm lg:hidden">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700 hover:text-teal-600">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[250px] bg-white">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between h-16 border-b px-4 bg-teal-50">
                    <Link href="/" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
                      <FileText className="h-6 w-6 text-teal-600 mr-2" />
                      <h1 className="text-xl font-bold text-gray-800">AI Cover Letter</h1>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="text-gray-700 hover:text-teal-600">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 overflow-auto py-4 bg-white">
                    <ul className="space-y-2 px-2">
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start",
                                pathname === item.href
                                  ? "bg-teal-100 text-teal-700 font-medium hover:bg-teal-200"
                                  : "text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-normal"
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-teal-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">AI Cover Letter</h1>
          </div>
          <div className="w-10"></div> {/* Placeholder for alignment */}
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation - Desktop Only (Hidden on mobile/small screens) */}
        <aside 
          className={cn(
            "hidden lg:flex h-screen flex-col border-r fixed transition-all duration-300 ease-in-out bg-white shadow-sm",
            isCollapsed ? "w-16" : "w-52"
          )}
        >
          <div className={cn(
            "flex h-16 items-center border-b px-4 bg-teal-50",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <Link href="/" className="flex items-center">
                <FileText className="h-6 w-6 text-teal-600 mr-2" />
                <h1 className="text-lg font-bold text-gray-800">AI Cover Letter</h1>
              </Link>
            )}
            {isCollapsed && (
              <FileText className="h-6 w-6 text-teal-600" />
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("p-0 h-8 w-8 text-gray-600 hover:text-teal-600 hover:bg-teal-100", isCollapsed ? "ml-0" : "ml-2")}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-2 bg-white">
            <ul className="space-y-2 px-1">
              <TooltipProvider>
                {navItems.map((item) => (
                  <li key={item.href}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "w-full h-10",
                                pathname === item.href
                                  ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                                  : "text-gray-600 hover:text-teal-600 hover:bg-teal-50"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              <span className="sr-only">{item.title}</span>
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-800 text-white">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link href={item.href}>
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            pathname === item.href
                              ? "bg-teal-100 text-teal-700 font-medium hover:bg-teal-200"
                              : "text-gray-600 hover:text-teal-600 hover:bg-teal-50 font-normal"
                          )}
                        >
                          <item.icon className="mr-2 h-5 w-5" />
                          {item.title}
                        </Button>
                      </Link>
                    )}
                  </li>
                ))}
              </TooltipProvider>
            </ul>
          </nav>
        </aside>

        {/* Toggle button for collapsed sidebar - visible on hover (desktop only) */}
        {isCollapsed && (
          <div className="hidden lg:block fixed left-16 top-16 z-50">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsCollapsed(false)}
              className="h-8 w-8 p-0 rounded-full shadow-md opacity-80 hover:opacity-100 bg-teal-500 hover:bg-teal-600 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out bg-gray-50",
          isCollapsed ? "lg:pl-16" : "lg:pl-52"
        )}>
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}