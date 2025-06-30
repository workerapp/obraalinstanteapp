// src/components/suppliers/supplier-profile-card.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Supplier } from '@/types/supplier';
import { Star, MapPin, CalendarDays, Package } from 'lucide-react';

interface SupplierProfileCardProps {
  supplier: Supplier;
}

export default function SupplierProfileCard({ supplier }: SupplierProfileCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className="p-0">
        {supplier.logoUrl && (
          <div className="relative w-full h-56 bg-muted">
            <Image
              src={supplier.logoUrl}
              alt={supplier.companyName}
              layout="fill"
              objectFit="contain" // Use contain for logos to avoid cropping
              className="rounded-t-md p-4"
              data-ai-hint={supplier.dataAiHint || "logo empresa"}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-1">{supplier.companyName}</CardTitle>
        <CardDescription className="text-sm text-primary mb-3">{supplier.tagline}</CardDescription>
        
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="font-semibold">{supplier.rating?.toFixed(1) || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">({supplier.reviewsCount || 0} reseñas)</span>
        </div>

        {supplier.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin size={14} /> {supplier.location}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <CalendarDays size={14} /> {supplier.memberSince}
        </div>

        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Categorías Principales:</p>
          <div className="flex flex-wrap gap-2">
            {supplier.categories?.slice(0, 3).map((category) => (
              <Badge key={category} variant="outline" className="text-xs">{category}</Badge>
            ))}
            {supplier.categories && supplier.categories.length > 3 && <Badge variant="outline" className="text-xs">+{supplier.categories.length - 3} más</Badge>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/suppliers/${supplier.id}`}>Ver Perfil y Productos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
