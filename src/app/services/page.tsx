// src/app/services/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import ServiceCard from '@/components/services/service-card';
import { Briefcase, Loader2, AlertTriangle } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Service } from '@/types/service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

async function getServices(): Promise<Service[]> {
    try {
        const servicesRef = collection(firestore, "platformServices");
        const q = query(servicesRef, where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        const services: Service[] = [];
        querySnapshot.forEach((doc) => {
            services.push({ id: doc.id, ...doc.data() } as Service);
        });

        // Sort client-side to avoid needing a composite index
        services.sort((a, b) => a.name.localeCompare(b.name));
        
        return services;
    } catch (error: any) {
        console.error("Error fetching services:", error);
        let errorMessage = "No se pudieron cargar los servicios. Intenta de nuevo más tarde.";
        if (error.code === 'failed-precondition') {
          errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace de creación.";
        } else if (error.code === 'permission-denied') {
            errorMessage = "Error de permisos al leer los servicios. Revisa tus Reglas de Seguridad en Firestore."
        }
        // Throwing an error here allows react-query to handle the error state.
        throw new Error(errorMessage);
    }
}

function ServicesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col h-full shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <Skeleton className="h-48 w-full" />
            <div className="flex items-center gap-3 pt-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-7 w-3/4" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardHeader>
          <CardContent className="flex-grow">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-1" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const { data: displayedServices, isLoading, isError, error } = useQuery<Service[], Error>({
    queryKey: ['platformServices'],
    queryFn: getServices,
  });

  if (isLoading) {
    return (
        <div className="space-y-8">
            <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
                <Briefcase className="mx-auto h-16 w-16 text-accent mb-4" />
                <h1 className="text-3xl sm:text-4xl font-headline font-bold text-accent mb-2">Nuestros Servicios</h1>
                <p className="text-lg text-foreground/80 max-w-xl mx-auto">
                Explora una amplia gama de servicios de profesionales para mantener tu hogar en óptimas condiciones.
                </p>
            </section>
            <ServicesGridSkeleton />
        </div>
    );
  }

  if (isError) {
     return (
        <div className="space-y-8">
            <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
                <Briefcase className="mx-auto h-16 w-16 text-accent mb-4" />
                <h1 className="text-3xl sm:text-4xl font-headline font-bold text-accent mb-2">Nuestros Servicios</h1>
                <p className="text-lg text-foreground/80 max-w-xl mx-auto">
                Explora una amplia gama de servicios de profesionales para mantener tu hogar en óptimas condiciones.
                </p>
            </section>
            <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Servicios</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <Briefcase className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-accent mb-2">Nuestros Servicios</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Explora una amplia gama de servicios de profesionales para mantener tu hogar en óptimas condiciones.
        </p>
      </section>
      
      {displayedServices && displayedServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service) => {
            const { createdAt, updatedAt, ...serializableService } = service;
            return <ServiceCard key={service.id} service={serializableService as Service} />;
          })}
        </div>
      ) : (
        <div className="text-center py-10"><Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">No hay servicios disponibles en este momento.</p><p className="text-sm text-muted-foreground">El administrador aún no ha añadido ningún servicio.</p></div>
      )}
    </div>
  );
}