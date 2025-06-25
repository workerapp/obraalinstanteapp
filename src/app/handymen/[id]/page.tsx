// src/app/handymen/[id]/page.tsx
import { notFound } from 'next/navigation';
import HandymanDetailClientContent from '@/components/handymen/handyman-detail-client-content';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';

interface HandymanDetailPageProps {
  params: { id: string };
}

const mapFirestoreUserToHandyman = (uid: string, userData: any): Handyman | null => {
  if (!userData || userData.role !== 'handyman') {
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
      } else if (typeof userData.createdAt.seconds === 'number') {
        createdAtDate = new Date(userData.createdAt.seconds * 1000);
      }
      
      if (createdAtDate && !isNaN(createdAtDate.getTime())) {
          memberSince = `Se unió en ${createdAtDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
      }
    } catch (e: any) {
      console.error(`mapFirestoreUserToHandyman: [UID: ${uid}] Error formatting 'createdAt' date. Error: ${e.message}`);
    }
  }

  const handymanProfile: Handyman = {
    id: uid,
    name: userData.displayName || `Operario ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Operario profesional y confiable',
    aboutMe: userData.aboutMe || undefined,
    skills: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Servicios Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    imageUrl: userData.photoURL || userData.imageUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'persona profesional',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    phone: userData.phone || undefined,
    isApproved: userData.isApproved || false,
  };
  return handymanProfile;
};


export async function generateMetadata({ params }: HandymanDetailPageProps) {
  try {
    if (!params.id || typeof params.id !== 'string') {
        return { title: "Operario No Encontrado" };
    }
    const userDocRef = doc(firestore, "users", params.id);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Solo generar metadata si el operario está aprobado
      if (userData.role === 'handyman' && userData.isApproved === true) {
        return {
          title: `${userData.displayName || 'Operario'} - Perfil | Obra al Instante`,
          description: userData.aboutMe || `Perfil de ${userData.displayName || 'Operario'}. Contacta para servicios de ${userData.skills?.slice(0,3).join(', ') || 'varios'}.`,
        };
      }
    }
  } catch (error) {
    console.error(`generateMetadata: Error fetching handyman metadata for ID '${params.id}':`, error);
  }
  return { 
    title: "Operario No Disponible | Obra al Instante",
    description: "El perfil de este operario no está disponible o no ha sido aprobado." 
  };
}

export default async function HandymanDetailPage({ params }: HandymanDetailPageProps) {
  const handymanId = params.id;

  if (!handymanId || typeof handymanId !== 'string') {
    notFound();
  }

  try {
    const userDocRef = doc(firestore, "users", handymanId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(`HandymanDetailPage: [ID: ${handymanId}] No user document found. Calling notFound().`);
      notFound();
    }

    const userData = userDocSnap.data();

    // Solo mostrar el perfil si el operario está aprobado
    if (userData.role !== 'handyman' || userData.isApproved !== true) {
      console.warn(`HandymanDetailPage: [ID: ${handymanId}] User is not an approved handyman. Role: ${userData.role}, isApproved: ${userData.isApproved}. Calling notFound().`);
      notFound();
    }

    const handyman = mapFirestoreUserToHandyman(handymanId, userData);

    if (!handyman) {
      console.warn(`HandymanDetailPage: [ID: ${handymanId}] Failed to map Firestore data. Calling notFound().`);
      notFound();
    }
    
    const reviews = [ // Mock reviews
      { id: 1, author: "Alicia B.", rating: 5, comment: "¡Fantástico! Arregló mi grifo que goteaba en poco tiempo.", date: "2023-03-15" },
      { id: 2, author: "Roberto C.", rating: 4, comment: "Buen trabajo en el cableado eléctrico. Profesional y ordenado.", date: "2023-02-20" },
    ];

    return <HandymanDetailClientContent handyman={handyman} reviews={reviews} />;

  } catch (error: any) {
    console.error(`HandymanDetailPage: [ID: ${handymanId}] EXCEPTION CAUGHT. Error:`, error.message);
    notFound();
  }
}
