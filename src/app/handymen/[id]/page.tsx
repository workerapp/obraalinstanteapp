
// src/app/handymen/[id]/page.tsx
import { handymen } from '@/data/handymen';
import type { Handyman } from '@/types/handyman';
import { notFound } from 'next/navigation';
import HandymanDetailClientContent from '@/components/handymen/handyman-detail-client-content';

interface HandymanDetailPageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  return handymen.map((handyman) => ({
    id: handyman.id,
  }));
}

export async function generateMetadata({ params }: HandymanDetailPageProps) {
  const handyman = handymen.find(h => h.id === params.id);
  if (!handyman) {
    return { title: "Operario No Encontrado" };
  }
  return {
    title: `${handyman.name} - Perfil de Operario | Obra al Instante`,
    description: `Perfil de ${handyman.name}: ${handyman.tagline}. Habilidades: ${handyman.skills.join(', ')}.`,
  };
}

export default function HandymanDetailPage({ params }: HandymanDetailPageProps) {
  const handyman = handymen.find(h => h.id === params.id);

  if (!handyman) {
    notFound();
  }

  // Mock reviews - in a real app, these might be fetched or come from handyman data
  const reviews = [
    { id: 1, author: "Alicia B.", rating: 5, comment: "¡Juan fue fantástico! Arregló mi grifo que goteaba en poco tiempo. Altamente recomendado.", date: "2023-03-15" },
    { id: 2, author: "Roberto C.", rating: 4, comment: "Buen trabajo en el cableado eléctrico. Profesional y ordenado.", date: "2023-02-20" },
  ];

  return <HandymanDetailClientContent handyman={handyman} reviews={reviews} />;
}
