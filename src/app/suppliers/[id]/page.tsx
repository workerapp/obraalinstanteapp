// src/app/suppliers/[id]/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Supplier } from '@/types/supplier';
import type { Product } from '@/types/product';
import type { Review } from '@/types/review';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, CalendarDays, MessageSquare, Phone, UserCircle2, Truck, StarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/components/products/product-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const mapFirestoreUserToSupplier = (uid: string, userData: any): Supplier | null => {
  if (!userData || userData.role !== 'supplier' || userData.isApproved !== true) {
    return null;
  }
  let memberSince = 'Fecha no disponible';
  if (userData.createdAt) {
    try {
      let createdAtDate: Date | null = null;
      if (userData.createdAt instanceof Timestamp) createdAtDate = userData.createdAt.toDate();
      else if (typeof userData.createdAt === 'string') createdAtDate = new Date(userData.createdAt);
      else if (typeof userData.createdAt.seconds === 'number') createdAtDate = new Date(userData.createdAt.seconds * 1000);

      if (createdAtDate && !isNaN(createdAtDate.getTime())) {
          memberSince = `Se unió en ${format(createdAtDate, 'MMMM yyyy', { locale: es })}`;
      }
    } catch (e) { console.error(`Error formatting date for supplier ${uid}:`, e); }
  }
  return {
    id: uid,
    companyName: userData.displayName || `Proveedor ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Productos de calidad para tus proyectos',
    categories: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Materiales Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    logoUrl: userData.photoURL || userData.logoUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'logo empresa',
    location: userData.location || 'Ubicación no registrada',
    memberSince,
    about: userData.about || undefined,
    isApproved: userData.isApproved || false,
  };
};

const fetchSupplierProfile = async (supplierId: string): Promise<Supplier | null> => {
  if (!supplierId) return null;
  const userDocRef = doc(firestore, "users", supplierId);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    throw new Error("El perfil de este proveedor no fue encontrado.");
  }
  const supplier = mapFirestoreUserToSupplier(supplierId, userDocSnap.data());
  if (!supplier) {
    throw new Error("Este usuario no es un proveedor aprobado o su perfil no está disponible.");
  }
  return supplier;
};

async function fetchProductsForSupplier(supplierId: string): Promise<Product[]> {
  if (!supplierId) return [];
  const productsRef = collection(firestore, "supplierProducts");
  const q = query(productsRef, where("supplierUid", "==", supplierId), where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  const products: Product[] = [];
  querySnapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() } as Product));
  return products.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchReviewsForUser(userId: string): Promise<Review[]> {
  if (!userId) return [];
  const reviewsRef = collection(firestore, `users/${userId}/reviews`);
  const q = query(reviewsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const reviews: Review[] = [];
  querySnapshot.forEach((doc) => {
    reviews.push({ id: doc.id, ...doc.data() } as Review);
  });
  return reviews;
}

export default function SupplierDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const supplierId = typeof params.id === 'string' ? params.id : '';

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery({
    queryKey: ['supplierProfile', supplierId],
    queryFn: () => fetchSupplierProfile(supplierId),
    enabled: !!supplierId,
    retry: 1,
  });

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['supplierProducts', supplierId],
    queryFn: () => fetchProductsForSupplier(supplierId),
    enabled: !!supplierId,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['supplierReviews', supplierId],
    queryFn: () => fetchReviewsForUser(supplierId),
    enabled: !!supplierId,
  });

  if (isLoadingSupplier) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (supplierError) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Perfil</AlertTitle>
          <AlertDescription>{(supplierError as Error).message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
      </div>
    );
  }

  if (!supplier) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <Button variant="outline" asChild className="mb-6"><Link href="/suppliers" className="flex items-center gap-2"><ArrowLeft size={16} /> Volver al Directorio</Link></Button>
      <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md mb-4 bg-white">
              <Image src={supplier.logoUrl!} alt={supplier.companyName} layout="fill" objectFit="contain" className="p-2" data-ai-hint={supplier.dataAiHint} />
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full"><Link href={`/request-quotation?handymanId=${supplier.id}&handymanName=${encodeURIComponent(supplier.companyName)}`}><MessageSquare size={18} className="mr-2" /> Pedir Cotización de Productos</Link></Button>
               <p className="text-xs text-muted-foreground text-center mt-2">Toda la comunicación y cotización se gestionan a través de la plataforma para tu seguridad.</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl font-headline font-bold text-primary mb-1">{supplier.companyName}</h1>
            <p className="text-lg text-muted-foreground mb-4">{supplier.tagline}</p>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-semibold">{supplier.rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">({supplier.reviewsCount || 0} reseñas)</span>
            </div>
            <div className="space-y-2 text-foreground/90 mb-6">
              {supplier.location && <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {supplier.location}</p>}
              {supplier.memberSince && <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {supplier.memberSince}</p>}
            </div>
            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3">Categorías de Productos</h2>
              <div className="flex flex-wrap gap-2">
                {supplier.categories?.map((cat) => <Badge key={cat} variant="secondary">{cat}</Badge>) || <p>No especificado</p>}
              </div>
            </section>
            <section><h2 className="text-xl font-semibold font-headline mb-3 flex items-center"><UserCircle2 size={22} className="mr-2 text-accent"/> Sobre la Empresa</h2><p className="text-foreground/80">{supplier.about || 'No hay descripción disponible.'}</p></section>
          </div>
        </div>
        <Separator className="my-8" />
        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center"><Truck size={24} className="mr-3 text-primary" /> Catálogo de Productos</h2>
          {isLoadingProducts && <div className="flex items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /><p>Cargando productos...</p></div>}
          {productsError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>No se pudieron cargar los productos.</AlertDescription></Alert>}
          {!isLoadingProducts && !productsError && (products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => <ProductCard key={product.id} product={product} supplier={supplier} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">Este proveedor no ha publicado productos.</p>
          ))}
        </section>

        <Separator className="my-8" />
        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center">
            <StarIcon size={24} className="mr-3 text-primary" /> Reseñas y Calificaciones
          </h2>
          {isLoadingReviews && <div className="flex items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /><p>Cargando reseñas...</p></div>}
          {!isLoadingReviews && reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-background">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{review.authorName}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
                        ))}
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground">
                      {review.createdAt instanceof Timestamp ? format(review.createdAt.toDate(), 'PPP', { locale: es }) : ''}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingReviews && <p className="text-muted-foreground text-center py-6">Este proveedor aún no tiene reseñas.</p>
          )}
        </section>

      </div>
    </div>
  );
}
