// src/app/services/[id]/page.tsx
"use client";

import type { Service } from '@/types/service';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Tag, Users, Settings as DefaultIcon, AlertTriangle, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { notFound, useParams } from 'next/navigation';
import ServiceDetailFooter from '@/components/services/service-detail-footer';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';


const getIcon = (name?: string | null): LucideIcon => {
  const defaultIcon = DefaultIcon;
  if (!name || name.trim() === '') return defaultIcon;

  const processedName = name.replace(/\s/g, ''); 
  const finalName = processedName.charAt(0).toUpperCase() + processedName.slice(1);

  if (Object.prototype.hasOwnProperty.call(LucideIcons, finalName)) {
    return LucideIcons[finalName as keyof typeof LucideIcons];
  }
  
  console.warn(`Lucide icon "${finalName}" (from input "${name}") not found. Defaulting to "Settings".`);
  return defaultIcon;
};

async function getService(id: string): Promise<Service | null> {
    if (!id) return null;
    try {
        const serviceDocRef = doc(firestore, "platformServices", id);
        const serviceDocSnap = await getDoc(serviceDocRef);

        if (!serviceDocSnap.exists() || !serviceDocSnap.data().isActive) {
            return null;
        }
        const data = serviceDocSnap.data();
        return {
            id: serviceDocSnap.id,
            ...data,
            commonTasks: data.commonTasks || [],
        } as Service;
    } catch (error) {
        console.error("Error getting service document:", error);
        throw new Error("No se pudo obtener el servicio de la base de datos.");
    }
}

function ServiceDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl space-y-6">
        <Skeleton className="relative w-full h-64 sm:h-80 rounded-lg" />
        <header>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
          <Skeleton className="h-6 w-full" />
        </header>
        <section>
          <Skeleton className="h-8 w-1/3 mb-3" />
          <Skeleton className="h-5 w-1/2" />
        </section>
        <section>
          <Skeleton className="h-8 w-1/3 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </div>
        </section>
        <footer className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Skeleton className="h-12 w-full sm:w-48" />
            <Skeleton className="h-12 w-full sm:w-48" />
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = typeof params.id === 'string' ? params.id : '';

  const { data: serviceData, isLoading, isError, error } = useQuery({
    queryKey: ['platformService', serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
    retry: 1,
  });

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (isError) {
    return (
        <div className="max-w-2xl mx-auto py-10">
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error al Cargar Servicio</AlertTitle>
            <AlertDescription>{(error as Error).message || "No se pudo cargar el servicio. Por favor, inténtalo de nuevo."}</AlertDescription>
            </Alert>
            <Button variant="outline" asChild className="mt-6">
              <Link href="/services"><ArrowLeft size={16} className="mr-2" />Volver a Servicios</Link>
            </Button>
        </div>
    );
  }

  if (!serviceData) {
    notFound();
  }

  const IconComponent = getIcon(serviceData.iconName);
  
  const { createdAt, updatedAt, ...serializableService } = serviceData;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/services" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Volver a Servicios
          </Link>
        </Button>
      </div>

      <article className="bg-card p-6 sm:p-8 rounded-xl shadow-xl">
        {serviceData.imageUrl && (
          <div className="relative w-full h-64 sm:h-80 mb-6 rounded-lg overflow-hidden bg-muted">
            <Image
              src={serviceData.imageUrl}
              alt={serviceData.name}
              layout="fill"
              objectFit="contain"
              className="p-2"
              data-ai-hint={serviceData.dataAiHint || "acción servicio"}
              priority
            />
          </div>
        )}

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
            <h1 className="text-4xl font-headline font-bold text-primary">{serviceData.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground">{serviceData.description}</p>
        </header>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold font-headline mb-3">Detalles del Servicio</h2>
          <div className="space-y-2 text-foreground/90">
            <p className="flex items-center gap-2"><Tag size={18} className="text-accent" /><strong>Categoría:</strong> {serviceData.category}</p>
            <p className="flex items-center gap-2"><Tag size={18} className="text-accent" /><strong>Precio:</strong> Basado en cotización personalizada</p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold font-headline mb-3">Tareas Comunes</h2>
          <ul className="space-y-2">
            {serviceData.commonTasks.map((task, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 mt-1 shrink-0" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </section>

        <ServiceDetailFooter service={serializableService as Service} />
      </article>
    </div>
  );
}
