// src/components/products/product-card.tsx
"use client";

import type { Product } from '@/types/product';
import type { Supplier } from '@/types/supplier';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  supplier: Supplier;
}

export default function ProductCard({ product, supplier }: ProductCardProps) {
  // Pre-formats a descriptive message for the quotation request
  const problemDescription = `Estoy interesado/a en cotizar el siguiente producto: ${product.name} (ID: ${product.id}). Por favor, proporcionar detalles y precio.`;
  
  return (
    <Card className="flex flex-col h-full bg-background hover:shadow-md transition-shadow">
      <CardHeader>
        {product.imageUrl && (
          <div className="relative w-full h-40 mb-3 overflow-hidden rounded-md border">
            <Image
              src={product.imageUrl}
              alt={`Imagen de ${product.name}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={product.dataAiHint || "producto construccion"}
            />
          </div>
        )}
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.category}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 mb-2 line-clamp-3" title={product.description}>
          {product.description}
        </p>
        <p className="font-bold text-primary text-lg">
          ${(product.price || 0).toLocaleString('es-CO')}
          <span className="text-sm font-normal text-muted-foreground"> / {product.unit}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href={`/request-quotation?handymanId=${supplier.id}&handymanName=${encodeURIComponent(supplier.companyName)}&problem=${encodeURIComponent(problemDescription)}`}>
            <MessageSquare size={16} className="mr-2"/> Solicitar Cotización
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
