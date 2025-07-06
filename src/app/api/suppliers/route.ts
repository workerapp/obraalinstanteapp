// src/app/api/suppliers/route.ts
import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Supplier } from '@/types/supplier';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const mapFirestoreUserToSupplierList = (uid: string, userData: any): Supplier => {
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
        memberSince = `Se unió en ${format(createdAtDate, 'MMMM yyyy', { locale: es })}`;
      }
    } catch (e) {
      console.error(`Error formatting 'createdAt' for supplier ${uid}:`, e);
    }
  }

  return {
    id: uid,
    companyName: userData.displayName || `Proveedor ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Productos de calidad para tu proyecto',
    categories: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Materiales de Construcción'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    logoUrl: userData.photoURL || userData.logoUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'logo empresa',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    about: userData.about || undefined,
    phone: userData.phone || undefined,
    isApproved: userData.isApproved || false,
  };
};

export async function GET() {
  try {
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", "supplier"), where("isApproved", "==", true));
    
    const querySnapshot = await getDocs(q);
    
    const supplierList: Supplier[] = [];
    querySnapshot.forEach((doc) => {
      supplierList.push(mapFirestoreUserToSupplierList(doc.id, doc.data()));
    });
    
    return NextResponse.json({ suppliers: supplierList });
  } catch (error: any) {
    console.error("Error fetching suppliers from Firestore:", error);
    let errorMessage = "No se pudieron cargar los proveedores.";
    if (error.code === 'failed-precondition') {
      errorMessage = "Firestore requiere un índice para esta consulta. Revisa la consola para un enlace de creación.";
    }
    return NextResponse.json({ suppliers: [], error: errorMessage }, { status: 500 });
  }
}
