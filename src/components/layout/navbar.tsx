// src/components/layout/navbar.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { Home, Briefcase, Users, LogIn, UserPlus, LayoutDashboard, LogOut, UserCircle, Menu, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth, type AppUser } from '@/hooks/useAuth';
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
  const typedUser = user as AppUser | null;
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const navLinksContent = (isSheetContext: boolean) => (
    <>
      <Button variant="ghost" asChild size="sm" className={`${isSheetContext ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/" className="flex items-center gap-2">
          <Home size={18} /> Inicio
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheetContext ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/services" className="flex items-center gap-2">
          <Briefcase size={18} /> Servicios
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheetContext ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/handymen" className="flex items-center gap-2">
          <Users size={18} /> Operarios
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheetContext ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/suppliers" className="flex items-center gap-2">
          <Package size={18} /> Proveedores
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm" className={`${isSheetContext ? 'w-full justify-start p-2 hover:bg-accent rounded-md text-base' : ''}`}>
        <Link href="/ai-assistant" className="flex items-center gap-2">
          <Sparkles size={18} /> Asistente IA
        </Link>
      </Button>
    </>
  );

  const authLinksContent = (isSheetContext: boolean) => {
    if (authLoading && !typedUser) {
       if (isSheetContext) {
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

    if (typedUser) {
      const dashboardLink = typedUser.role === 'admin' 
        ? '/admin/overview' 
        : typedUser.role === 'handyman' 
        ? '/dashboard/handyman' 
        : typedUser.role === 'supplier'
        ? '/dashboard/supplier'
        : '/dashboard/customer';
        
      if (isSheetContext) { // Mobile logged in
        return (
          <>
            <SheetClose asChild>
              <Link href={dashboardLink} className="flex items-center gap-2 p-2 hover:bg-accent rounded-md text-base">
                <LayoutDashboard size={18} /> Panel
              </Link>
            </SheetClose>
            <Separator className="my-2" />
            <div className="px-2 py-1 text-sm text-muted-foreground font-medium">{typedUser.displayName || typedUser.email}</div>
            <SheetClose asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2 p-2 hover:bg-accent rounded-md text-base">
                <UserCircle size={18} /> Perfil (Ejemplo)
              </Link>
            </SheetClose>
            <Separator className="my-2" />
            <SheetClose asChild>
              <Button
                variant="ghost"
                onClick={signOutUser}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 p-2 text-base"
              >
                <LogOut size={18} className="mr-2" /> Cerrar Sesión
              </Button>
            </SheetClose>
          </>
        );
      } else { // Desktop logged in
        return (
          <>
            <Button variant="ghost" asChild size="sm">
              <Link href={dashboardLink} className="flex items-center gap-1">
                <LayoutDashboard size={16} /> Panel
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 px-2">
                  <UserCircle size={20} />
                  <span className="hidden md:inline text-sm">{typedUser.displayName || typedUser.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{typedUser.displayName || typedUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Perfil (Ejemplo)</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOutUser} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut size={16} className="mr-2" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      }
    } else { // Not logged in
      if (isSheetContext) { // Mobile not logged in
        return (
          <>
            <SheetClose asChild>
              <Button variant="ghost" asChild size="sm" className="w-full justify-start p-2 hover:bg-accent rounded-md text-base" >
                <Link href="/sign-in" className="flex items-center gap-1">
                  <LogIn size={18} /> Iniciar Sesión
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="default" asChild size="sm" className="w-full justify-start p-2 text-base mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/sign-up" className="flex items-center gap-1">
                  <UserPlus size={18} /> Registrarse
                </Link>
              </Button>
            </SheetClose>
          </>
        );
      } else { // Desktop not logged in
        return (
          <>
            <Button variant="ghost" asChild size="sm">
              <Link href="/sign-in" className="flex items-center gap-1">
                <LogIn size={16} /> Iniciar Sesión
              </Link>
            </Button>
            <Button variant="default" asChild size="sm">
              <Link href="/sign-up" className="flex items-center gap-1">
                <UserPlus size={16} /> Registrarse
              </Link>
            </Button>
          </>
        );
      }
    }
  };

  if (!hasMounted) { // This is the skeleton part
    return (
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Image src="/images/icon.png" alt="Obra al Instante Logo" width={32} height={32} priority data-ai-hint="logo simple" />
            <h1 className="hidden md:block text-2xl font-headline font-bold">Obra al Instante</h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Skeleton loaders for auth links */}
            <div className="h-9 w-20 bg-muted/50 rounded-md animate-pulse hidden md:block" />
            <div className="h-9 w-24 bg-muted/50 rounded-md animate-pulse hidden md:block" />
            {/* Mobile menu placeholder */}
            <div className="h-9 w-9 bg-muted/50 rounded-md animate-pulse md:hidden" />
          </div>
        </div>
      </header>
    );
  }

  // This is the main navbar part
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Image src="/images/icon.png" alt="Obra al Instante Logo" width={32} height={32} priority data-ai-hint="logo simple"/>
          <h1 className="hidden md:block text-2xl font-headline font-bold">Obra al Instante</h1>
        </Link>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
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
