// src/types/handyman.ts
export interface Handyman {
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
  aboutMe?: string;
  isApproved?: boolean; // Estado de aprobación del operario
}
