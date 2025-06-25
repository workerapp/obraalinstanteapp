
// src/types/service.ts
import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id?: string; // Firestore document ID
  name: string;
  description: string;
  category: string;
  iconName?: string | null;
  imageUrl?: string | null;
  dataAiHint?: string | null;
  commonTasks: string[];
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
