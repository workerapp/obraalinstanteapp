
// src/app/services/page.tsx
import { services } from '@/data/services';
import ServiceCard from '@/components/services/service-card';
import { Input } from '@/components/ui/input';
import { Briefcase } from 'lucide-react';

export default function ServicesPage() {
  // For now, just display all services. Filtering/search could be added later.
  const displayedServices = services;

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <Briefcase className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Nuestros Servicios</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Explora una amplia gama de servicios de operarios para mantener tu hogar en óptimas condiciones.
        </p>
      </section>
      
      {/* Placeholder for search/filter bar - non-functional for now */}
      {/*
      <div className="mb-8">
        <Input 
          type="search" 
          placeholder="Buscar servicios (ej: plomería, pintura)..." 
          className="max-w-lg mx-auto shadow-sm"
        />
      </div>
      */}

      {displayedServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">
          No hay servicios disponibles en este momento. Por favor, vuelve más tarde.
        </p>
      )}
    </div>
  );
}
