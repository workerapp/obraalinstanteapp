// src/types/supplier.ts
export interface Supplier {
  id: string; // Firebase UID
  companyName: string;
  tagline?: string;
  categories?: string[]; // e.g., 'Ferretería', 'Materiales de Construcción', 'Acabados'
  rating?: number;
  reviewsCount?: number;
  logoUrl?: string;
  dataAiHint?: string;
  location?: string;
  memberSince?: string;
  phone?: string;
  about?: string;
  isApproved?: boolean;
}
