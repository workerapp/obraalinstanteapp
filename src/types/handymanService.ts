
// src/types/handymanService.ts
import type { Timestamp } from 'firebase/firestore';

export type PriceType = "fijo" | "porHora" | "porProyecto" | "consultar";

export interface HandymanService {
  id?: string; // Firestore document ID
  handymanUid: string;
  name: string;
  category: string;
  description: string;
  priceType: PriceType;
  priceValue?: string | null; // Can be string or null
  currency?: string; // e.g., "COP" - por ahora lo dejaremos opcional
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
