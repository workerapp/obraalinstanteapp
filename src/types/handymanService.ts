
// src/types/handymanService.ts
import type { Timestamp } from 'firebase/firestore';

export type PriceType = "fijo" | "porHora" | "porProyecto" | "consultar";

export interface HandymanService {
  id?: string; // Firestore document ID
  handymanUid: string;
  name: string;
  category: string;
  description: string; // This will be the detailed description
  priceType: PriceType;
  priceValue?: string | null;
  currency?: string;
  isActive: boolean;
  imageUrl?: string; // Optional: URL for an example image of the service
  dataAiHint?: string; // Optional: Hint for AI if imageUrl is a placeholder
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

