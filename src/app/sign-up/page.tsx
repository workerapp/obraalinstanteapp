// src/app/sign-up/page.tsx
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import SignUpForm from '@/components/auth/sign-up-form';
import AuthCard from '@/components/auth/auth-card';
import { UserPlus, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to the appropriate dashboard if user is logged in
      const redirectPath = user.role === 'admin' 
        ? '/admin/overview' 
        : user.role === 'handyman' 
        ? '/dashboard/handyman' 
        : user.role === 'supplier'
        ? '/dashboard/supplier'
        : '/dashboard/customer';
      router.replace(redirectPath);
    }
  }, [user, loading, router]);
  
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
        title="Crea una Cuenta"
        description="Únete a Obra al Instante como cliente u operario."
        icon={<UserPlus className="h-8 w-8 text-primary" />}
        footerText="¿Ya tienes una cuenta?"
        footerLink="/sign-in"
        footerLinkText="Inicia Sesión"
      >
        <SignUpForm />
      </AuthCard>
    </div>
  );
}
