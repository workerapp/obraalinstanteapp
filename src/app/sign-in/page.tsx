
// src/app/sign-in/page.tsx
import SignInForm from '@/components/auth/sign-in-form';
import AuthCard from '@/components/auth/auth-card';
import { LogIn } from 'lucide-react';

export default function SignInPage() {
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
