// src/app/dashboard/handyman/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, CalendarCheck, DollarSign, Settings2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data for handyman dashboard
const mockAppointments = [
  { id: 'apt1', service: 'Plumbing - Leaky Faucet', customer: 'Alice Wonderland', status: 'Scheduled', date: '2023-10-28, 10:00 AM', earnings: 75 },
  { id: 'apt2', service: 'Electrical - Install Ceiling Fan', customer: 'Bob The Builder', status: 'Pending Confirmation', date: '2023-10-29, 02:00 PM', earnings: 120 },
  { id: 'apt3', service: 'Painting - Living Room', customer: 'Charlie Brown', status: 'Completed', date: '2023-09-15', earnings: 350 },
];

export default function HandymanDashboardPage() {
  const totalEarnings = mockAppointments.filter(apt => apt.status === 'Completed').reduce((sum, apt) => sum + apt.earnings, 0);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <UserCog className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Handyman Dashboard</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Manage your services, appointments, earnings, and profile.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="text-accent"/>My Services</CardTitle>
            <CardDescription>Manage the services you offer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Add new services, update pricing, and set your availability.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/services">Manage Services</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Total Earnings</CardTitle>
            <CardDescription>Your earnings from completed jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Based on completed appointments.</p>
          </CardContent>
           <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/earnings">View Earnings Details</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="text-muted-foreground"/>Profile & Settings</CardTitle>
            <CardDescription>Update your public profile and account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Keep your information up-to-date for customers.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/profile">Edit Profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck className="text-primary" /> Upcoming Appointments & Requests</CardTitle>
          <CardDescription>Manage your schedule and respond to new service requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockAppointments.length > 0 ? mockAppointments.map((apt, index) => (
            <div key={apt.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-semibold">{apt.service}</h3>
                    <p className="text-sm text-muted-foreground">Customer: {apt.customer}</p>
                    <p className="text-sm text-muted-foreground">Date: {apt.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <Badge variant={
                        apt.status === 'Completed' ? 'default' : 
                        apt.status === 'Scheduled' ? 'secondary' : 
                        'outline'
                      } className="mt-2 sm:mt-0 self-start sm:self-end bg-primary text-primary-foreground">
                        {apt.status}
                      </Badge>
                      <p className="text-sm font-medium text-green-600">Est. Earning: ${apt.earnings}</p>
                  </div>
                </div>
                 <div className="mt-3 flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => console.log('View details for appointment:', apt.id)}>View Details</Button>
                    {apt.status === 'Pending Confirmation' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-green-600" onClick={() => console.log('Confirm appointment:', apt.id)}>Confirm</Button>
                    }
                     {apt.status !== 'Completed' && apt.status !== 'Cancelled' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => console.log('Cancel/Decline appointment:', apt.id)}>Cancel/Decline</Button>
                    }
                </div>
              </div>
              {index < mockAppointments.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            <p className="text-muted-foreground">You have no upcoming appointments or new requests.</p>
          )}
        </CardContent>
         <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('View full schedule clicked')}>
                <CalendarCheck className="mr-2 h-4 w-4"/> View Full Schedule (Placeholder)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
