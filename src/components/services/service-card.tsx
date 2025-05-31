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
const getIcon = (name?: string): LucideIcon | null => {
  if (!name || !(name in LucideIcons)) return LucideIcons.Settings; // Default icon
  return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon;
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
              data-ai-hint={service.dataAiHint || "service handyman"}
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
          <p className="text-sm font-medium">Common Tasks:</p>
          <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
            {service.commonTasks.slice(0, 3).map((task, index) => (
              <li key={index}>{task}</li>
            ))}
            {service.commonTasks.length > 3 && <li>...and more</li>}
          </ul>
          {/* Removed averagePrice display
          {service.averagePrice && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-sm">
                Avg. Price: {service.averagePrice}
              </Badge>
            </div>
          )}
          */}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/services/${service.id}`}>View Details & Request Quote</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

