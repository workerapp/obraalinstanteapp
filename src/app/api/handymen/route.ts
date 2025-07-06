// src/app/api/handymen/route.ts
import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Handyman } from '@/types/handyman';

const mapFirestoreUserToHandymanList = (uid: string, userData: any): Handyman => {
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
    } catch (e) {
      console.error(`Error formatting 'createdAt' for user ${uid}:`, e);
    }
  }

  return {
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
    isApproved: userData.isApproved || false,
  };
};

export async function GET() {
  try {
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", "handyman"), where("isApproved", "==", true));
    
    const querySnapshot = await getDocs(q);
    
    const handymenList: Handyman[] = [];
    querySnapshot.forEach((doc) => {
      handymenList.push(mapFirestoreUserToHandymanList(doc.id, doc.data()));
    });
    
    return NextResponse.json({ handymen: handymenList });
  } catch (error: any) {
    console.error("Error fetching handymen from Firestore:", error);
    let errorMessage = "No se pudieron cargar los operarios. Intenta de nuevo más tarde.";
    if (error.code === 'permission-denied') {
      errorMessage = "Error de permisos al cargar operarios. Verifica las reglas de seguridad de Firestore.";
    } else if (error.code === 'failed-precondition') {
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace que te permitirá crear el índice necesario.";
    }
    return NextResponse.json({ handymen: [], error: errorMessage }, { status: 500 });
  }
}
