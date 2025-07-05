// src/app/suppliers/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Supplier } from '@/types/supplier';
import SupplierProfileCard from '@/components/suppliers/supplier-profile-card';
import { Package, AlertTriangle, SearchX, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';

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

async function getSuppliers(): Promise<{ suppliers: Supplier[]; error?: string }> {
  try {
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", "supplier"), where("isApproved", "==", true));
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : null;
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['allSuppliers'],
    queryFn: () => getSuppliers(),
  });

  const allCategories = useMemo(() => {
    if (!data?.suppliers) return [];
    const categories = new Set<string>();
    data.suppliers.forEach(s => s.categories?.forEach(c => categories.add(c)));
    return Array.from(categories).sort();
  }, [data?.suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!data?.suppliers) return [];
    return data.suppliers
      .filter(supplier => {
        // Category filter
        if (selectedCategory) {
          return supplier.categories?.includes(selectedCategory);
        }
        return true;
      })
      .filter(supplier => {
        // Search term filter
        if (searchTerm.trim() === '') return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          supplier.companyName.toLowerCase().includes(lowercasedTerm) ||
          (supplier.tagline && supplier.tagline.toLowerCase().includes(lowercasedTerm)) ||
          supplier.categories?.some(cat => cat.toLowerCase().includes(lowercasedTerm))
        );
      });
  }, [data?.suppliers, searchTerm, selectedCategory]);

  const fetchError = data?.error || (isError ? (queryError as Error).message : null);

  const pageTitle = selectedCategory ? `Proveedores de ${selectedCategory}` : "Encuentra un Proveedor";
  const pageDescription = selectedCategory 
    ? `Explora nuestro directorio de proveedores de ${selectedCategory}.`
    : "Explora nuestro directorio de proveedores de confianza para materiales y productos. Usa la búsqueda y los filtros para encontrar lo que necesitas.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Package className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{pageDescription}</p>
      </section>

      <Card className="p-4 mb-8 shadow-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o categoría de producto..."
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

      {isLoading && <SuppliersGridSkeleton />}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Proveedores</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && filteredSuppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierProfileCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}

      {!isLoading && !fetchError && filteredSuppliers.length === 0 && (
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
