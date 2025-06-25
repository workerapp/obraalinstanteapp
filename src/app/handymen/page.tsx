// src/app/handymen/page.tsx
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Users, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

async function getHandymen(): Promise<{ handymen: Handyman[]; error?: string }> {
  try {
    const usersRef = collection(firestore, "users");
    // Solo mostrar operarios que estén aprobados por el administrador
    const q = query(usersRef, where("role", "==", "handyman"), where("isApproved", "==", true));
    
    console.log("Fetching approved handymen from Firestore...");
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} approved handymen documents.`);
    
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
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola del servidor para un enlace que te permitirá crear el índice necesario (rol 'handyman' y 'isApproved').";
    } else {
      errorMessage = `Error al cargar operarios: ${error.message}`;
    }
    return { handymen: [], error: errorMessage };
  }
}

export default async function HandymenPage() {
  const { handymen: displayedHandymen, error } = await getHandymen();

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Encuentra un Operario</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Explora nuestro directorio de operarios calificados y de confianza, listos para ayudarte con los proyectos de tu hogar.
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
      ) : (
        !error && <p className="text-center text-muted-foreground text-lg py-10">
          No hay operarios aprobados disponibles en este momento.
        </p>
      )}
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Encuentra un Operario | Obra al Instante",
    description: "Explora nuestro directorio de operarios calificados.",
  };
}
