// src/components/auth/auth-card.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type React from 'react';
import { Button } from '@/components/ui/button'; // Added this import

interface AuthCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  footerText?: string;
  footerLink?: string;
  footerLinkText?: string;
}

export default function AuthCard({
  icon,
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        {icon && <div className="mx-auto mb-4">{icon}</div>}
        <CardTitle className="text-3xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {(footerText && footerLink && footerLinkText) && (
        <CardFooter className="justify-center text-sm">
          <p className="text-muted-foreground">
            {footerText}{' '}
            <Button variant="link" asChild className="px-1 text-primary hover:underline">
              <Link href={footerLink}>{footerLinkText}</Link>
            </Button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
