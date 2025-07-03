// src/app/services/[id]/page.tsx
import type { Service } from '@/types/service';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Tag, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import ServiceDetailFooter from '@/components/services/service-detail-footer';

// Helper function to get Lucide icon component by name string
const getIcon = (name?: string | null): LucideIcon => {
  const defaultIcon = LucideIcons.Settings;
  if (!name || name.trim() === '') return defaultIcon;

  // Sanitize name: "Paint Brush" -> "PaintBrush", "wrench" -> "Wrench"
  const processedName = name.replace(/\s/g, ''); // Remove spaces
  const finalName = processedName.charAt(0).toUpperCase() + processedName.slice(1);

  if (Object.prototype.hasOwnProperty.call(LucideIcons, finalName)) {
    return LucideIcons[finalName as keyof typeof LucideIcons];
  }
  
  console.warn(`Lucide icon "${finalName}" (from input "${name}") not found. Defaulting to "Settings".`);
  return defaultIcon;
};

interface ServiceDetailPageProps {
  params: { id: string };
}

async function getService(id: string): Promise<Service | null> {
    try {
        const serviceDocRef = doc(firestore, "platformServices", id);
        const serviceDocSnap = await getDoc(serviceDocRef);

        if (!serviceDocSnap.exists() || !serviceDocSnap.data().isActive) {
            return null; // Return null if not found or not active
        }
        const data = serviceDocSnap.data();
        return {
            id: serviceDocSnap.id,
            ...data,
            commonTasks: data.commonTasks || [],
        } as Service;
    } catch (error) {
        console.error("Error getting service document:", error);
        return null;
    }
}


export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const serviceData = await getService(params.id);

  if (!serviceData) {
    notFound();
  }

  const IconComponent = getIcon(serviceData.iconName);
  
  // This removes the non-serializable Firestore Timestamp objects before passing to a Client Component.
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
          <div className="relative w-full h-64 sm:h-80 mb-6 rounded-lg overflow-hidden">
            <Image
              src={serviceData.imageUrl}
              alt={serviceData.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={serviceData.dataAiHint || "acción servicio"}
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

export async function generateMetadata({ params }: ServiceDetailPageProps) {
  const service = await getService(params.id);
  if (!service) {
    return { title: "Servicio No Encontrado" };
  }
  return {
    title: `${service.name} - Obra al Instante`,
    description: service.description,
  };
}
