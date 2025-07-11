// src/actions/mark-commissions-paid.ts
'use server';

import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

/**
 * Marks all pending commissions for a specific user as "Pagada".
 * THIS IS AN ADMIN-ONLY ACTION. It should be triggered by a trusted
 * server process or an admin interface after real payment confirmation.
 * Exposing this directly to end-users (professionals/suppliers) is a security risk.
 * @param userId - The UID of the professional or supplier whose commissions are to be paid.
 */
export async function markCommissionsAsPaid(userId: string): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  // In a real application, you would add a check here to ensure
  // the caller of this action is an administrator.
  // For example:
  // const { uid } = await getAuth().verifyIdToken(authToken);
  // if (uid !== 'admin-uid') { return { success: false, error: 'Unauthorized' }; }


  const requestsRef = collection(firestore, 'quotationRequests');
  // Query for all completed requests by this user that have a pending commission.
  const q = query(
    requestsRef,
    where('professionalId', '==', userId),
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
    revalidatePath(`/dashboard/professional/earnings`);
    revalidatePath(`/dashboard/supplier/earnings`);
    revalidatePath(`/admin/overview`);

    return { success: true, count: querySnapshot.size };
  } catch (error: any) {
    console.error('Failed to mark commissions as paid:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
