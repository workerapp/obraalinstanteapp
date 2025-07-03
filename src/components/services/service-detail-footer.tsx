// src/components/services/service-detail-footer.tsx
"use client";

import type { Service } from '@/types/service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceDetailFooterProps {
  service: Service;
}

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+573017412292";

export default function ServiceDetailFooter({ service }: ServiceDetailFooterProps) {
  const { toast } = useToast();

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
    
    const messageText = `Hola, estoy interesado/a en el servicio de "${service.name}" que vi en Obra al Instante y quisiera más información. ¿Pueden ayudarme?`;
    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <footer className="mt-8 pt-6 border-t">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
              <Link href={`/request-quotation?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`}>Solicitar Cotización</Link>
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto shadow-md" onClick={handleWhatsAppContact}>
                <Phone size={18} className="mr-2" /> Contactar por WhatsApp
            </Button>
        </div>
        <Button variant="outline" size="lg" asChild className="w-full sm:w-auto shadow-md">
          <Link href={`/handymen?category=${encodeURIComponent(service.category)}`} className="flex items-center gap-2">
            <Users size={18} /> Buscar un Operario
          </Link>
        </Button>
      </div>
    </footer>
  );
}
