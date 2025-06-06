
// src/app/dashboard/handyman/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, CalendarCheck, DollarSign, Settings2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data for handyman dashboard
const mockAppointments = [
  { id: 'apt1', service: 'Plomería - Grifo con Fugas', customer: 'Alicia Maravillas', status: 'Programado', date: '2023-10-28, 10:00 AM', earnings: 75000 },
  { id: 'apt2', service: 'Electricidad - Instalar Ventilador de Techo', customer: 'Roberto Constructor', status: 'Pendiente Confirmación', date: '2023-10-29, 02:00 PM', earnings: 120000 },
  { id: 'apt3', service: 'Pintura - Sala de Estar', customer: 'Carlos Pardo', status: 'Completado', date: '2023-09-15', earnings: 350000 },
];

export default function HandymanDashboardPage() {
  const totalEarnings = mockAppointments.filter(apt => apt.status === 'Completado').reduce((sum, apt) => sum + apt.earnings, 0);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <UserCog className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Panel de Operario</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Gestiona tus servicios, citas, ganancias y perfil.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="text-accent"/>Mis Servicios</CardTitle>
            <CardDescription>Gestiona los servicios que ofreces.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Añade nuevos servicios, actualiza precios y establece tu disponibilidad.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/services">Gestionar Servicios</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Ganancias Totales</CardTitle>
            <CardDescription>Tus ganancias de trabajos completados.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">${totalEarnings.toLocaleString('es-CO')}</p>
            <p className="text-xs text-muted-foreground">Basado en citas completadas.</p>
          </CardContent>
           <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/earnings">Ver Detalles de Ganancias</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="text-muted-foreground"/>Perfil y Configuración</CardTitle>
            <CardDescription>Actualiza tu perfil público y cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Mantén tu información actualizada para los clientes.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/profile">Editar Perfil</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck className="text-primary" /> Próximas Citas y Solicitudes</CardTitle>
          <CardDescription>Gestiona tu agenda y responde a nuevas solicitudes de servicio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockAppointments.length > 0 ? mockAppointments.map((apt, index) => (
            <div key={apt.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-semibold">{apt.service}</h3>
                    <p className="text-sm text-muted-foreground">Cliente: {apt.customer}</p>
                    <p className="text-sm text-muted-foreground">Fecha: {apt.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <Badge variant={
                        apt.status === 'Completado' ? 'default' : 
                        apt.status === 'Programado' ? 'secondary' : 
                        'outline'
                      } className="mt-2 sm:mt-0 self-start sm:self-end bg-primary text-primary-foreground">
                        {apt.status}
                      </Badge>
                      <p className="text-sm font-medium text-green-600">Ganancia Est.: ${apt.earnings.toLocaleString('es-CO')}</p>
                  </div>
                </div>
                 <div className="mt-3 flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => console.log('Ver detalles de la cita:', apt.id)}>Ver Detalles</Button>
                    {apt.status === 'Pendiente Confirmación' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-green-600" onClick={() => console.log('Confirmar cita:', apt.id)}>Confirmar</Button>
                    }
                     {apt.status !== 'Completado' && apt.status !== 'Cancelado' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => console.log('Cancelar/Rechazar cita:', apt.id)}>Cancelar/Rechazar</Button>
                    }
                </div>
              </div>
              {index < mockAppointments.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            <p className="text-muted-foreground">No tienes próximas citas o nuevas solicitudes.</p>
          )}
        </CardContent>
         <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('Ver agenda completa clickeado')}>
                <CalendarCheck className="mr-2 h-4 w-4"/> Ver Agenda Completa (Ejemplo)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
