// src/app/suppliers/[id]/page.tsx
import { notFound } from 'next/navigation';
import SupplierDetailClientContent from '@/components/suppliers/supplier-detail-client-content';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Supplier } from '@/types/supplier';

interface SupplierDetailPageProps {
  params: { id: string };
}

const mapFirestoreUserToSupplier = (uid: string, userData: any): Supplier | null => {
  if (!userData || userData.role !== 'supplier') {
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
      console.error(`mapFirestoreUserToSupplier: [UID: ${uid}] Error formatting 'createdAt' date. Error: ${e.message}`);
    }
  }

  const supplierProfile: Supplier = {
    id: uid,
    companyName: userData.displayName || `Proveedor ${uid.substring(0, 6)}`,
    tagline: userData.tagline || 'Productos de calidad para tus proyectos',
    about: userData.aboutMe || undefined,
    // Se reutiliza el campo 'skills' para las categorías de productos
    categories: Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills : ['Materiales Generales'],
    rating: typeof userData.rating === 'number' ? userData.rating : 4.0,
    reviewsCount: typeof userData.reviewsCount === 'number' ? userData.reviewsCount : 0,
    logoUrl: userData.photoURL || userData.logoUrl || 'https://placehold.co/300x300.png',
    dataAiHint: 'logo empresa',
    location: userData.location || 'Ubicación no registrada',
    memberSince: memberSince,
    phone: userData.phone || undefined,
    isApproved: userData.isApproved || false,
  };
  return supplierProfile;
};


export async function generateMetadata({ params }: SupplierDetailPageProps) {
  try {
    if (!params.id || typeof params.id !== 'string') {
        return { title: "Proveedor No Encontrado" };
    }
    const userDocRef = doc(firestore, "users", params.id);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Solo generar metadata si el proveedor está aprobado
      if (userData.role === 'supplier' && userData.isApproved === true) {
        return {
          title: `${userData.displayName || 'Proveedor'} - Perfil | Obra al Instante`,
          description: userData.aboutMe || `Perfil de ${userData.displayName || 'Proveedor'}. Contacta para productos de ${userData.skills?.slice(0,3).join(', ') || 'varios'}.`,
        };
      }
    }
  } catch (error) {
    console.error(`generateMetadata: Error fetching supplier metadata for ID '${params.id}':`, error);
  }
  return { 
    title: "Proveedor No Disponible | Obra al Instante",
    description: "El perfil de este proveedor no está disponible o no ha sido aprobado." 
  };
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const supplierId = params.id;

  if (!supplierId || typeof supplierId !== 'string') {
    notFound();
  }

  try {
    const userDocRef = doc(firestore, "users", supplierId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(`SupplierDetailPage: [ID: ${supplierId}] No user document found. Calling notFound().`);
      notFound();
    }

    const userData = userDocSnap.data();

    if (userData.role !== 'supplier' || userData.isApproved !== true) {
      console.warn(`SupplierDetailPage: [ID: ${supplierId}] User is not an approved supplier. Role: ${userData.role}, isApproved: ${userData.isApproved}. Calling notFound().`);
      notFound();
    }

    const supplier = mapFirestoreUserToSupplier(supplierId, userData);

    if (!supplier) {
      console.warn(`SupplierDetailPage: [ID: ${supplierId}] Failed to map Firestore data. Calling notFound().`);
      notFound();
    }
    
    // Mock reviews for now
    const reviews = [
      { id: 1, author: "Constructora ABC", rating: 5, comment: "Siempre tienen stock y entregan a tiempo. ¡Excelentes precios!", date: "2023-04-10" },
      { id: 2, author: "Juan Pérez (Operario)", rating: 4, comment: "Buena atención y me asesoraron bien con los materiales.", date: "2023-03-25" },
    ];

    return <SupplierDetailClientContent supplier={supplier} reviews={reviews} />;

  } catch (error: any) {
    console.error(`SupplierDetailPage: [ID: ${supplierId}] EXCEPTION CAUGHT. Error:`, error.message);
    notFound();
  }
}
