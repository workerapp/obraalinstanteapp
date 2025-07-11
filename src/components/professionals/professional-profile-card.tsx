// src/components/professionals/professional-profile-card.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Professional } from '@/types/professional';
import { Star, MapPin, CalendarDays } from 'lucide-react';

interface ProfessionalProfileCardProps {
  professional: Professional;
}

export default function ProfessionalProfileCard({ professional }: ProfessionalProfileCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className="p-0">
        {professional.imageUrl && (
          <div className="relative w-full h-56 bg-muted">
            <Image
              src={professional.imageUrl}
              alt={professional.name}
              layout="fill"
              objectFit="contain"
              className="rounded-t-md p-2"
              data-ai-hint={professional.dataAiHint || "persona retrato"}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-1">{professional.name}</CardTitle>
        <CardDescription className="text-sm text-primary mb-3">{professional.tagline}</CardDescription>
        
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="font-semibold">{professional.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({professional.reviewsCount} reseñas)</span>
        </div>

        {professional.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin size={14} /> {professional.location}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <CalendarDays size={14} /> {professional.memberSince}
        </div>

        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Habilidades Principales:</p>
          <div className="flex flex-wrap gap-2">
            {professional.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
            ))}
            {professional.skills.length > 3 && <Badge variant="outline" className="text-xs">+{professional.skills.length - 3} más</Badge>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/professionals/${professional.id}`}>Ver Perfil y Contactar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
