import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, Users, Wrench } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/20 via-background to-background rounded-xl shadow-lg">
        <div className="container mx-auto">
          <Wrench className="mx-auto h-24 w-24 text-primary mb-6 animate-bounce" />
          <h1 className="text-5xl font-headline font-bold text-primary mb-4">
            Welcome to Manitas Listas!
          </h1>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Your one-stop solution for finding skilled handymen and getting expert advice for your home repair and maintenance needs.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/services">Browse Services</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/handymen">Find a Handyman</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto">
        <h2 className="text-3xl font-headline font-semibold text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="text-accent" /> Describe Your Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Use our AI Assistant to describe your issue and get instant solution suggestions, or browse services.</p>
              <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/ai-assistant">Try AI Assistant &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Users className="text-accent" /> Find a Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Browse profiles of skilled handymen, check their ratings, and request a quote for your specific needs.</p>
               <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/handymen">Find Handymen &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <CheckCircle className="text-accent" /> Get It Done
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Hire the right handyman, manage your appointments, and enjoy a hassle-free service experience.</p>
               <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/request-quotation">Request a Quote &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="container mx-auto py-10">
         <Card className="bg-primary text-primary-foreground p-8 rounded-lg shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-headline font-bold mb-4">Are you a skilled Handyman?</h2>
              <p className="mb-6">
                Join our platform to connect with customers looking for your expertise. Manage your services, appointments, and grow your business with Manitas Listas.
              </p>
              <Button variant="secondary" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/sign-up?role=handyman">Register as Handyman</Link>
              </Button>
            </div>
            <div className="flex-shrink-0">
              <Image 
                src="https://placehold.co/300x250.png" 
                alt="Handyman tools" 
                width={300} 
                height={250} 
                className="rounded-lg shadow-md"
                data-ai-hint="tools construction" 
              />
            </div>
          </Card>
      </section>

    </div>
  );
}
