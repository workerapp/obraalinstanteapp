// src/components/products/product-card.tsx
"use client";

import type { Product } from '@/types/product';
import type { Supplier } from '@/types/supplier';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useQuotationCart } from '@/hooks/useQuotationCart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  supplier: Supplier;
}

export default function ProductCard({ product, supplier }: ProductCardProps) {
  const { addItem } = useQuotationCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!product.id) return;
    addItem(product, supplier.id, supplier.companyName);
    toast({
        title: "Producto Añadido",
        description: `"${product.name}" fue añadido a tu lista.`,
    });
  };
  
  return (
    <Card className="flex flex-col h-full bg-background hover:shadow-md transition-shadow">
      <CardHeader>
        {product.imageUrl && (
          <div className="relative w-full h-40 mb-3 overflow-hidden rounded-md border bg-muted">
            <Image
              src={product.imageUrl}
              alt={`Imagen de ${product.name}`}
              layout="fill"
              objectFit="contain"
              className="p-2"
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
        <Button size="sm" className="w-full" onClick={handleAddToCart}>
            <PlusCircle size={16} className="mr-2"/> Añadir a la Lista
        </Button>
      </CardFooter>
    </Card>
  );
}
