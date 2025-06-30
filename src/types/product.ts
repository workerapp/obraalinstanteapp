// src/types/product.ts
import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string; // Firestore document ID
  supplierUid: string;
  name: string;
  category: string; // e.g., 'Cemento', 'Pintura', 'Herramientas'
  description: string;
  price: number;
  unit: string; // e.g., 'bulto', 'galón', 'unidad'
  currency?: string;
  isActive: boolean;
  imageUrl?: string;
  dataAiHint?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
