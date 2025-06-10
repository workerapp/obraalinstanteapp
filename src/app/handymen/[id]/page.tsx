
// src/app/handymen/[id]/page.tsx
import { notFound } from 'next/navigation';
import HandymanDetailClientContent from '@/components/handymen/handyman-detail-client-content';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';
// import type { AppUser } from '@/hooks/useAuth'; // Not directly used here but good for reference

interface HandymanDetailPageProps {
  params: { id: string }; // id here is the handyman's UID
}

// Helper to convert Firestore user data to Handyman type
const mapFirestoreUserToHandyman = (uid: string, userData: any): Handyman | null => {
  if (!userData) {
    console.warn(`mapFirestoreUserToHandyman: No userData provided for UID: ${uid}`);
    return null;
  }

  console.log(`mapFirestoreUserToHandyman: Mapping Firestore user data for UID: ${uid}`, JSON.stringify(userData, null, 2));

  if (userData.role !== 'handyman') {
    console.warn(`mapFirestoreUserToHandyman: User ${uid} is not a handyman. Role found: '${userData.role}'`);
    return null;
  }

  let memberSince = 'Fecha de registro no disponible';
  if (userData.createdAt) {
    try {
      let createdAtDate: Date;
      if (userData.createdAt instanceof Timestamp) {
        createdAtDate = userData.createdAt.toDate();
      } else if (typeof userData.createdAt === 'string') { // ISO string
        createdAtDate = new Date(userData.createdAt);
      } else if (typeof userData.createdAt === 'number') { // Milliseconds since epoch
        createdAtDate = new Date(userData.createdAt);
      } else if (userData.createdAt.seconds && typeof userData.createdAt.seconds === 'number') { // Firestore-like object from server but not Timestamp instance
        createdAtDate = new Date(userData.createdAt.seconds * 1000);
      }
      else {
        throw new Error('Unsupported createdAt format');
      }
      
      if (isNaN(createdAtDate.getTime())) { // Check if date is valid
          console.error(`mapFirestoreUserToHandyman: Invalid date parsed from createdAt for UID ${uid}. Raw:`, userData.createdAt);
          throw new Error('Invalid date from createdAt field');
      }
      memberSince = `Se unió en ${createdAtDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
    } catch (e: any) {
      console.error(`mapFirestoreUserToHandyman: Error formatting createdAt date for handyman UID ${uid}. Error: ${e.message}. Raw createdAt:`, userData.createdAt);
    }
  } else {
      console.warn(`mapFirestoreUserToHandyman: No 'createdAt' field found for handyman UID ${uid}. This field is usually set during user registration.`);
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
  console.log(`mapFirestoreUserToHandyman: Successfully mapped UID ${uid} to handyman object:`, handymanProfile);
  return handymanProfile;
};


export async function generateMetadata({ params }: HandymanDetailPageProps) {
  try {
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
    console.error("Error fetching handyman metadata for /handymen/[id]:", error);
  }
  return { title: "Operario No Encontrado" };
}

export default async function HandymanDetailPage({ params }: HandymanDetailPageProps) {
  const handymanId = params.id;

  if (!handymanId) {
    console.warn("HandymanDetailPage: No handyman ID (UID) provided in params. This should not happen if the route is matched correctly.");
    notFound();
  }

  console.log(`HandymanDetailPage: Attempting to fetch profile for handyman ID (UID): ${handymanId}`);

  try {
    const userDocRef = doc(firestore, "users", handymanId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(`HandymanDetailPage: No user document found in 'users' collection for ID: '${handymanId}'. Please verify this UID exists in your Firestore 'users' collection and that Firestore rules allow reading it.`);
      notFound();
    }

    const userData = userDocSnap.data();
    // Log a stringified version for better inspection of nested objects like Timestamps
    console.log(`HandymanDetailPage: Raw user data from Firestore for '${handymanId}':`, JSON.stringify(userData, null, 2));

    const handyman = mapFirestoreUserToHandyman(handymanId, userData);

    if (!handyman) {
      console.warn(`HandymanDetailPage: Failed to map Firestore data to Handyman object for '${handymanId}'. This typically means the user document does not have 'role: "handyman"', or essential data is missing. Check the 'role' field and other user data in Firestore.`);
      notFound();
    }
    
    // Mock reviews - in a real app, these might be fetched or come from handyman data
    const reviews = [
      { id: 1, author: "Alicia B.", rating: 5, comment: "¡Juan fue fantástico! Arregló mi grifo que goteaba en poco tiempo. Altamente recomendado.", date: "2023-03-15" },
      { id: 2, author: "Roberto C.", rating: 4, comment: "Buen trabajo en el cableado eléctrico. Profesional y ordenado.", date: "2023-02-20" },
    ];

    console.log(`HandymanDetailPage: Successfully fetched and mapped handyman '${handymanId}'. Rendering HandymanDetailClientContent.`);
    return <HandymanDetailClientContent handyman={handyman} reviews={reviews} />;

  } catch (error: any) {
    console.error(`HandymanDetailPage: Critical error fetching handyman profile for ID '${handymanId}'. This could be Firestore security rules, a network issue, or an unhandled problem in data processing. Error:`, error.message, "\nStack:", error.stack);
    notFound();
  }
}
