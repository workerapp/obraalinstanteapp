// src/components/layout/navbar.tsx
"use client";

import Link from 'next/link';
import { Home, Wrench, Users, LogIn, UserPlus, Sparkles, LayoutDashboard, LogOut, Briefcase, UserCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, signOutUser, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const navLinksContent = (isSheet: boolean) => (
    <>
      <Button variant="ghost" asChild size="sm" className={`${isSheet ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/" className="flex items-center gap-2">
          <Home size={18} /> Home
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheet ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/services" className="flex items-center gap-2">
          <Briefcase size={18} /> Services
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheet ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/handymen" className="flex items-center gap-2">
          <Users size={18} /> Handymen
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheet ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/ai-assistant" className="flex items-center gap-2">
          <Sparkles size={18} /> AI Assistant
        </Link>
      </Button>
    </>
  );

  const authLinksContent = (isSheet: boolean) => {
    if (authLoading && !user) { // Show placeholders only if not logged in and auth is loading
       if (isSheet) {
        return (
          <>
            <div className="h-10 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-muted/50 rounded-md animate-pulse mt-2" />
          </>
        );
      }
      return (
        <>
          <div className="h-9 w-24 bg-muted rounded-md animate-pulse hidden md:block" />
          <div className="h-9 w-24 bg-muted rounded-md animate-pulse hidden md:block" />
        </>
      );
    }

    if (user) {
      return (
        <>
          {isSheet ? (
            <>
              <SheetClose asChild>
                <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md text-base">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
              </SheetClose>
              <Separator className="my-2" />
              <div className="px-2 py-1 text-sm text-muted-foreground font-medium">{user.email}</div>
              <SheetClose asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md text-base">
                  <UserCircle size={18} /> Profile (Placeholder)
                </Link>
              </SheetClose>
              <Separator className="my-2" />
               <SheetClose asChild>
                <Button
                  variant="ghost"
                  onClick={signOutUser}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 p-2 text-base"
                >
                  <LogOut size={18} className="mr-2" /> Logout
                </Button>
              </SheetClose>
            </>
          ) : (
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
          )}
        </>
      );
    } else { // Not logged in
      return (
        <>
          <SheetClose asChild={isSheet}>
            <Button variant="ghost" asChild={!isSheet} size="sm" className={`${isSheet ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
              <Link href="/sign-in" className="flex items-center gap-1">
                <LogIn size={isSheet ? 18 : 16} /> Sign In
              </Link>
            </Button>
          </SheetClose>
          <SheetClose asChild={isSheet}>
            <Button variant={isSheet ? 'default' : 'default'} asChild={!isSheet} size="sm" 
                    className={`${isSheet ? 'w-full justify-start p-2 text-base mt-2' : ''} ${isSheet ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '' }`}>
              <Link href="/sign-up" className="flex items-center gap-1">
                <UserPlus size={isSheet ? 18 : 16} /> Sign Up
              </Link>
            </Button>
          </SheetClose>
        </>
      );
    }
  };

  if (!hasMounted) {
    return (
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Wrench className="h-8 w-8" />
            <h1 className="text-2xl font-headline font-bold">Manitas Listas</h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-9 w-20 bg-muted/50 rounded-md animate-pulse hidden md:block" />
            <div className="h-9 w-24 bg-muted/50 rounded-md animate-pulse hidden md:block" />
            <div className="h-9 w-9 bg-muted/50 rounded-md animate-pulse md:hidden" /> {/* Mobile menu placeholder */}
          </div>
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

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-4 pt-10 flex flex-col">
              <nav className="flex flex-col gap-1">
                {navLinksContent(true)}
              </nav>
              <Separator className="my-4" />
              <nav className="flex flex-col gap-1 mt-auto"> {/* Auth links at the bottom */}
                {authLinksContent(true)}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center gap-1 md:gap-2">
            {navLinksContent(false)}
            <Separator orientation="vertical" className="h-6 mx-1 md:mx-2" />
            {authLinksContent(false)}
          </nav>
        )}
      </div>
    </header>
  );
}
