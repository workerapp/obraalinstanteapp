// src/app/handymen/[id]/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Handyman } from '@/types/handyman';
import type { HandymanService } from '@/types/handymanService';
import type { Review } from '@/types/review';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, CalendarDays, MessageSquare, Phone, CheckCircle, Briefcase, Tag, Loader2, UserCircle2, AlertTriangle, StarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+573017412292";

const mapFirestoreUserToHandyman = (uid: string, userData: any): Handyman | null => {
  if (!userData || userData.role !== 'handyman' || userData.isApproved !== true) {
    return null;
  }

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
    } catch (e: any) {
      console.error(`Error formatting date for UID ${uid}: ${e.message}`);
    }
  }

  return {
    id: uid,
    name: userData.displayName || `Operario ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Operario profesional y confiable',
    aboutMe: userData.aboutMe || undefined,
    skills: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Servicios Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    imageUrl: userData.photoURL || userData.imageUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'persona profesional',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    phone: userData.phone || undefined,
    isApproved: userData.isApproved || false,
  };
};

const fetchHandymanProfile = async (handymanId: string): Promise<Handyman | null> => {
  if (!handymanId) return null;
  const userDocRef = doc(firestore, "users", handymanId);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    throw new Error("El perfil de este operario no fue encontrado.");
  }
  const userData = userDocSnap.data();
  const handyman = mapFirestoreUserToHandyman(handymanId, userData);
  if (!handyman) {
    throw new Error("Este usuario no es un operario aprobado o su perfil no está disponible.");
  }
  return handyman;
};

const priceTypeTranslations: Record<HandymanService['priceType'], string> = {
  fijo: "Fijo", porHora: "Por Hora", porProyecto: "Por Proyecto", consultar: "Consultar Cotización",
};

async function fetchServicesForHandyman(handymanId: string): Promise<HandymanService[]> {
  if (!handymanId) return [];
  
  const servicesRef = collection(firestore, "handymanServices");
  const q = query(
    servicesRef, 
    where("handymanUid", "==", handymanId), 
    where("isActive", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  const services: HandymanService[] = [];
  querySnapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() } as HandymanService);
  });
  return services;
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

export default function HandymanDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const handymanId = typeof params.id === 'string' ? params.id : '';

  const { data: handyman, isLoading: isLoadingHandyman, error: handymanError } = useQuery({
    queryKey: ['handymanProfile', handymanId],
    queryFn: () => fetchHandymanProfile(handymanId),
    enabled: !!handymanId,
    retry: 1,
  });

  const { data: offeredServices, isLoading: isLoadingServices, error: servicesError } = useQuery({
    queryKey: ['handymanServices', handymanId],
    queryFn: () => fetchServicesForHandyman(handymanId),
    enabled: !!handymanId,
  });
  
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['handymanReviews', handymanId],
    queryFn: () => fetchReviewsForUser(handymanId),
    enabled: !!handymanId,
  });

  if (isLoadingHandyman) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (handymanError) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Perfil</AlertTitle>
          <AlertDescription>{(handymanError as Error).message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  if (!handyman) {
    notFound();
  }

  const handleWhatsAppContact = () => {
    if (!ADMIN_WHATSAPP_NUMBER) {
      toast({ title: "Configuración Requerida", description: "El número de WhatsApp del administrador no ha sido configurado.", variant: "destructive" });
      return;
    }
    const adminPhoneNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola, quisiera contactar al operario ${handyman.name} (ID: ${handyman.id}) sobre un servicio.`);
    window.open(`https://wa.me/${adminPhoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/handymen" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Volver al Directorio
          </Link>
        </Button>
      </div>

      <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md mb-4 bg-muted">
              <Image src={handyman.imageUrl!} alt={handyman.name} layout="fill" objectFit="contain" className="p-2" data-ai-hint={handyman.dataAiHint || "persona profesional"} />
            </div>
            <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 mb-2">
              <Link href={`/request-quotation?handymanId=${handyman.id}&handymanName=${encodeURIComponent(handyman.name)}`}>
                <MessageSquare size={18} className="mr-2" /> Solicitar Cotización General
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleWhatsAppContact}>
              <Phone size={18} className="mr-2" /> Contactar vía Administrador
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">La comunicación inicial se gestiona a través del administrador.</p>
          </div>

          <div className="md:col-span-2">
            <h1 className="text-4xl font-headline font-bold text-primary mb-1">{handyman.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{handyman.tagline}</p>

            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-semibold">{handyman.rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">({handyman.reviewsCount || 0} reseñas)</span>
            </div>

            <div className="space-y-2 text-foreground/90 mb-6">
              {handyman.location && <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {handyman.location}</p>}
              {handyman.memberSince && <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {handyman.memberSince}</p>}
            </div>

            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3">Habilidades Generales</h2>
              <div className="flex flex-wrap gap-2">
                {handyman.skills?.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>) || <p>No especificado</p>}
              </div>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3 flex items-center"><UserCircle2 size={22} className="mr-2 text-accent"/> Sobre Mí</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{handyman.aboutMe || 'No hay descripción disponible.'}</p>
            </section>
          </div>
        </div>
        <Separator className="my-8" />
        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center"><Briefcase size={24} className="mr-3 text-primary" /> Servicios Ofrecidos</h2>
          {isLoadingServices && <div className="flex items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /><p>Cargando servicios...</p></div>}
          {servicesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>No se pudieron cargar los servicios.</AlertDescription></Alert>}
          {!isLoadingServices && !servicesError && (offeredServices && offeredServices.length > 0 ? (
            <div className="space-y-4">
              {offeredServices.map((service) => (
                <Card key={service.id} className="bg-background hover:shadow-md transition-shadow">
                  <CardHeader><CardTitle className="text-xl text-accent">{service.name}</CardTitle><CardDescription>{service.category}</CardDescription></CardHeader>
                  <CardContent><p className="text-sm text-foreground/80 mb-3">{service.description}</p></CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Badge variant="outline" className="border-primary text-primary">{priceTypeTranslations[service.priceType]}{service.priceType !== 'consultar' && ` - $${Number(service.priceValue).toLocaleString('es-CO')}`}</Badge>
                    <Button asChild size="sm">
                      <Link href={`/request-quotation?serviceId=${service.id}&handymanId=${handyman.id}&handymanName=${encodeURIComponent(handyman.name)}&serviceName=${encodeURIComponent(service.name)}`}>
                        <MessageSquare size={16} className="mr-2"/> Cotizar
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">Este operario no ha publicado servicios específicos.</p>
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
            !isLoadingReviews && <p className="text-muted-foreground text-center py-6">Este operario aún no tiene reseñas.</p>
          )}
        </section>
      </div>
    </div>
  );
}
