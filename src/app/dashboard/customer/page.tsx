// src/app/dashboard/customer/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, MessageSquarePlus, History, UserCircle } from 'lucide-react';
import Link from 'next/link';

// Mock data for customer dashboard
const mockRequests = [
  { id: 'req1', service: 'Plumbing - Leaky Faucet', status: 'Pending Quote', date: '2023-10-25' },
  { id: 'req2', service: 'Electrical - Install Ceiling Fan', status: 'Scheduled', date: '2023-10-28', handyman: 'John Doe' },
  { id: 'req3', service: 'Painting - Living Room', status: 'Completed', date: '2023-09-15', handyman: 'Jane Smith' },
];

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <UserCircle className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Customer Dashboard</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Track your service requests, manage appointments, and view your history.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 lg:col-span-1 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="text-primary"/>New Service Request</CardTitle>
                <CardDescription>Need something fixed or installed?</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Quickly request a new service from our catalog or get a custom quote.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/request-quotation">Request New Service</Link>
                </Button>
            </CardFooter>
        </Card>
        {/* More cards can be added here like Profile, Settings etc. */}
      </div>


      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> My Service Requests</CardTitle>
          <CardDescription>Overview of your active and past service requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockRequests.length > 0 ? mockRequests.map((req, index) => (
            <div key={req.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="font-semibold">{req.service}</h3>
                    <p className="text-sm text-muted-foreground">Date: {req.date} {req.handyman && `| Handyman: ${req.handyman}`}</p>
                  </div>
                  <Badge variant={
                    req.status === 'Completed' ? 'default' : 
                    req.status === 'Scheduled' ? 'secondary' : 
                    'outline'
                  } className="mt-2 sm:mt-0 self-start sm:self-center bg-primary text-primary-foreground">
                    {req.status}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent">View Details</Button>
                    {req.status !== 'Completed' && req.status !== 'Cancelled' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive">Cancel Request</Button>
                    }
                </div>
              </div>
              {index < mockRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            <p className="text-muted-foreground">You have no service requests yet.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="outline">
                <History className="mr-2 h-4 w-4"/> View Full History (Placeholder)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
