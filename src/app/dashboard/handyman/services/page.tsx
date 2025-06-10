
// src/app/dashboard/handyman/services/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListChecks, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Mock data for services - replace with actual data fetching later
const mockOfferedServices: any[] = [
  // Example:
  // { id: 'svc1', name: 'Reparación de Grifos', category: 'Plomería', priceType: 'Por Hora', priceValue: '50,000 COP' },
  // { id: 'svc2', name: 'Instalación de Lámparas', category: 'Electricidad', priceType: 'Fijo', priceValue: '80,000 COP' },
];

export default function HandymanServicesPage() {
  const { toast } = useToast();

  const handleAddServiceClick = () => {
    // For now, just show a toast. Later, this will open a dialog/form.
    toast({
      title: "Próximamente",
      description: "La funcionalidad para añadir nuevos servicios estará disponible pronto.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Mis Servicios Ofrecidos</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/handyman">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Gestiona Tus Servicios</CardTitle>
              <CardDescription>Añade, edita o elimina los servicios que ofreces a los clientes.</CardDescription>
            </div>
            <Button onClick={handleAddServiceClick} className="mt-4 sm:mt-0">
              <PlusCircle size={18} className="mr-2" /> Añadir Nuevo Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mockOfferedServices.length > 0 ? (
            <div className="space-y-4">
              {mockOfferedServices.map((service) => (
                <Card key={service.id} className="bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Tipo de Precio: {service.priceType}</p>
                    <p className="text-sm">Precio: {service.priceValue}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Próximamente", description: "Editar servicio estará disponible pronto."})}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => toast({ title: "Próximamente", description: "Eliminar servicio estará disponible pronto."})}>Eliminar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Aún no has añadido ningún servicio.</p>
              <p className="text-sm text-muted-foreground">Haz clic en "Añadir Nuevo Servicio" para empezar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
