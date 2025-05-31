// src/components/layout/navbar.tsx
"use client";

import Link from 'next/link';
import { Home, Wrench, Users, LogIn, UserPlus, Sparkles, LayoutDashboard, LogOut, Briefcase, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth'; // Import the real useAuth hook
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function Navbar() {
  const { user, signOutUser, loading: authLoading } = useAuth(); // Use the real auth hook

  // Display skeleton while auth state is loading to prevent hydration mismatches or UI flicker
  if (authLoading) {
    return (
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Wrench className="h-8 w-8" />
            <h1 className="text-2xl font-headline font-bold">Manitas Listas</h1>
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
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
        <nav className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" asChild size="sm">
            <Link href="/" className="flex items-center gap-1">
              <Home size={16} /> Home
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/services" className="flex items-center gap-1">
              <Briefcase size={16} /> Services
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/handymen" className="flex items-center gap-1">
              <Users size={16} /> Handymen
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/ai-assistant" className="flex items-center gap-1">
              <Sparkles size={16} /> AI Assistant
            </Link>
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1 md:mx-2" />

          {user ? (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/dashboard" className="flex items-center gap-1">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 px-2">
                    <UserCircle size={20} /> 
                    <span className="hidden md:inline text-sm">{user.displayName || user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Link href="/dashboard/profile">Profile (Placeholder)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOutUser} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut size={16} className="mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/sign-in" className="flex items-center gap-1">
                  <LogIn size={16} /> Sign In
                </Link>
              </Button>
              <Button variant="default" asChild size="sm">
                <Link href="/sign-up" className="flex items-center gap-1">
                  <UserPlus size={16} /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
