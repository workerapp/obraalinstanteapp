// src/app/handymen/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Users, AlertTriangle, SearchX, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      } else if (typeof userData.createdAt.seconds === 'number') {
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
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace que te permitirá crear el índice necesario.";
    }
    return { handymen: [], error: errorMessage };
  }
}

function HandymenGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col h-full shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="p-0">
            <Skeleton className="h-56 w-full" />
          </CardHeader>
          <CardContent className="pt-6 flex-grow">
            <Skeleton className="h-7 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function HandymenPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : undefined;

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['handymen', category],
    queryFn: () => getHandymen(category),
  });

  const displayedHandymen = data?.handymen || [];
  const fetchError = data?.error || (isError ? (queryError as Error).message : null);

  const pageTitle = category ? `Operarios para ${category}` : "Encuentra un Operario";
  const pageDescription = category 
    ? `Explora nuestro directorio de operarios calificados en ${category}.`
    : "Explora nuestro directorio de operarios calificados y de confianza.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{pageDescription}</p>
      </section>

      {isLoading && <HandymenGridSkeleton />}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Operarios</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && displayedHandymen.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedHandymen.map((handyman) => (
            <HandymanProfileCard key={handyman.id} handyman={handyman} />
          ))}
        </div>
      )}

      {!isLoading && !fetchError && displayedHandymen.length === 0 && (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">
            {category ? `No se encontraron operarios para "${category}"` : "No hay operarios aprobados disponibles"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta con otra categoría o vuelve más tarde.
          </p>
          {category && (
            <Button asChild variant="link" className="mt-4">
              <Link href="/handymen">Ver Todos los Operarios</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
