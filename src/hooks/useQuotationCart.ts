// src/hooks/useQuotationCart.ts
'use client';

import { create } from 'zustand';
import type { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';

interface CartState {
  items: Product[];
  supplierId: string | null;
  supplierName: string | null;
  addItem: (product: Product, newSupplierId: string, newSupplierName: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getCartItems: () => Product[];
  getCartCount: () => number;
}

export const useQuotationCart = create<CartState>((set, get) => ({
  items: [],
  supplierId: null,
  supplierName: null,

  addItem: (product, newSupplierId, newSupplierName) => {
    const { supplierId, items, clearCart } = get();

    if (supplierId && supplierId !== newSupplierId) {
      // If adding from a different supplier, clear the cart first.
      // A confirmation dialog is a good future improvement.
      clearCart();
      toast({
        title: "Lista de cotización reiniciada",
        description: `Tu lista anterior ha sido vaciada. Ahora estás añadiendo productos de ${newSupplierName}.`,
      });
      // After clearing, we need to re-evaluate the state for the new item.
      set({
        items: [product],
        supplierId: newSupplierId,
        supplierName: newSupplierName,
      });
      return;
    }
    
    const productExists = items.find((item) => item.id === product.id);
    if (productExists) {
      toast({
        title: "Producto ya en la lista",
        description: `"${product.name}" ya ha sido añadido a tu lista de cotización.`,
        variant: "default",
      });
      return; // Do not add again
    }

    set((state) => ({
      items: [...state.items, product],
      supplierId: newSupplierId,
      supplierName: newSupplierName,
    }));
  },

  removeItem: (productId) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== productId);
      // If the cart is empty after removing the item, also clear supplier info
      if (newItems.length === 0) {
        return { items: [], supplierId: null, supplierName: null };
      }
      return { items: newItems };
    }),

  clearCart: () => set({ items: [], supplierId: null, supplierName: null }),
  
  getCartItems: () => get().items,
  
  getCartCount: () => get().items.length,

}));
