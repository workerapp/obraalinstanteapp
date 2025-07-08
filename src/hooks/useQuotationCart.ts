// src/hooks/useQuotationCart.ts
'use client';

import { create } from 'zustand';
import type { Product } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

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

// We use a separate function to get the toast hook's state
// to avoid issues with using a hook inside a non-component function.
const showToast = (toastConfig: { title: string; description: string; variant?: "default" | "destructive" }) => {
    const { toast } = useToast.getState();
    toast(toastConfig);
};

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
      showToast({
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
      showToast({
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
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),

  clearCart: () => set({ items: [], supplierId: null, supplierName: null }),
  
  getCartItems: () => get().items,
  
  getCartCount: () => get().items.length,

}));
