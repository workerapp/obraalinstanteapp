
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, Users } from 'lucide-react';
import AiAssistantHomeWidget from '@/components/home/ai-assistant-home-widget'; // Importado

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/20 via-background to-background rounded-xl shadow-lg">
        <div className="container mx-auto">
          <div className="mx-auto mb-6 animate-bounce flex justify-center">
            <Image 
              src="/images/icon.png" 
              alt="Obra al Instante Logo" 
              width={96} 
              height={96}
            />
          </div>
          <h1 className="text-5xl font-headline font-bold text-primary mb-4">
            ¡Bienvenido a Obra al Instante!
          </h1>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Tu solución integral para encontrar operarios calificados y obtener asesoramiento experto para las reparaciones y mantenimiento de tu hogar.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/services">Explorar Servicios</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/handymen">Buscar un Operario</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Nuevo widget del Asistente IA aquí */}
      <section className="container mx-auto">
        <AiAssistantHomeWidget />
      </section>

      <section className="container mx-auto">
        <h2 className="text-3xl font-headline font-semibold text-center mb-10 pt-12">Cómo Funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="text-accent" /> Describe tu Problema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Usa nuestro Asistente IA para describir tu problema y obtener sugerencias de soluciones al instante, o explora nuestros servicios.</p>
              <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/ai-assistant">Ir al Asistente IA &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Users className="text-accent" /> Encuentra un Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Explora perfiles de operarios calificados, revisa sus valoraciones y solicita una cotización para tus necesidades específicas.</p>
               <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/handymen">Buscar Operarios &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <CheckCircle className="text-accent" /> ¡Trabajo Hecho!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contrata al operario adecuado, gestiona tus citas y disfruta de una experiencia de servicio sin complicaciones.</p>
               <Button variant="link" asChild className="px-0 mt-2 text-accent hover:text-accent/80">
                <Link href="/request-quotation">Solicitar Cotización &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="container mx-auto py-10">
         <Card className="bg-primary text-primary-foreground p-8 rounded-lg shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-headline font-bold mb-4">¿Eres un Operario Calificado?</h2>
              <p className="mb-6">
                Únete a nuestra plataforma para conectar con clientes que buscan tu experiencia. Gestiona tus servicios, citas y haz crecer tu negocio con Obra al Instante.
              </p>
              <Button variant="secondary" size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/sign-up?role=handyman">Registrarse como Operario</Link>
              </Button>
            </div>
            <div className="flex-shrink-0">
              <Image 
                src="https://placehold.co/300x250.png" 
                alt="Herramientas de operario" 
                width={300} 
                height={250} 
                className="rounded-lg shadow-md"
                data-ai-hint="herramientas construccion" 
              />
            </div>
          </Card>
      </section>

    </div>
  );
}
