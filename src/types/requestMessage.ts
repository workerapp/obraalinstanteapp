// src/types/requestMessage.ts
import type { Timestamp } from 'firebase/firestore';

export interface RequestMessage {
  id: string; // Firestore document ID
  text?: string; // Text is now optional for image-only messages
  imageUrl?: string; // Optional URL for an image
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'handyman' | 'admin' | 'supplier';
  createdAt: Timestamp;
}
