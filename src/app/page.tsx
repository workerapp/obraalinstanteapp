
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Home, Sparkles, Lightbulb, Package, Wrench } from 'lucide-react';

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
              data-ai-hint="logo abstract"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary mb-4">
            ¡Bienvenido a Obra al Instante!
          </h1>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Tu solución integral para encontrar profesionales calificados, proveedores de confianza y asesoramiento experto para tu hogar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/services">Explorar Servicios</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/professionals">Buscar un Profesional</Link>
            </Button>
             <Button size="lg" variant="outline" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/suppliers">Buscar un Proveedor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="container mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow w-full max-w-3xl mx-auto bg-card">
          <CardHeader className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-accent mb-3" />
            <CardTitle className="text-2xl font-headline">¿No sabes por dónde empezar?</CardTitle>
            <CardDescription>
              Usa nuestro Asistente de IA. Describe tu problema y obtén un diagnóstico, posibles soluciones y los tipos de profesionales que necesitas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" asChild>
              <Link href="/ai-assistant">
                <Sparkles className="mr-2 h-5 w-5" />
                Probar el Asistente de IA
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* NEW "Tres Caminos" Section */}
      <section className="container mx-auto">
        <h2 className="text-3xl font-headline font-semibold text-center mb-10 pt-12">Tu Solución a Medida</h2>
        <div className="grid md:grid-cols-3 gap-8">
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-3">
                <Home className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">Para Clientes</CardTitle>
              <CardDescription>Encuentra ayuda experta para tu hogar.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <p>Describe tu necesidad, explora perfiles y solicita cotizaciones a profesionales verificados. ¡Solucionar problemas nunca fue tan fácil!</p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button asChild className="w-full">
                    <Link href="/services">Explorar Servicios</Link>
                </Button>
                 <Button asChild variant="link" className="text-accent">
                    <Link href="/professionals">Buscar un Profesional &rarr;</Link>
                </Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center">
               <div className="p-4 bg-primary/10 rounded-full mb-3">
                <Wrench className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">Para Profesionales</CardTitle>
              <CardDescription>Ofrece tus servicios y haz crecer tu negocio.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <p>Regístrate, crea tu perfil, define tus habilidades y recibe solicitudes de clientes que necesitan tu experiencia. ¡Más trabajo, menos búsqueda!</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/sign-up?role=handyman">Registrarme como Profesional</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-3">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">Para Proveedores</CardTitle>
              <CardDescription>Vende tus productos y materiales.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <p>Expande tu alcance publicando tu catálogo de productos. Conéctate directamente con clientes y profesionales que buscan materiales de calidad.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/sign-up?role=supplier">Registrarme como Proveedor</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

    </div>
  );
}
