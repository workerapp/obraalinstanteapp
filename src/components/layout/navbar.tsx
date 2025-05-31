// src/components/layout/navbar.tsx
"use client";

import Link from 'next/link';
import { Home, Wrench, Users, LogIn, UserPlus, Sparkles, LayoutDashboard, LogOut, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react'; // For mock auth state

// Mock auth state - replace with actual auth context/hook
interface User {
  name: string;
  role: 'customer' | 'handyman';
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mock user login after a delay for demonstration
    // In a real app, this would come from an auth provider
    // const mockUser = localStorage.getItem("mockUser");
    // if (mockUser) setUser(JSON.parse(mockUser));
  }, []);

  // Mock login/logout for demo
  const handleLogin = () => {
    const demoUser = { name: 'Demo User', role: 'customer' as const };
    setUser(demoUser);
    // localStorage.setItem("mockUser", JSON.stringify(demoUser));
  };
  const handleLogout = () => {
    setUser(null);
    // localStorage.removeItem("mockUser");
  };
  
  if (!mounted) {
    return ( // Return a placeholder or skeleton navbar during SSR/initial client render to avoid hydration issues
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Wrench className="h-8 w-8" />
            <h1 className="text-2xl font-headline font-bold">Manitas Listas</h1>
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <div className="h-6 w-16 bg-muted rounded-md animate-pulse"></div>
            <div className="h-6 w-20 bg-muted rounded-md animate-pulse"></div>
            <div className="h-6 w-24 bg-muted rounded-md animate-pulse"></div>
          </nav>
        </div>
      </header>
    );
  }


  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Wrench className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">Manitas Listas</h1>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home size={18} /> Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/services" className="flex items-center gap-1">
              <Briefcase size={18} /> Services
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/handymen" className="flex items-center gap-1">
              <Users size={18} /> Handymen
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/ai-assistant" className="flex items-center gap-1">
              <Sparkles size={18} /> AI Assistant
            </Link>
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />

          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1">
                <LogOut size={18} /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in" className="flex items-center gap-1">
                  <LogIn size={18} /> Sign In
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/sign-up" className="flex items-center gap-1">
                  <UserPlus size={18} /> Sign Up
                </Link>
              </Button>
               {/* Temporary button to simulate login */}
              <Button variant="secondary" onClick={handleLogin} className="ml-2">
                Login (Demo)
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
