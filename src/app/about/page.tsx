// src/app/about/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Target, Lightbulb, Users, HeartHandshake, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary">Sobre Obra al Instante</h1>
        <Button variant="outline" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" />Volver al Inicio</Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline">
            <Target className="text-accent h-8 w-8" />
            Nuestra Misión
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg text-foreground/90">
          <p>
            Nuestra misión es simplificar la búsqueda y contratación de servicios para el hogar en Colombia,
            utilizando tecnología innovadora y un enfoque centrado en la confianza. Queremos empoderar tanto a
            los clientes, dándoles acceso a profesionales calificados, como a los profesionales y proveedores, brindándoles una
            plataforma para hacer crecer sus negocios.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Lightbulb className="text-accent" /> Para Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              ¿Cansado de la incertidumbre al buscar un profesional? Con Obra al Instante, obtienes acceso a
              un directorio de profesionales verificados. Usa nuestro asistente de IA "Obrita" para diagnosticar
              problemas, solicita cotizaciones claras y gestiona tus servicios, todo en un solo lugar.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Users className="text-accent" /> Para Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Concéntrate en lo que mejor sabes hacer. Te conectamos con clientes que necesitan tus habilidades.
              Gestiona tu perfil, define tus servicios, recibe solicitudes y haz crecer tu reputación a través
              de un sistema de reseñas justo y transparente.
            </p>
          </CardContent>
        </Card>
      </div>

       <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline">
            <HeartHandshake className="text-accent h-8 w-8" />
            Nuestros Valores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="font-bold text-primary">Confianza:</div>
            <p>Construimos una comunidad basada en la verificación, la transparencia y las reseñas honestas.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="font-bold text-primary">Calidad:</div>
            <p>Nos esforzamos por atraer y promover a los mejores profesionales del sector.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="font-bold text-primary">Innovación:</div>
            <p>Usamos la tecnología, como nuestra IA "Obrita", para hacer la experiencia más fácil e intuitiva para todos.</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center pt-8">
        <h2 className="text-2xl font-semibold mb-4">¿Listo para unirte?</h2>
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/sign-up?role=customer">Soy Cliente</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
            <Link href="/sign-up?role=handyman">Soy Profesional o Proveedor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
