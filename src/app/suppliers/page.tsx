// src/app/suppliers/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Supplier } from '@/types/supplier';
import SupplierProfileCard from '@/components/suppliers/supplier-profile-card';
import { Package, AlertTriangle, SearchX, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const mapFirestoreUserToSupplierList = (uid: string, userData: any): Supplier => {
  let memberSince = 'Fecha de registro no disponible';
  if (userData.createdAt) {
    try {
      let createdAtDate: Date | null = null;
      if (userData.createdAt instanceof Timestamp) createdAtDate = userData.createdAt.toDate();
      else if (typeof userData.createdAt === 'string') createdAtDate = new Date(userData.createdAt);
      else if (typeof userData.createdAt.seconds === 'number') createdAtDate = new Date(userData.createdAt.seconds * 1000);
      
      if (createdAtDate && !isNaN(createdAtDate.getTime())) {
        memberSince = `Se unió en ${createdAtDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
      }
    } catch (e) {
      console.error(`Error formatting 'createdAt' for supplier ${uid}:`, e);
    }
  }

  return {
    id: uid,
    companyName: userData.displayName || `Proveedor ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Productos de calidad para tu proyecto',
    categories: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Materiales de Construcción'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    logoUrl: userData.photoURL || userData.logoUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'logo empresa',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    isApproved: userData.isApproved || false,
  };
};

async function getSuppliers(category?: string): Promise<{ suppliers: Supplier[]; error?: string }> {
  try {
    const usersRef = collection(firestore, "users");
    const queryConstraints = [
      where("role", "==", "supplier"),
      where("isApproved", "==", true),
    ];

    if (category) {
      queryConstraints.push(where("skills", "array-contains", category));
    }
    
    const q = query(usersRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const supplierList: Supplier[] = [];
    querySnapshot.forEach((doc) => {
      supplierList.push(mapFirestoreUserToSupplierList(doc.id, doc.data()));
    });
    
    return { suppliers: supplierList };
  } catch (error: any) {
    console.error("Error fetching suppliers from Firestore:", error);
    let errorMessage = "No se pudieron cargar los proveedores.";
    if (error.code === 'failed-precondition') {
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace de creación.";
    }
    return { suppliers: [], error: errorMessage };
  }
}

function SuppliersGridSkeleton() {
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
            </div>
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : undefined;

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['suppliers', category],
    queryFn: () => getSuppliers(category),
  });

  const displayedSuppliers = data?.suppliers || [];
  const fetchError = data?.error || (isError ? (queryError as Error).message : null);

  const pageTitle = category ? `Proveedores de ${category}` : "Encuentra un Proveedor";
  const pageDescription = category 
    ? `Explora nuestro directorio de proveedores de ${category}.`
    : "Explora nuestro directorio de proveedores de confianza para materiales y productos.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Package className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{pageDescription}</p>
      </section>

      {isLoading && <SuppliersGridSkeleton />}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Proveedores</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && displayedSuppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSuppliers.map((supplier) => (
            <SupplierProfileCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}

      {!isLoading && !fetchError && displayedSuppliers.length === 0 && (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">
            {category ? `No se encontraron proveedores para "${category}"` : "No hay proveedores disponibles"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Intenta con otra categoría o vuelve más tarde.</p>
          {category && (
            <Button asChild variant="link" className="mt-4">
              <Link href="/suppliers">Ver Todos los Proveedores</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
