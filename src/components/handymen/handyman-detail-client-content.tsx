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

export default function HandymanDetailClientContent({ handyman, reviews }: HandymanDetailClientContentProps) {
  const { toast } = useToast();

  if (!handyman) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Handyman data is unavailable.</h1>
        <Button asChild className="mt-4">
          <Link href="/handymen">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  const handleWhatsAppContact = () => {
    if (handyman.phone) {
      const phoneNumber = handyman.phone.replace(/\D/g, ''); // Remove non-digit characters
      const message = encodeURIComponent(`Hello ${handyman.name}, I'm interested in your services listed on Manitas Listas.`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        title: "Contact Info Missing",
        description: "This handyman has not provided a WhatsApp contact number.",
        variant: "destructive",
      });
      console.log('Contact handyman (no phone):', handyman.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/handymen" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Directory
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
                  data-ai-hint={handyman.dataAiHint || "person professional"}
                />
              </div>
            )}
             <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 mb-2">
              <Link href={`/request-quotation?handymanId=${handyman.id}`}>
                <MessageSquare size={18} className="mr-2" /> Request Service
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
              <span className="text-sm text-muted-foreground">({handyman.reviewsCount} reviews)</span>
            </div>

            <div className="space-y-2 text-foreground/90 mb-6">
              {handyman.location && (
                <p className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {handyman.location}</p>
              )}
              <p className="flex items-center gap-2"><CalendarDays size={18} className="text-accent" /> {handyman.memberSince}</p>
            </div>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold font-headline mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {handyman.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm">
                    <CheckCircle size={14} className="mr-1 text-green-600" /> {skill}
                  </Badge>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold font-headline mb-3">About Me (Placeholder)</h2>
              <p className="text-foreground/80 leading-relaxed">
                With over 10 years of experience in the field, I am dedicated to providing high-quality workmanship and excellent customer service. I specialize in a variety of home repair and improvement tasks, ensuring every job is done right the first time. My goal is to help you maintain and enhance your home with reliable and efficient service.
              </p>
            </section>
          </div>
        </div>
        
        {/* Reviews Section - Mockup */}
        <section className="mt-10 pt-6 border-t">
          <h2 className="text-2xl font-semibold font-headline mb-4">Customer Reviews ({reviews.length})</h2>
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
            {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet for this handyman.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
