// src/app/contact/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail, Phone, LifeBuoy, Users, ArrowLeft } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <title>WhatsApp</title>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.74.45 3.48 1.34 5.04l-1.54 5.58 5.7-1.52c1.48.81 3.15 1.25 4.87 1.25 4.97 0 9.07-4.05 9.07-9.05S17.01 2 12.04 2zm4.88 11.28c-.14.43-.94 1.2-1.09 1.35s-.3.15-.65.09c-.43-.07-1.25-.46-2.38-1.45-1.13-.99-1.88-2.21-2.08-2.58s-.33-.56-.18-.88c.14-.31.3-.41.4-.53s.14-.2.22-.33.03-.23 0-.43c-.04-.2-.65-1.55-.88-2.13s-.45-.48-.6-.48c-.14 0-.3 0-.45.01s-.43.06-.66.33c-.23.27-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.71 4.3 3.8s1.68.78 2.25.73c.56-.05 1.75-.72 2-1.35s.25-1.2.18-1.35c-.08-.15-.3-.23-.44-.27z" />
    </svg>
);


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
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:obraalinstante@gmail.com" className="text-primary hover:underline">obraalinstante@gmail.com</a>
                </div>
                 <a href="https://wa.me/573017412292" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="secondary" className="w-full">
                       <WhatsAppIcon className="h-4 w-4 mr-2"/>
                       Chatear por WhatsApp
                    </Button>
                </a>
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
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:obraalinstante@gmail.com" className="text-primary hover:underline">obraalinstante@gmail.com</a>
                </div>
                 <a href="https://wa.me/573017412292" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="secondary" className="w-full">
                       <WhatsAppIcon className="h-4 w-4 mr-2"/>
                       Chatear por WhatsApp
                    </Button>
                </a>
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
