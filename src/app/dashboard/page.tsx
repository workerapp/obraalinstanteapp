// src/app/dashboard/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, User, Settings } from 'lucide-react';
import Link from 'next/link';

// This page could redirect based on user role, or show a generic dashboard.
// For now, it's a simple placeholder.

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <LayoutDashboard className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Your Dashboard</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Manage your services, requests, and account settings.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <User className="text-accent" /> My Profile (Placeholder)
            </CardTitle>
            <CardDescription>View and update your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Go to Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Settings className="text-accent" /> Account Settings (Placeholder)
            </CardTitle>
            <CardDescription>Manage your account preferences and security.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
        
        {/* Example role-specific navigation (would be conditional in real app) */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
             Customer Dashboard (Placeholder)
            </CardTitle>
            <CardDescription>View your service requests and history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/customer">Customer View</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              Handyman Dashboard (Placeholder)
            </CardTitle>
            <CardDescription>Manage your offered services and appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/handyman">Handyman View</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
       <p className="text-center text-muted-foreground mt-8">
        Note: This is a generic dashboard. In a real application, content would be tailored to your role (Customer or Handyman).
      </p>
    </div>
  );
}
