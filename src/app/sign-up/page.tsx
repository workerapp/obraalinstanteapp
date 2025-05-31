// src/app/sign-up/page.tsx
import SignUpForm from '@/components/auth/sign-up-form';
import AuthCard from '@/components/auth/auth-card';
import { UserPlus } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12">
      <AuthCard
        title="Create an Account"
        description="Join Manitas Listas as a customer or handyman."
        icon={<UserPlus className="h-8 w-8 text-primary" />}
        footerText="Already have an account?"
        footerLink="/sign-in"
        footerLinkText="Sign In"
      >
        <SignUpForm />
      </AuthCard>
    </div>
  );
}
