// src/types/productCategory.ts
import type { Timestamp } from 'firebase/firestore';

export interface ProductCategory {
  id?: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
