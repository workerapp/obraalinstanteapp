// src/components/reviews/review-form.tsx
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitReview } from '@/actions/submit-review';

const reviewSchema = z.object({
  rating: z.number().min(1, 'La calificación es requerida.').max(5),
  comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres.').max(500),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  targetId: string;
  targetName: string;
  authorId: string;
  authorName: string;
  requestId: string;
  onReviewSubmit: () => void;
}

export function ReviewForm({ targetId, targetName, authorId, authorName, requestId, onReviewSubmit }: ReviewFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    const result = await submitReview({
      ...data,
      targetId,
      authorId,
      authorName,
      requestId,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: '¡Reseña Enviada!', description: 'Gracias por tus comentarios.' });
      onReviewSubmit(); // Close the dialog
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">Estás calificando a <span className="font-bold text-primary">{targetName}</span>.</p>
        
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calificación General</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => field.onChange(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          field.value >= star
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentario</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe tu experiencia con el profesional..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enviar Reseña
        </Button>
      </form>
    </Form>
  );
}
