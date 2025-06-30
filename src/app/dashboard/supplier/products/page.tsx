// src/app/dashboard/supplier/products/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function SupplierProductsPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <Wrench className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">Página en Construcción</CardTitle>
          <CardDescription>
            La funcionalidad para gestionar tu catálogo de productos estará disponible muy pronto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pronto podrás añadir, editar y eliminar los productos que ofreces a los clientes.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/supplier">Volver al Panel de Proveedor</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
