
// src/components/handymen/handyman-profile-card.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Handyman } from '@/types/handyman';
import { Star, MapPin, CalendarDays } from 'lucide-react';

interface HandymanProfileCardProps {
  handyman: Handyman;
}

export default function HandymanProfileCard({ handyman }: HandymanProfileCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className="p-0">
        {handyman.imageUrl && (
          <div className="relative w-full h-56">
            <Image
              src={handyman.imageUrl}
              alt={handyman.name}
              layout="fill"
              objectFit="cover"
              className="rounded-t-md"
              data-ai-hint={handyman.dataAiHint || "persona retrato"}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-1">{handyman.name}</CardTitle>
        <CardDescription className="text-sm text-primary mb-3">{handyman.tagline}</CardDescription>
        
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="font-semibold">{handyman.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({handyman.reviewsCount} reseñas)</span>
        </div>

        {handyman.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin size={14} /> {handyman.location}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <CalendarDays size={14} /> {handyman.memberSince}
        </div>

        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Habilidades Principales:</p>
          <div className="flex flex-wrap gap-2">
            {handyman.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
            ))}
            {handyman.skills.length > 3 && <Badge variant="outline" className="text-xs">+{handyman.skills.length - 3} más</Badge>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/handymen/${handyman.id}`}>Ver Perfil y Contactar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
