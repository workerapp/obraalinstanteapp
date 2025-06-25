// src/types/requestMessage.ts
import type { Timestamp } from 'firebase/firestore';

export interface RequestMessage {
  id: string; // Firestore document ID
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'handyman' | 'admin';
  createdAt: Timestamp;
}
