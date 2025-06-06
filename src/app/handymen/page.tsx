
// src/app/handymen/page.tsx
import { handymen } from '@/data/handymen';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

export default function HandymenPage() {
  const displayedHandymen = handymen;

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Encuentra un Operario</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Explora nuestro directorio de operarios calificados y de confianza, listos para ayudarte con los proyectos de tu hogar.
        </p>
      </section>

      {/* Placeholder for search/filter bar */}
      {/*
      <div className="mb-8">
        <Input 
          type="search" 
          placeholder="Buscar por nombre, habilidad o ubicación..." 
          className="max-w-lg mx-auto shadow-sm"
        />
      </div>
      */}

      {displayedHandymen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedHandymen.map((handyman) => (
            <HandymanProfileCard key={handyman.id} handyman={handyman} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">
          No hay operarios listados en este momento. Por favor, vuelve pronto.
        </p>
      )}
    </div>
  );
}
