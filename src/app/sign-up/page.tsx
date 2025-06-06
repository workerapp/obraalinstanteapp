
// src/app/sign-up/page.tsx
import SignUpForm from '@/components/auth/sign-up-form';
import AuthCard from '@/components/auth/auth-card';
import { UserPlus } from 'lucide-react';

export default function SignUpPage() {
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
