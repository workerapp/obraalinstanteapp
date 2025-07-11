// src/types/professional.ts
export interface Professional {
  id: string; // Firebase UID
  name: string;
  tagline?: string;
  skills?: string[];
  rating?: number; 
  reviewsCount?: number;
  imageUrl?: string;
  location?: string; 
  memberSince?: string; 
  dataAiHint?: string;
  phone?: string;
  about?: string;
  isApproved?: boolean; // Estado de aprobación del profesional
}
