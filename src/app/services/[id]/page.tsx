
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

// Helper function to get Lucide icon component by name string
const getIcon = (name?: string | null): LucideIcon | null => {
  if (!name || !(name in LucideIcons)) return LucideIcons.Settings; // Default icon
  return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon;
};

interface ServiceDetailPageProps {
  params: { id: string };
}

async function getService(id: string): Promise<Service | null> {
    const serviceDocRef = doc(firestore, "platformServices", id);
    const serviceDocSnap = await getDoc(serviceDocRef);

    if (!serviceDocSnap.exists()) {
        return null;
    }
    const data = serviceDocSnap.data();
    return {
        id: serviceDocSnap.id,
        ...data,
        commonTasks: data.commonTasks || [],
    } as Service;
}


export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = await getService(params.id);

  if (!service) {
    notFound();
  }

  const IconComponent = getIcon(service.iconName);

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
        {service.imageUrl && (
          <div className="relative w-full h-64 sm:h-80 mb-6 rounded-lg overflow-hidden">
            <Image
              src={service.imageUrl}
              alt={service.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={service.dataAiHint || "acción servicio"}
            />
          </div>
        )}

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
            <h1 className="text-4xl font-headline font-bold text-primary">{service.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground">{service.description}</p>
        </header>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold font-headline mb-3">Detalles del Servicio</h2>
          <div className="space-y-2 text-foreground/90">
            <p className="flex items-center gap-2"><Tag size={18} className="text-accent" /><strong>Categoría:</strong> {service.category}</p>
            <p className="flex items-center gap-2"><Tag size={18} className="text-accent" /><strong>Precio:</strong> Basado en cotización personalizada</p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold font-headline mb-3">Tareas Comunes</h2>
          <ul className="space-y-2">
            {service.commonTasks.map((task, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={20} className="text-green-500 mt-1 shrink-0" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
              <Link href={`/request-quotation?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`}>Solicitar Cotización</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto shadow-md">
              <Link href="/handymen" className="flex items-center gap-2">
                <Users size={18} /> Buscar un Operario para este Servicio
              </Link>
            </Button>
          </div>
        </footer>
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
