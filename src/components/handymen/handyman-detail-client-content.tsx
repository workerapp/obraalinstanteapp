
// src/components/handymen/handyman-detail-client-content.tsx
"use client";

import type { Handyman } from '@/types/handyman';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, CalendarDays, MessageSquare, Phone, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

// TODO: Reemplaza este número con tu número de WhatsApp de administrador, incluyendo el código de país.
const ADMIN_WHATSAPP_NUMBER = "TU_NUMERO_DE_WHATSAPP_AQUI"; // Ejemplo: "+573001234567"

export default function HandymanDetailClientContent({ handyman, reviews }: HandymanDetailClientContentProps) {
  const { toast } = useToast();

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
    if (ADMIN_WHATSAPP_NUMBER === "TU_NUMERO_DE_WHATSAPP_AQUI" || !ADMIN_WHATSAPP_NUMBER) {
       toast({
        title: "Configuración Requerida",
        description: "El número de WhatsApp del administrador no ha sido configurado.",
        variant: "destructive",
      });
      console.warn('El número de WhatsApp del administrador no está configurado en HandymanDetailClientContent.tsx');
      return;
    }
    const adminPhoneNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, ''); // Remove non-digit characters
    const message = encodeURIComponent(`Hola, estoy interesado/a en los servicios de ${handyman.name} que vi en Obra al Instante.`);
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
              <Link href={`/request-quotation?handymanId=${handyman.id}`}>
                <MessageSquare size={18} className="mr-2" /> Solicitar Cotización
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleWhatsAppContact}>
              <Phone size={18} className="mr-2" /> Contactar por WhatsApp
            </Button>
          </div>

          <div className="md:col-span-2">
            <h1 className="text-4xl font-headline font-bold text-primary mb-1">{handyman.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{handyman.tagline}</p>

            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-semibold">{handyman.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({handyman.reviewsCount} reseñas)</span>
            </div>

            <div className="space-y-2 text-foreground/90 mb-6">
              {handyman.location && (
                <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {handyman.location}</p>
              )}
              <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {handyman.memberSince}</p>
              {/* Se podría mostrar el teléfono del operario aquí si se desea, pero el botón de contacto va al admin */}
              {/* handyman.phone && <p className="flex items-center gap-2"><Phone size={18} className="text-accent" /> {handyman.phone} (Solo visible, contacto vía admin)</p> */}
            </div>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold font-headline mb-3">Habilidades</h2>
              <div className="flex flex-wrap gap-2">
                {handyman.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm">
                    <CheckCircle size={14} className="mr-1 text-green-600" /> {skill}
                  </Badge>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold font-headline mb-3">Sobre Mí (Ejemplo)</h2>
              <p className="text-foreground/80 leading-relaxed">
                Con más de 10 años de experiencia en el campo, me dedico a proporcionar mano de obra de alta calidad y un excelente servicio al cliente. Me especializo en una variedad de tareas de reparación y mejora del hogar, asegurando que cada trabajo se haga bien a la primera. Mi objetivo es ayudarte a mantener y mejorar tu hogar con un servicio confiable y eficiente.
              </p>
            </section>
          </div>
        </div>
        
        <section className="mt-10 pt-6 border-t">
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
