// src/app/professionals/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { Professional } from '@/types/professional';
import ProfessionalProfileCard from '@/components/professionals/professional-profile-card';
import { Users, AlertTriangle, SearchX, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';

// This function now fetches data from our API route
async function fetchProfessionalsFromApi(): Promise<{ professionals: Professional[]; error?: string }> {
    const response = await fetch('/api/professionals');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch professionals');
    }
    return response.json();
}

function ProfessionalsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col h-full shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="p-0">
            <Skeleton className="h-56 w-full" />
          </CardHeader>
          <CardContent className="pt-6 flex-grow">
            <Skeleton className="h-7 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function ProfessionalsPage() {
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Set initial category from URL, but only once.
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : null;
    if(categoryFromUrl) {
        setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['allProfessionals'],
    queryFn: fetchProfessionalsFromApi, // Use the new API fetching function
  });
  
  const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const allCategories = useMemo(() => {
    if (!data?.professionals) return [];
    // Use a Map to store unique categories, ignoring case/accent, but preserving original casing for display.
    const categories = new Map<string, string>();
    data.professionals.forEach(h => h.skills?.forEach(s => {
      if (s) {
          const normalized = normalizeString(s);
          if (!categories.has(normalized)) {
            categories.set(normalized, s);
          }
      }
    }));
    return Array.from(categories.values()).sort((a, b) => a.localeCompare(b));
  }, [data?.professionals]);

  const filteredProfessionals = useMemo(() => {
    if (!data?.professionals) return [];

    const skillNormalizationMap: { [key: string]: string } = {
        'plomero': 'plomeria',
        'fontanero': 'plomeria',
        'carpintero': 'carpinteria',
        'electricista': 'electricidad',
        'albanil': 'albanileria',
        'pintor': 'pintura',
        'soldador': 'soldadura'
    };
    
    const tradeToProfessions: { [key: string]: string[] } = {};
    for (const [profession, trade] of Object.entries(skillNormalizationMap)) {
        if (!tradeToProfessions[trade]) tradeToProfessions[trade] = [];
        tradeToProfessions[trade].push(profession);
    }
    
    let categorySearchKeywords = new Set<string>();
    if (selectedCategory) {
        const normalizedCategory = normalizeString(selectedCategory.trim());
        categorySearchKeywords.add(normalizedCategory);

        const relatedTrade = skillNormalizationMap[normalizedCategory];
        if (relatedTrade) {
            categorySearchKeywords.add(relatedTrade);
            tradeToProfessions[relatedTrade]?.forEach(prof => categorySearchKeywords.add(prof));
        }

        const relatedProfessions = tradeToProfessions[normalizedCategory];
        if (relatedProfessions) {
            relatedProfessions.forEach(prof => categorySearchKeywords.add(prof));
        }
    }

    return data.professionals
      .filter(professional => {
        // Category filter using the expanded keyword set
        if (selectedCategory) {
            if (categorySearchKeywords.size === 0) return true; // Should not happen if category is selected but as a safeguard.
            return professional.skills?.some(skill => {
                const normalizedSkill = normalizeString(skill.trim());
                for (const keyword of categorySearchKeywords) {
                    if (normalizedSkill.includes(keyword)) {
                        return true;
                    }
                }
                return false;
            });
        }
        return true;
      })
      .filter(professional => {
        // General text search filter
        const normalizedTerm = normalizeString(searchTerm.trim());
        if (normalizedTerm === '') return true;
        
        return (
          normalizeString(professional.name).includes(normalizedTerm) ||
          (professional.tagline && normalizeString(professional.tagline).includes(normalizedTerm)) ||
          professional.skills?.some(skill => normalizeString(skill).includes(normalizedTerm))
        );
      });
  }, [data?.professionals, searchTerm, selectedCategory]);


  const fetchError = data?.error || (isError ? (queryError as Error).message : null);

  const pageTitle = selectedCategory ? `Profesionales de ${selectedCategory}` : "Encuentra un Profesional";
  const pageDescription = selectedCategory 
    ? `Explora nuestro directorio de profesionales calificados en ${selectedCategory}.`
    : "Explora nuestro directorio de profesionales calificados y de confianza. Usa la búsqueda y los filtros para encontrar a la persona perfecta.";

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-2">{pageTitle}</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{pageDescription}</p>
      </section>
      
      <Card className="p-4 mb-8 shadow-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, habilidad, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Filtrar por categoría:</p>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {allCategories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && <ProfessionalsGridSkeleton />}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Profesionales</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && filteredProfessionals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => (
            <ProfessionalProfileCard key={professional.id} professional={professional} />
          ))}
        </div>
      )}

      {!isLoading && !fetchError && filteredProfessionals.length === 0 && (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">
            No se encontraron resultados
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta ajustar tu búsqueda o filtros.
          </p>
          {(searchTerm || selectedCategory) && (
             <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
