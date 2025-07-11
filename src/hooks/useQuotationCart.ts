// src/hooks/useQuotationCart.ts
'use client';

import { create } from 'zustand';
import type { CartItem, Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';

interface CartState {
  items: CartItem[];
  supplierId: string | null;
  supplierName: string | null;
  addItem: (product: Product, quantity: number, newSupplierId: string, newSupplierName: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getCartItems: () => CartItem[];
  getCartCount: () => number;
  getCartTotal: () => number;
}

export const useQuotationCart = create<CartState>((set, get) => ({
  items: [],
  supplierId: null,
  supplierName: null,

  addItem: (product, quantity, newSupplierId, newSupplierName) => {
    const { supplierId, items, clearCart } = get();

    if (supplierId && supplierId !== newSupplierId) {
      clearCart();
      toast({
        title: "Lista de cotización reiniciada",
        description: `Tu lista anterior ha sido vaciada. Ahora estás añadiendo productos de ${newSupplierName}.`,
      });
      set({
        items: [{ ...product, quantity }],
        supplierId: newSupplierId,
        supplierName: newSupplierName,
      });
      return;
    }
    
    const existingItemIndex = items.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      // If product exists, update its quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      set({ items: updatedItems });
    } else {
      // If product doesn't exist, add it to the cart
       set((state) => ({
        items: [...state.items, { ...product, quantity }],
        supplierId: newSupplierId,
        supplierName: newSupplierName,
      }));
    }
  },

  removeItem: (productId) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== productId);
      if (newItems.length === 0) {
        return { items: [], supplierId: null, supplierName: null };
      }
      return { items: newItems };
    }),

  clearCart: () => set({ items: [], supplierId: null, supplierName: null }),
  
  getCartItems: () => get().items,
  
  getCartCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
  
  getCartTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),

}));
