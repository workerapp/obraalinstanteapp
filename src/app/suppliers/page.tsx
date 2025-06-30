// src/app/suppliers/page.tsx
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Supplier } from '@/types/supplier';
import SupplierProfileCard from '@/components/suppliers/supplier-profile-card';
import { Package, AlertTriangle, SearchX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper function to map Firestore user data to Supplier type
const mapFirestoreUserToSupplierList = (uid: string, userData: any): Supplier => {
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
    phone: userData.phone || undefined,
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
      console.log(`Filtering suppliers by category: "${category}"`);
      // Nota: 'skills' en Firestore se reutiliza como categorías para proveedores
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
    let errorMessage = "No se pudieron cargar los proveedores. Intenta de nuevo más tarde.";
    if (error.code === 'permission-denied') {
      errorMessage = "Error de permisos al cargar proveedores. Verifica las reglas de seguridad de Firestore.";
    } else if (error.code === 'failed-precondition') {
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola del servidor para un enlace que te permitirá crear el índice necesario. El índice probablemente involucre los campos: 'role', 'isApproved' y 'skills'.";
    } else {
      errorMessage = `Error al cargar proveedores: ${error.message}`;
    }
    return { suppliers: [], error: errorMessage };
  }
}

export default async function SuppliersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const category = typeof searchParams?.category === 'string' ? decodeURIComponent(searchParams.category) : undefined;
  const { suppliers: displayedSuppliers, error } = await getSuppliers(category);

  const pageTitle = category ? `Proveedores de ${category}` : "Encuentra un Proveedor";
  const pageDescription = category 
    ? `Explora nuestro directorio de proveedores de ${category}.`
    : "Explora nuestro directorio de proveedores de confianza para materiales y productos de construcción.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Package className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          {pageDescription}
        </p>
      </section>

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Proveedores</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && displayedSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSuppliers.map((supplier) => (
            <SupplierProfileCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      ) : !error && category ? (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">No se encontraron proveedores para "{category}"</p>
          <p className="text-sm text-muted-foreground mt-2">Intenta con otra categoría o explora todos nuestros proveedores disponibles.</p>
           <Button asChild variant="link" className="mt-4">
              <Link href="/suppliers">Ver Todos los Proveedores</Link>
          </Button>
        </div>
      ) : (
        !error && <p className="text-center text-muted-foreground text-lg py-10">
          No hay proveedores aprobados disponibles en este momento.
        </p>
      )}
    </div>
  );
}

export async function generateMetadata({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const category = typeof searchParams?.category === 'string' ? decodeURIComponent(searchParams.category) : undefined;
    const title = category 
        ? `Proveedores de ${category} | Obra al Instante` 
        : "Encuentra un Proveedor | Obra al Instante";
    const description = category 
        ? `Encuentra proveedores especializados en ${category}.`
        : "Explora nuestro directorio de proveedores calificados para materiales de construcción.";

    return {
        title: title,
        description: description,
    };
}
