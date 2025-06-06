
// src/app/dashboard/customer/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, MessageSquarePlus, History, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data for customer dashboard
const mockRequests = [
  { id: 'req1', service: 'Plomería - Grifo con Fugas', status: 'Cotización Pendiente', date: '2023-10-25' },
  { id: 'req2', service: 'Electricidad - Instalar Ventilador de Techo', status: 'Programado', date: '2023-10-28', handyman: 'Juan Pérez' },
  { id: 'req3', service: 'Pintura - Sala de Estar', status: 'Completado', date: '2023-09-15', handyman: 'Ana García' },
];

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <UserCircle className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Panel de Cliente</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Realiza seguimiento de tus solicitudes de servicio, gestiona citas y consulta tu historial.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 lg:col-span-1 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="text-primary"/>Nueva Solicitud de Servicio</CardTitle>
                <CardDescription>¿Necesitas que algo se repare o instale?</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Solicita rápidamente un nuevo servicio de nuestro catálogo u obtén una cotización personalizada.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/request-quotation">Solicitar Nuevo Servicio</Link>
                </Button>
            </CardFooter>
        </Card>
        {/* More cards can be added here like Profile, Settings etc. */}
      </div>


      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Mis Solicitudes de Servicio</CardTitle>
          <CardDescription>Resumen de tus solicitudes de servicio activas y pasadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockRequests.length > 0 ? mockRequests.map((req, index) => (
            <div key={req.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="font-semibold">{req.service}</h3>
                    <p className="text-sm text-muted-foreground">Fecha: {req.date} {req.handyman && `| Operario: ${req.handyman}`}</p>
                  </div>
                  <Badge variant={
                    req.status === 'Completado' ? 'default' : 
                    req.status === 'Programado' ? 'secondary' : 
                    'outline'
                  } className="mt-2 sm:mt-0 self-start sm:self-center bg-primary text-primary-foreground">
                    {req.status}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => console.log('Ver detalles de la solicitud:', req.id)}>Ver Detalles</Button>
                    {req.status !== 'Completado' && req.status !== 'Cancelado' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => console.log('Cancelar solicitud:', req.id)}>Cancelar Solicitud</Button>
                    }
                </div>
              </div>
              {index < mockRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            <p className="text-muted-foreground">Aún no tienes solicitudes de servicio.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('Ver historial completo clickeado')}>
                <History className="mr-2 h-4 w-4"/> Ver Historial Completo (Ejemplo)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
