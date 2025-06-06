
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
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Tu Panel</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Gestiona tus servicios, solicitudes y configuración de cuenta.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <User className="text-accent" /> Mi Perfil (Ejemplo)
            </CardTitle>
            <CardDescription>Ver y actualizar tu información de perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Ir a Perfil</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Settings className="text-accent" /> Configuración de Cuenta (Ejemplo)
            </CardTitle>
            <CardDescription>Gestiona tus preferencias de cuenta y seguridad.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Ir a Configuración</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
             Panel de Cliente (Ejemplo)
            </CardTitle>
            <CardDescription>Ver tus solicitudes de servicio e historial.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/customer">Vista de Cliente</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              Panel de Operario (Ejemplo)
            </CardTitle>
            <CardDescription>Gestiona tus servicios ofrecidos y citas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/handyman">Vista de Operario</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
       <p className="text-center text-muted-foreground mt-8">
        Nota: Este es un panel genérico. En una aplicación real, el contenido se adaptaría a tu rol (Cliente u Operario).
      </p>
    </div>
  );
}
