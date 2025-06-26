
// src/app/services/page.tsx
import ServiceCard from '@/components/services/service-card';
import { Briefcase } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Service } from '@/types/service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


async function getServices(): Promise<{ services: Service[], error?: string }> {
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
        
        return { services };
    } catch (error: any) {
        console.error("Error fetching services:", error);
        let errorMessage = "No se pudieron cargar los servicios. Intenta de nuevo más tarde.";
        if (error.code === 'failed-precondition') {
          errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace de creación.";
        } else if (error.code === 'permission-denied') {
            errorMessage = "Error de permisos al leer los servicios. Revisa tus Reglas de Seguridad en Firestore."
        }
        return { services: [], error: errorMessage };
    }
}

export default async function ServicesPage() {
  const { services: displayedServices, error } = await getServices();

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <Briefcase className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Nuestros Servicios</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Explora una amplia gama de servicios de operarios para mantener tu hogar en óptimas condiciones.
        </p>
      </section>
      
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Servicios</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && displayedServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        !error && <div className="text-center py-10"><Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">No hay servicios disponibles en este momento.</p><p className="text-sm text-muted-foreground">El administrador aún no ha añadido ningún servicio.</p></div>
      )}
    </div>
  );
}
