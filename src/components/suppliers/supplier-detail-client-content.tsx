// src/components/suppliers/supplier-detail-client-content.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Supplier } from '@/types/supplier';
import type { Product } from '@/types/product';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, CalendarDays, MessageSquare, Phone, UserCircle2, Truck, StarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; 
import { Separator } from '@/components/ui/separator'; 
import ProductCard from '@/components/products/product-card';

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface SupplierDetailClientContentProps {
  supplier: Supplier; 
  reviews: Review[];
}

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+573017412292"; 

async function fetchProductsForSupplier(supplierId: string): Promise<Product[]> {
  if (!supplierId) return [];
  
  const productsRef = collection(firestore, "supplierProducts");
  const q = query(
    productsRef, 
    where("supplierUid", "==", supplierId), 
    where("isActive", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  const products: Product[] = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });

  // Client-side sort to avoid composite indexes
  products.sort((a, b) => a.name.localeCompare(b.name));
  
  return products;
}

export default function SupplierDetailClientContent({ supplier, reviews }: SupplierDetailClientContentProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier?.id) {
        setIsLoadingProducts(true);
        setProductsError(null);
        fetchProductsForSupplier(supplier.id)
            .then(setProducts)
            .catch(err => {
                console.error("Error fetching supplier products:", err);
                setProductsError("No se pudieron cargar los productos de este proveedor en este momento.");
            })
            .finally(() => setIsLoadingProducts(false));
    } else {
        setIsLoadingProducts(false);
    }
  }, [supplier?.id]);

  if (!supplier) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Datos del proveedor no disponibles.</h1>
        <Button asChild className="mt-4">
          <Link href="/suppliers">Volver al Directorio</Link>
        </Button>
      </div>
    );
  }

  const handleWhatsAppContact = () => {
    if (ADMIN_WHATSAPP_NUMBER === "+573017412292" && !process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER) {
       console.warn('El número de WhatsApp del administrador no está configurado en las variables de entorno. Usando valor por defecto.');
    }
    if (!ADMIN_WHATSAPP_NUMBER) {
        toast({
            title: "Configuración Requerida",
            description: "El número de WhatsApp del administrador no ha sido configurado.",
            variant: "destructive",
        });
        return;
    }
    const adminPhoneNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, ''); 
    
    const messageText = `Hola, quisiera solicitar contacto o una cotización de materiales del proveedor ${supplier.companyName} (ID: ${supplier.id}) que vi en Obra al Instante. Por favor, ¿pueden ayudarme a coordinar? Los productos que necesito son: `;
    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/suppliers" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Volver al Directorio
          </Link>
        </Button>
      </div>

      <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            {supplier.logoUrl && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md mb-4 bg-white">
                <Image
                  src={supplier.logoUrl}
                  alt={supplier.companyName}
                  layout="fill"
                  objectFit="contain"
                  className="p-2"
                  data-ai-hint={supplier.dataAiHint || "logo empresa"}
                />
              </div>
            )}
             <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 mb-2">
              <Link href={`/request-quotation?handymanId=${supplier.id}&handymanName=${encodeURIComponent(supplier.companyName)}`}>
                <MessageSquare size={18} className="mr-2" /> Solicitar Cotización de Productos
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleWhatsAppContact}>
              <Phone size={18} className="mr-2" /> Contactar vía Administrador
            </Button>
             <p className="text-xs text-muted-foreground text-center mt-2">
              La comunicación y cotización se gestionan a través del administrador para garantizar un proceso seguro.
            </p>
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
              {supplier.location && (
                <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {supplier.location}</p>
              )}
              {supplier.memberSince && (
                <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {supplier.memberSince}</p>
              )}
            </div>

            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3">Categorías de Productos</h2>
              <div className="flex flex-wrap gap-2">
                {(supplier.categories && supplier.categories.length > 0) ? supplier.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="px-3 py-1 text-sm bg-secondary/20 text-secondary-foreground border border-secondary/50">
                     {cat}
                  </Badge>
                )) : <p className="text-sm text-muted-foreground">No hay categorías especificadas.</p>}
              </div>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3 flex items-center">
                <UserCircle2 size={22} className="mr-2 text-accent"/> Sobre la Empresa
              </h2>
              {supplier.about ? (
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{supplier.about}</p>
              ) : (
                <p className="text-muted-foreground">
                  Este proveedor aún no ha añadido una descripción detallada sobre su empresa.
                </p>
              )}
            </section>
          </div>
        </div>

        <Separator className="my-8" />

        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center">
            <Truck size={24} className="mr-3 text-primary" /> Catálogo de Productos
          </h2>
          {isLoadingProducts && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando productos...</p>
            </div>
          )}
          {productsError && !isLoadingProducts && (
            <div className="text-center py-6 bg-destructive/10 p-4 rounded-md">
              <p className="text-destructive font-medium">Error al Cargar Productos</p>
              <p className="text-sm text-destructive/80">{productsError}</p>
            </div>
          )}
          {!isLoadingProducts && !productsError && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} supplier={supplier} />
              ))}
            </div>
          )}
          {!isLoadingProducts && !productsError && products.length === 0 && (
            <div className="text-center py-6 bg-muted/50 p-4 rounded-md">
                <p className="text-muted-foreground font-medium">No hay productos en el catálogo</p>
                <p className="text-sm text-muted-foreground/80">
                  Este proveedor aún no ha publicado productos. Puedes solicitar una cotización general de los materiales que necesites.
                </p>
            </div>
          )}
        </section>
        
        <Separator className="my-8" />

        <section className="pt-6 ">
          <h2 className="text-2xl font-semibold font-headline mb-4">Reseñas de Clientes ({reviews.length})</h2>
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="p-4 border rounded-md bg-background">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold">{review.author}</h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} size={16} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{review.date}</p>
                <p className="text-sm text-foreground/90">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-muted-foreground">Aún no hay reseñas para este proveedor.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
