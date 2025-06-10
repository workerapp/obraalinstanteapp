
// src/app/handymen/[id]/page.tsx
import { notFound } from 'next/navigation';
import HandymanDetailClientContent from '@/components/handymen/handyman-detail-client-content';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';

interface HandymanDetailPageProps {
  params: { id: string }; // id here is the handyman's UID or static ID
}

// Helper to convert Firestore user data to Handyman type
const mapFirestoreUserToHandyman = (uid: string, userData: any): Handyman | null => {
  if (!userData) {
    console.warn(`mapFirestoreUserToHandyman: [UID: ${uid}] No userData provided. Returning null.`);
    return null;
  }

  console.log(`mapFirestoreUserToHandyman: [UID: ${uid}] Attempting to map. Raw userData:`, JSON.stringify(userData, null, 2));

  if (userData.role !== 'handyman') {
    console.warn(`mapFirestoreUserToHandyman: [UID: ${uid}] User is not a handyman. Role found: '${userData.role}'. Expected 'handyman'. Returning null.`);
    return null;
  }

  let memberSince = 'Fecha de registro no disponible';
  if (userData.createdAt) {
    try {
      let createdAtDate: Date | null = null;
      if (userData.createdAt instanceof Timestamp) {
        createdAtDate = userData.createdAt.toDate();
      } else if (typeof userData.createdAt === 'string') {
        createdAtDate = new Date(userData.createdAt);
      } else if (typeof userData.createdAt === 'number') { // Milliseconds since epoch
        createdAtDate = new Date(userData.createdAt);
      } else if (userData.createdAt.seconds && typeof userData.createdAt.seconds === 'number') { // Firestore-like object
        createdAtDate = new Date(userData.createdAt.seconds * 1000);
      } else {
        console.warn(`mapFirestoreUserToHandyman: [UID: ${uid}] Unsupported 'createdAt' format. Raw:`, userData.createdAt);
      }
      
      if (createdAtDate && !isNaN(createdAtDate.getTime())) {
          memberSince = `Se unió en ${createdAtDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
      } else if (createdAtDate) { 
          console.error(`mapFirestoreUserToHandyman: [UID: ${uid}] Invalid date parsed from 'createdAt'. Raw:`, userData.createdAt);
      }
    } catch (e: any) {
      console.error(`mapFirestoreUserToHandyman: [UID: ${uid}] Error formatting 'createdAt' date. Error: ${e.message}. Raw:`, userData.createdAt);
    }
  } else {
      console.warn(`mapFirestoreUserToHandyman: [UID: ${uid}] No 'createdAt' field found.`);
  }

  const handymanProfile: Handyman = {
    id: uid,
    name: userData.displayName || `Operario ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Operario profesional y confiable',
    skills: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Servicios Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    imageUrl: userData.photoURL || userData.imageUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'persona profesional',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    phone: userData.phone || undefined,
  };
  console.log(`mapFirestoreUserToHandyman: [UID: ${uid}] Successfully mapped to handyman object:`, handymanProfile);
  return handymanProfile;
};


export async function generateMetadata({ params }: HandymanDetailPageProps) {
  try {
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
        console.warn("generateMetadata: Invalid or empty handyman ID provided in params.");
        return { title: "Operario No Encontrado" };
    }
    const userDocRef = doc(firestore, "users", params.id);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.role === 'handyman') {
        return {
          title: `${userData.displayName || 'Operario'} - Perfil | Obra al Instante`,
          description: `Perfil de ${userData.displayName || 'Operario'}. Contacta para servicios.`,
        };
      }
    }
  } catch (error) {
    console.error(`generateMetadata: Error fetching handyman metadata for ID '${params.id}':`, error);
  }
  return { title: "Operario No Encontrado" };
}

export default async function HandymanDetailPage({ params }: HandymanDetailPageProps) {
  const handymanId = params.id;

  if (!handymanId || typeof handymanId !== 'string' || handymanId.trim() === '') {
    console.warn("HandymanDetailPage: Invalid or empty handyman ID in params. Calling notFound().");
    notFound();
  }

  console.log(`HandymanDetailPage: [ID: ${handymanId}] Attempting to fetch profile.`);

  try {
    console.log(`HandymanDetailPage: [ID: ${handymanId}] Preparing to get user document reference.`);
    const userDocRef = doc(firestore, "users", handymanId);
    console.log(`HandymanDetailPage: [ID: ${handymanId}] User document reference created. Attempting to get snapshot.`);
    
    const userDocSnap = await getDoc(userDocRef);
    console.log(`HandymanDetailPage: [ID: ${handymanId}] User document snapshot received. Exists: ${userDocSnap.exists()}`);

    if (!userDocSnap.exists()) {
      console.warn(`HandymanDetailPage: [ID: ${handymanId}] No user document found in 'users' collection. This ID might be from static data or does not exist in Firestore. Calling notFound().`);
      notFound();
    }

    const userData = userDocSnap.data();
    console.log(`HandymanDetailPage: [ID: ${handymanId}] Raw user data from Firestore:`, JSON.stringify(userData, null, 2));

    console.log(`HandymanDetailPage: [ID: ${handymanId}] Attempting to map Firestore data to Handyman object.`);
    const handyman = mapFirestoreUserToHandyman(handymanId, userData);

    if (!handyman) {
      console.warn(`HandymanDetailPage: [ID: ${handymanId}] Failed to map Firestore data to Handyman object (e.g., role might not be 'handyman' or data is insufficient). Calling notFound().`);
      notFound();
    }
    
    const reviews = [ // Mock reviews for now
      { id: 1, author: "Alicia B.", rating: 5, comment: "¡Fantástico! Arregló mi grifo que goteaba en poco tiempo.", date: "2023-03-15" },
      { id: 2, author: "Roberto C.", rating: 4, comment: "Buen trabajo en el cableado eléctrico. Profesional y ordenado.", date: "2023-02-20" },
    ];

    console.log(`HandymanDetailPage: [ID: ${handymanId}] Successfully fetched and mapped. Rendering HandymanDetailClientContent.`);
    return <HandymanDetailClientContent handyman={handyman} reviews={reviews} />;

  } catch (error: any) {
    if (error.message === "NEXT_HTTP_ERROR_FALLBACK;404" || error.name === 'NotFoundError') {
      // This means one of the notFound() calls within the try block was hit.
      // The specific reason should have been logged by a console.warn just before that notFound() call.
      console.error(`HandymanDetailPage: [ID: ${handymanId}] Operation resulted in notFound(). Check preceding console.warn logs for the specific reason. Stack:`, error.stack);
    } else {
      // This is for other types of errors, like direct Firestore permission issues from getDoc
      console.error(`HandymanDetailPage: [ID: ${handymanId}] EXCEPTION CAUGHT during Firestore operation. This could be Firestore security rules (PERMISSION_DENIED), network issue, etc. Error:`, error.message, "\nStack:", error.stack);
    }
    notFound(); // Re-throw or call notFound() to ensure the page correctly 404s
  }
}
