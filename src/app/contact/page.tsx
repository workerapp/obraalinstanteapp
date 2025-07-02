// src/app/contact/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, Phone, LifeBuoy, Users, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-headline font-bold text-primary">Contáctanos</h1>
        <Button variant="outline" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" />Volver al Inicio</Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Estamos aquí para ayudarte</CardTitle>
          <CardDescription>
            Si tienes preguntas, sugerencias o necesitas ayuda con la plataforma, no dudes en ponerte en contacto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <LifeBuoy className="h-6 w-6 text-accent" />
                  Soporte General
                </CardTitle>
                <CardDescription>Para clientes con preguntas sobre servicios o el uso de la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:obraalinstante@gmail.com" className="text-primary hover:underline">obraalinstante@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>+57 324 352 9658</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Users className="h-6 w-6 text-accent" />
                  Operarios y Proveedores
                </CardTitle>
                <CardDescription>Para profesionales interesados en unirse a la plataforma o con dudas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                 <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:obraalinstante@gmail.com" className="text-primary hover:underline">obraalinstante@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>+57 324 352 9658</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Nuestro horario de atención es de lunes a viernes, de 9:00 a.m. a 5:00 p.m. (hora de Colombia).</p>
            <p>Haremos todo lo posible por responderte en un plazo de 24 horas hábiles.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
