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

export default function ServiceDetailFooter({ service }: ServiceDetailFooterProps) {
  const { toast } = useToast();

  return (
    <footer className="mt-8 pt-6 border-t">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
              <Link href={`/request-quotation?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`}>Solicitar Cotización</Link>
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
