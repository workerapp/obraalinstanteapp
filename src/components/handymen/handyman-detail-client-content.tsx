
// src/components/handymen/handyman-detail-client-content.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Handyman } from '@/types/handyman';
import type { HandymanService } from '@/types/handymanService'; // Import HandymanService type
import { firestore } from '@/firebase/clientApp'; // Import firestore
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'; // Import firestore functions
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, CalendarDays, MessageSquare, Phone, CheckCircle, Briefcase, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; 
import { Separator } from '@/components/ui/separator'; 

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface HandymanDetailClientContentProps {
  handyman: Handyman; 
  reviews: Review[];
}

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+573017412292"; 

const priceTypeTranslations: Record<HandymanService['priceType'], string> = {
  fijo: "Fijo",
  porHora: "Por Hora",
  porProyecto: "Por Proyecto",
  consultar: "Consultar Cotización",
};

async function fetchServicesForHandyman(handymanId: string): Promise<HandymanService[]> {
  if (!handymanId) return [];
  
  const servicesRef = collection(firestore, "handymanServices");
  const q = query(
    servicesRef, 
    where("handymanUid", "==", handymanId), 
    where("isActive", "==", true), 
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  const services: HandymanService[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    services.push({ 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    } as HandymanService);
  });
  return services;
}


export default function HandymanDetailClientContent({ handyman, reviews }: HandymanDetailClientContentProps) {
  const { toast } = useToast();
  const [offeredServices, setOfferedServices] = useState<HandymanService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    if (handyman?.id) {
      setIsLoadingServices(true);
      setServicesError(null);
      fetchServicesForHandyman(handyman.id)
        .then(setOfferedServices)
        .catch(err => {
          console.error("Error fetching handyman services for profile:", err);
          let description = "No se pudieron cargar los servicios de este operario.";
          if (err.message && (err.message.toLowerCase().includes('permission-denied') || err.message.toLowerCase().includes('missing or insufficient permissions'))) {
            description = "Error de permisos al cargar los servicios. Verifica las reglas de seguridad de Firestore.";
          } else if (err.message && err.message.toLowerCase().includes('failed-precondition') && err.message.toLowerCase().includes('index')) {
            description = "Error al cargar servicios: Firestore necesita un índice. Revisa la consola del navegador para más detalles (suele haber un enlace para crearlo).";
          }
          setServicesError(description);
        })
        .finally(() => setIsLoadingServices(false));
    } else {
      setIsLoadingServices(false);
    }
  }, [handyman?.id]);

  if (!handyman) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Datos del operario no disponibles.</h1>
        <Button asChild className="mt-4">
          <Link href="/handymen">Volver al Directorio</Link>
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
    
    let skillsText = "";
    if (handyman.skills && handyman.skills.length > 0) {
      skillsText = `, quien ofrece servicios como ${handyman.skills.slice(0, 2).join(', ')}${handyman.skills.length > 2 ? ', entre otros' : ''},`;
    } else {
      skillsText = ",";
    }

    const messageIntro = `Hola, estoy interesado/a en los servicios de ${handyman.name} (ID: ${handyman.id})`;
    const platformMention = ` que vi en Obra al Instante.`;
    const callToAction = ` Por favor, describe detalladamente el servicio que necesitas:`;

    const message = encodeURIComponent(`${messageIntro}${skillsText}${platformMention}${callToAction}`);
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
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
            {handyman.imageUrl && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md mb-4">
                <Image
                  src={handyman.imageUrl}
                  alt={handyman.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={handyman.dataAiHint || "persona profesional"}
                />
              </div>
            )}
             <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 mb-2">
              <Link href={`/request-quotation?handymanId=${handyman.id}&handymanName=${encodeURIComponent(handyman.name)}`}>
                <MessageSquare size={18} className="mr-2" /> Solicitar Cotización General
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleWhatsAppContact}>
              <Phone size={18} className="mr-2" /> Contactar por WhatsApp
            </Button>
             <p className="text-xs text-muted-foreground text-center mt-2">
              El contacto por WhatsApp es con el administrador de la plataforma.
            </p>
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
              {handyman.location && (
                <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {handyman.location}</p>
              )}
              {handyman.memberSince && (
                <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {handyman.memberSince}</p>
              )}
              {/* Teléfono del operario ya no se muestra públicamente aquí para centralizar contacto */}
            </div>

            <section className="mb-6">
              <h2 className="text-xl font-semibold font-headline mb-3">Habilidades Generales</h2>
              <div className="flex flex-wrap gap-2">
                {(handyman.skills && handyman.skills.length > 0) ? handyman.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-secondary/20 text-secondary-foreground border border-secondary/50">
                     {skill}
                  </Badge>
                )) : <p className="text-sm text-muted-foreground">No hay habilidades generales especificadas.</p>}
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold font-headline mb-3">Sobre Mí (Ejemplo)</h2>
              <p className="text-foreground/80 leading-relaxed">
                {handyman.tagline || 'Con experiencia en el campo, me dedico a proporcionar mano de obra de alta calidad y un excelente servicio al cliente. Me especializo en una variedad de tareas de reparación y mejora del hogar, asegurando que cada trabajo se haga bien a la primera. Mi objetivo es ayudarte a mantener y mejorar tu hogar con un servicio confiable y eficiente.'}
              </p>
            </section>
          </div>
        </div>

        <Separator className="my-8" />

        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center">
            <Briefcase size={24} className="mr-3 text-primary" /> Servicios Ofrecidos por {handyman.name}
          </h2>
          {isLoadingServices && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando servicios...</p>
            </div>
          )}
          {servicesError && !isLoadingServices && (
            <div className="text-center py-6 bg-destructive/10 p-4 rounded-md">
              <p className="text-destructive font-medium">Error al Cargar Servicios del Operario</p>
              <p className="text-sm text-destructive/80">{servicesError}</p>
            </div>
          )}
          {!isLoadingServices && !servicesError && offeredServices.length > 0 && (
            <div className="space-y-4">
              {offeredServices.map((service) => (
                <Card key={service.id} className="bg-background hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xl text-accent">{service.name}</CardTitle>
                        <Badge variant="outline" className="border-primary text-primary whitespace-nowrap">
                            {priceTypeTranslations[service.priceType]}
                            {service.priceType !== 'consultar' && service.priceValue && ` - $${Number(service.priceValue).toLocaleString('es-CO')}`}
                        </Badge>
                    </div>
                    <CardDescription className="text-muted-foreground">{service.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 mb-3 line-clamp-3" title={service.description}>{service.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button asChild size="sm">
                      <Link href={`/request-quotation?serviceId=${service.id}&handymanId=${handyman.id}&handymanName=${encodeURIComponent(handyman.name)}&serviceName=${encodeURIComponent(service.name)}`}>
                        <MessageSquare size={16} className="mr-2"/> Solicitar Cotización para este Servicio
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {!isLoadingServices && !servicesError && offeredServices.length === 0 && (
            <p className="text-muted-foreground text-center py-6">
              {handyman.name} aún no ha publicado servicios específicos o no tiene servicios activos en este momento.
            </p>
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
                      <Star key={i} size={16} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{review.date}</p>
                <p className="text-sm text-foreground/90">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-muted-foreground">Aún no hay reseñas para este operario.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

