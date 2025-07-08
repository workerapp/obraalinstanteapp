// src/components/cart/quotation-cart-bar.tsx
"use client";

import { useQuotationCart } from '@/hooks/useQuotationCart';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';

export function QuotationCartBar() {
    const { getCartCount, supplierName } = useQuotationCart();
    const itemCount = getCartCount();

    if (itemCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 w-full animate-in slide-in-from-bottom-10 duration-500">
            <div className="container mx-auto max-w-2xl p-0">
                <div className="flex items-center justify-between rounded-lg bg-primary text-primary-foreground p-4 shadow-lg">
                    <div className="flex flex-col">
                        <span className="font-bold">{itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu lista</span>
                        <span className="text-sm opacity-90">de {supplierName}</span>
                    </div>
                    <Button asChild variant="secondary">
                        <Link href="/request-quotation">
                           <ClipboardList className="mr-2 h-5 w-5"/> Ver Lista y Cotizar
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
