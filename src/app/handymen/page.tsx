// src/app/handymen/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Users, AlertTriangle, SearchX, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';

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

// This function now fetches ALL approved handymen. Filtering will happen on the client.
async function getHandymen(): Promise<{ handymen: Handyman[]; error?: string }> {
  try {
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", "handyman"), where("isApproved", "==", true));
    
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Set initial category from URL, but only once.
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : null;
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['allHandymen'], // Simplified key to fetch all
    queryFn: () => getHandymen(), // Fetch all, no category passed
  });
  
  const allCategories = useMemo(() => {
    if (!data?.handymen) return [];
    const categories = new Set<string>();
    data.handymen.forEach(h => h.skills?.forEach(s => categories.add(s)));
    return Array.from(categories).sort();
  }, [data?.handymen]);

  const filteredHandymen = useMemo(() => {
    if (!data?.handymen) return [];
    return data.handymen
      .filter(handyman => {
        // Category filter
        if (selectedCategory) {
          return handyman.skills?.includes(selectedCategory);
        }
        return true;
      })
      .filter(handyman => {
        // Search term filter
        if (searchTerm.trim() === '') return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          handyman.name.toLowerCase().includes(lowercasedTerm) ||
          (handyman.tagline && handyman.tagline.toLowerCase().includes(lowercasedTerm)) ||
          handyman.skills?.some(skill => skill.toLowerCase().includes(lowercasedTerm))
        );
      });
  }, [data?.handymen, searchTerm, selectedCategory]);

  const fetchError = data?.error || (isError ? (queryError as Error).message : null);

  const pageTitle = selectedCategory ? `Operarios para ${selectedCategory}` : "Encuentra un Operario";
  const pageDescription = selectedCategory 
    ? `Explora nuestro directorio de operarios calificados en ${selectedCategory}.`
    : "Explora nuestro directorio de operarios calificados y de confianza. Usa la búsqueda y los filtros para encontrar al profesional perfecto.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{pageDescription}</p>
      </section>
      
      <Card className="p-4 mb-8 shadow-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, habilidad, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Filtrar por categoría:</p>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {allCategories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && <HandymenGridSkeleton />}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Operarios</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && filteredHandymen.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHandymen.map((handyman) => (
            <HandymanProfileCard key={handyman.id} handyman={handyman} />
          ))}
        </div>
      )}

      {!isLoading && !fetchError && filteredHandymen.length === 0 && (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">
            No se encontraron resultados
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta ajustar tu búsqueda o filtros.
          </p>
          {(searchTerm || selectedCategory) && (
             <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
