// src/actions/mark-commissions-paid.ts
'use server';

import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

/**
 * Marks all pending commissions for a specific user as "Pagada".
 * This is a server action that simulates a payment process.
 * @param userId - The UID of the handyman or supplier whose commissions are to be paid.
 */
export async function markCommissionsAsPaid(userId: string): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  const requestsRef = collection(firestore, 'quotationRequests');
  // Query for all completed requests by this user that have a pending commission.
  const q = query(
    requestsRef,
    where('handymanId', '==', userId),
    where('status', '==', 'Completada'),
    where('commissionPaymentStatus', '==', 'Pendiente')
  );

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, count: 0, error: 'No pending commissions found to pay.' };
    }

    // Use a batch write to update all documents atomically.
    const batch = writeBatch(firestore);
    querySnapshot.forEach((requestDoc) => {
      const requestDocRef = doc(firestore, 'quotationRequests', requestDoc.id);
      batch.update(requestDocRef, { commissionPaymentStatus: 'Pagada' });
    });

    await batch.commit();

    // Revalidate relevant paths to ensure data is fresh on the client-side.
    revalidatePath(`/dashboard/handyman/earnings`);
    revalidatePath(`/dashboard/supplier/earnings`);
    revalidatePath(`/admin/overview`);

    return { success: true, count: querySnapshot.size };
  } catch (error: any) {
    console.error('Failed to mark commissions as paid:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
