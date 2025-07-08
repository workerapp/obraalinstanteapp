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
      <path d="M17.472 14.382c-.297-.149-.758-.372-1.03-.46-.272-.088-.468-.149-.665.149-.197.297-.758.945-1.03 1.143-.272.197-.544.22-.943.074-.399-.149-1.39-1.22-2.527-2.998-.865-1.373-1.39-1.89-1.39-1.89s-.088-.121-.023-.197c.065-.074.149-.12.22-.197.072-.074.12-.12.197-.22.074-.1.023-.174 0-.272-.023-.098-.665-1.58-.943-2.197-.27-.617-.544-.521-.665-.521h-.372c-.12 0-.27.046-.443.22-.174.174-.68.617-.68 1.58 0 .963.68 1.82.78 1.97.1.149 1.443 2.229 3.59 3.22.56.273.943.372 1.342.443.665.12 1.22-.098 1.39-.272.174-.174.758-.945.865-1.143.108-.197.197-.297.372-.197.172.098 1.143.544 1.342.617.2.074.372.098.443.149.074.046.074.468.023.945-.046.478-1.03.92-1.342 1.064-.312.149-1.03.12-1.58.023s-2.527-.8-3.99-2.248c-1.463-1.448-2.39-3.22-2.39-3.22s-.149-.174-.312-.443c-.164-.27-.372-.544-.372-1.03 0-.468.24-.865.443-1.064.207-.2.443-.312.617-.312s.297-.023.443-.023h.149c.12 0 .22.023.312.023.149 0 .27.023.372.046.12.024.27.099.372.273.1.174.149.312.197.42.046.1.098.174.149.273.046.098.074.148.074.148s.098.12.149.197c.046.073.046.148 0 .22-.046.073-.098.12-.197.22-.098.098-.174.174-.197.197-.023.023-.046.046-.074.073-.023.024 0 .074.023.12s.22.443.665 1.143c.444.7 1.03 1.414 2.143 2.414.297.27.544.49.865.714.322.22.617.34.865.42.248.082.496.06.665-.023.17-.083.64-.297.758-.568.12-.27.12-.52.072-.568s-.174-.098-.312-.174c-.14-.073-1.03-.488-1.22-.568" />
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
                    <Button variant="outline" className="w-full">
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
                    <Button variant="outline" className="w-full">
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
