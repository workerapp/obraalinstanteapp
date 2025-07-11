// src/app/sign-in/page.tsx
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import SignInForm from '@/components/auth/sign-in-form';
import AuthCard from '@/components/auth/auth-card';
import { LogIn, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && user) {
      const defaultRedirectPath = user.role === 'admin' 
        ? '/admin/overview' 
        : user.role === 'professional' 
        ? '/dashboard/professional' 
        : user.role === 'supplier'
        ? '/dashboard/supplier'
        : '/dashboard/customer';
      router.replace(redirect || defaultRedirectPath);
    }
  }, [user, loading, router, redirect]);

  // Show a loading state while checking auth or redirecting
  if (loading || user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12">
      <AuthCard
        title="Inicia Sesión en Obra al Instante"
        description="Accede a tu cuenta para gestionar servicios y solicitudes."
        icon={<LogIn className="h-8 w-8 text-primary" />}
        footerText="¿No tienes una cuenta?"
        footerLink="/sign-up"
        footerLinkText="Regístrate"
      >
        <SignInForm />
      </AuthCard>
    </div>
  );
}
