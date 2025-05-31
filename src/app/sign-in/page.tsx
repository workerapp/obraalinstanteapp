// src/app/sign-in/page.tsx
import SignInForm from '@/components/auth/sign-in-form';
import AuthCard from '@/components/auth/auth-card';
import { LogIn } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12">
      <AuthCard
        title="Sign In to Manitas Listas"
        description="Access your account to manage services and requests."
        icon={<LogIn className="h-8 w-8 text-primary" />}
        footerText="Don't have an account?"
        footerLink="/sign-up"
        footerLinkText="Sign Up"
      >
        <SignInForm />
      </AuthCard>
    </div>
  );
}
