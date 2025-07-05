'use server';

import { firestore } from '@/firebase/clientApp';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface SubmitReviewData {
  rating: number;
  comment: string;
  targetId: string;
  authorId: string;
  authorName: string;
  requestId: string;
}

export async function submitReview(data: SubmitReviewData) {
  const { rating, comment, targetId, authorId, authorName, requestId } = data;

  if (!targetId || !requestId || !authorId) {
    return { success: false, error: 'Faltan datos para enviar la reseña.' };
  }

  const userRef = doc(firestore, 'users', targetId);
  const requestRef = doc(firestore, 'quotationRequests', requestId);
  const reviewRef = doc(collection(firestore, `users/${targetId}/reviews`));

  try {
    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('El usuario a calificar no existe.');
      }
      
      const userData = userDoc.data();
      const currentRating = userData.rating || 0;
      const currentReviewsCount = userData.reviewsCount || 0;

      // Calculate new average rating
      const newReviewsCount = currentReviewsCount + 1;
      const newTotalRating = (currentRating * currentReviewsCount) + rating;
      const newAverageRating = newTotalRating / newReviewsCount;

      // 1. Create the new review
      transaction.set(reviewRef, {
        rating,
        comment,
        targetId,
        authorId,
        authorName,
        requestId,
        createdAt: serverTimestamp(),
      });

      // 2. Update the user's aggregate rating
      transaction.update(userRef, {
        rating: newAverageRating,
        reviewsCount: newReviewsCount,
      });

      // 3. Mark the request as reviewed
      transaction.update(requestRef, {
        isReviewed: true,
      });
    });

    // Revalidate paths to show new review data
    revalidatePath(`/handymen/${targetId}`);
    revalidatePath(`/suppliers/${targetId}`);
    revalidatePath(`/dashboard/requests/${requestId}`);

    return { success: true };
  } catch (e: any) {
    console.error('Transaction failed: ', e);
    return { success: false, error: e.message || 'No se pudo guardar la reseña.' };
  }
}
