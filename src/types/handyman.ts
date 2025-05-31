// src/types/handyman.ts
export interface Handyman {
  id: string;
  name: string;
  tagline: string;
  skills: string[];
  rating: number; // e.g., 4.5
  reviewsCount: number;
  imageUrl?: string;
  location?: string; // e.g., "City, State" or general area
  memberSince: string; // e.g., "Joined Jan 2022"
  dataAiHint?: string;
  phone?: string; // Phone number for WhatsApp contact
}
