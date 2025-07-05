// src/types/review.ts
import type { Timestamp } from 'firebase/firestore';

export interface Review {
  id?: string;
  rating: number;
  comment: string;
  authorId: string;
  authorName: string;
  targetId: string; // ID of the user being reviewed (handyman/supplier)
  requestId: string;
  createdAt: Timestamp;
}
