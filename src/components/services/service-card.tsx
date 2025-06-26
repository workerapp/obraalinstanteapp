
// src/components/services/service-card.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Service } from '@/types/service';
import { Badge } from '@/components/ui/badge';

interface ServiceCardProps {
  service: Service;
}

// A helper function to get Lucide icon component by name string
const getIcon = (name?: string | null): LucideIcon => {
  const defaultIcon = LucideIcons.Settings;
  if (!name || name.trim() === '') return defaultIcon;

  // Sanitize name: "Paint Brush" -> "PaintBrush", "wrench" -> "Wrench"
  const processedName = name.replace(/\s/g, ''); // Remove spaces
  const finalName = processedName.charAt(0).toUpperCase() + processedName.slice(1);

  if (Object.prototype.hasOwnProperty.call(LucideIcons, finalName)) {
    return LucideIcons[finalName as keyof typeof LucideIcons];
  }
  
  console.warn(`Lucide icon "${finalName}" (from input "${name}") not found. Defaulting to "Settings".`);
  return defaultIcon;
};


export default function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = getIcon(service.iconName);

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader>
        {service.imageUrl && (
          <div className="relative w-full h-48 mb-4">
            <Image
              src={service.imageUrl}
              alt={service.name}
              layout="fill"
              objectFit="cover"
              className="rounded-t-md"
              data-ai-hint={service.dataAiHint || "servicio operario"}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          {IconComponent && <IconComponent className="h-8 w-8 text-primary" />}
          <CardTitle className="text-2xl font-headline">{service.name}</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground h-20 overflow-hidden text-ellipsis">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <p className="text-sm font-medium">Tareas Comunes:</p>
          <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
            {service.commonTasks.slice(0, 3).map((task, index) => (
              <li key={index}>{task}</li>
            ))}
            {service.commonTasks.length > 3 && <li>...y más</li>}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/services/${service.id}`}>Ver Detalles y Solicitar Cotización</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
