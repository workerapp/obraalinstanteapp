// src/types/service.ts
import type { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName?: string; // For Lucide icon name string
  imageUrl?: string; // Optional image URL
  averagePrice?: string | null; // e.g., "$50 - $100" or "Starting from $75/hr" - Now optional
  commonTasks: string[];
  dataAiHint?: string; // For placeholder image search
}

