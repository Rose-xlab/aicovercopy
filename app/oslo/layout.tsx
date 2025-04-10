"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Users,
  CreditCard, 
  Menu, 
  LayoutDashboard, 
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
  LayoutTemplate,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOsloAuth } from "@/hooks/useOsloAuth";
import { AuthGuard } from "@/components/oslo/AuthGuard";

interface OsloLayoutProps {
  children: React.ReactNode;
}

export default function OsloLayout({ children }: OsloLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useOsloAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Navigation items for admin dashboard
  const navItems = [
    {
      title: "Dashboard",
      href: "/oslo",
      icon: LayoutDashboard,
    },
    {
      title: "Users", 
      href: "/oslo/users",
      icon: Users,
    },
    {
      title: "Subscriptions",
      href: "/oslo/subscriptions",
      icon: CreditCard,
    },
    
    {
      title: "Settings",
      href: "/oslo/settings",
      icon: Settings,
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
    <AuthGuard>
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
                    <div className="flex items-center justify-between h-16 border-b px-4 bg-teal-700">
                      <Link href="/oslo" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
                        <Shield className="h-6 w-6 text-white mr-2" />
                        <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="text-white hover:text-teal-200">
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
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              signOut();
                              setIsMobileOpen(false);
                            }}  
                          >
                            <LogOut className="mr-2 h-5 w-5" />
                            Sign Out
                          </Button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-teal-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">Admin</h1>
            </div>
            <div className="w-10"></div> {/* Placeholder for alignment */}
          </div>
        </header>

        {/* Desktop Layout */}
        <div className="flex-1 flex">
          {/* Sidebar Navigation - Desktop Only (Hidden on mobile/small screens) */}
          <aside 
            className={cn(
              "hidden lg:flex h-screen flex-col border-r fixed transition-all duration-300 ease-in-out bg-white shadow-sm z-30",
              isCollapsed ? "w-16" : "w-64"
            )}
          >
            <div className={cn(
              "flex h-16 items-center border-b px-4 bg-teal-700",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <Link href="/oslo" className="flex items-center">
                  <Shield className="h-6 w-6 text-white mr-2" />
                  <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                </Link>
              )}
              {isCollapsed && (
                <Shield className="h-6 w-6 text-white" />
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn("p-0 h-8 w-8 text-white hover:text-teal-200 hover:bg-teal-600", isCollapsed ? "ml-0" : "ml-2")}
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
                  
                  {/* Sign Out Button */}
                  <li>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-full h-10 text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                            onClick={signOut}
                          >
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Sign Out</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-800 text-white">
                          Sign Out
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                        onClick={signOut}
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Sign Out
                      </Button>
                    )}
                  </li>
                </TooltipProvider>
              </ul>
            </nav>
            
            {/* User info at bottom */}
            {!isCollapsed && user && (
              <div className="p-4 border-t text-sm">
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            )}
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
            "flex-1 transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:pl-16" : "lg:pl-64"
          )}>
            <div className="min-h-screen">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}