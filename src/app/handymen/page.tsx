
// src/app/handymen/page.tsx
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Users, AlertTriangle, SearchX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper function to map Firestore user data to Handyman type
const mapFirestoreUserToHandymanList = (uid: string, userData: any): Handyman => {
  let memberSince = 'Fecha de registro no disponible';
  if (userData.createdAt) {
    try {
      let createdAtDate: Date | null = null;
      if (userData.createdAt instanceof Timestamp) {
        createdAtDate = userData.createdAt.toDate();
      } else if (typeof userData.createdAt === 'string') {
        createdAtDate = new Date(userData.createdAt);
      } else if (typeof userData.createdAt === 'number') {
        createdAtDate = new Date(userData.createdAt);
      } else if (userData.createdAt.seconds && typeof userData.createdAt.seconds === 'number') {
        createdAtDate = new Date(userData.createdAt.seconds * 1000);
      }
      
      if (createdAtDate && !isNaN(createdAtDate.getTime())) {
        memberSince = `Se unió en ${createdAtDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
      }
    } catch (e) {
      console.error(`Error formatting 'createdAt' for user ${uid}:`, e);
    }
  }

  return {
    id: uid,
    name: userData.displayName || `Operario ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Operario profesional y confiable',
    aboutMe: userData.aboutMe || undefined,
    skills: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Servicios Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    imageUrl: userData.photoURL || userData.imageUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'persona profesional',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    phone: userData.phone || undefined,
    isApproved: userData.isApproved || false,
  };
};

async function getHandymen(category?: string): Promise<{ handymen: Handyman[]; error?: string }> {
  try {
    const usersRef = collection(firestore, "users");
    const queryConstraints = [
      where("role", "==", "handyman"),
      where("isApproved", "==", true),
    ];

    if (category) {
      console.log(`Filtering handymen by category/skill: "${category}"`);
      queryConstraints.push(where("skills", "array-contains", category));
    }
    
    const q = query(usersRef, ...queryConstraints);
    
    const querySnapshot = await getDocs(q);
    
    const handymenList: Handyman[] = [];
    querySnapshot.forEach((doc) => {
      handymenList.push(mapFirestoreUserToHandymanList(doc.id, doc.data()));
    });
    
    return { handymen: handymenList };
  } catch (error: any) {
    console.error("Error fetching handymen from Firestore:", error);
    let errorMessage = "No se pudieron cargar los operarios. Intenta de nuevo más tarde.";
    if (error.code === 'permission-denied') {
      errorMessage = "Error de permisos al cargar operarios. Verifica las reglas de seguridad de Firestore.";
    } else if (error.code === 'failed-precondition') {
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola del servidor para un enlace que te permitirá crear el índice necesario. El índice probablemente involucre los campos: 'role', 'isApproved' y 'skills'.";
    } else {
      errorMessage = `Error al cargar operarios: ${error.message}`;
    }
    return { handymen: [], error: errorMessage };
  }
}

export default async function HandymenPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const category = typeof searchParams?.category === 'string' ? decodeURIComponent(searchParams.category) : undefined;
  const { handymen: displayedHandymen, error } = await getHandymen(category);

  const pageTitle = category ? `Operarios para ${category}` : "Encuentra un Operario";
  const pageDescription = category 
    ? `Explora nuestro directorio de operarios calificados en ${category}. Para que un operario aparezca aquí, debe tener "${category}" en su lista de habilidades.`
    : "Explora nuestro directorio de operarios calificados y de confianza, listos para ayudarte con los proyectos de tu hogar.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          {pageDescription}
        </p>
      </section>

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Operarios</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && displayedHandymen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedHandymen.map((handyman) => (
            <HandymanProfileCard key={handyman.id} handyman={handyman} />
          ))}
        </div>
      ) : !error && category ? (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">No se encontraron operarios para "{category}"</p>
          <p className="text-sm text-muted-foreground mt-2">Intenta con otra categoría o explora todos nuestros operarios disponibles.</p>
           <Button asChild variant="link" className="mt-4">
              <Link href="/handymen">Ver Todos los Operarios</Link>
          </Button>
        </div>
      ) : (
        !error && <p className="text-center text-muted-foreground text-lg py-10">
          No hay operarios aprobados disponibles en este momento.
        </p>
      )}
    </div>
  );
}

export async function generateMetadata({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const category = typeof searchParams?.category === 'string' ? decodeURIComponent(searchParams.category) : undefined;
    const title = category 
        ? `Operarios de ${category} | Obra al Instante` 
        : "Encuentra un Operario | Obra al Instante";
    const description = category 
        ? `Encuentra operarios especializados en ${category}.`
        : "Explora nuestro directorio de operarios calificados.";

    return {
        title: title,
        description: description,
    };
}
