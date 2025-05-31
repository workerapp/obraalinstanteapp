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
    return { title: "Handyman Not Found" };
  }
  return {
    title: `${handyman.name} - Handyman Profile | Manitas Listas`,
    description: `Profile for ${handyman.name}: ${handyman.tagline}. Skills: ${handyman.skills.join(', ')}.`,
  };
}

export default function HandymanDetailPage({ params }: HandymanDetailPageProps) {
  const handyman = handymen.find(h => h.id === params.id);

  if (!handyman) {
    notFound();
  }

  // Mock reviews - in a real app, these might be fetched or come from handyman data
  const reviews = [
    { id: 1, author: "Alice B.", rating: 5, comment: "John was fantastic! Fixed my leaky faucet in no time. Highly recommend.", date: "2023-03-15" },
    { id: 2, author: "Bob C.", rating: 4, comment: "Good work on the electrical wiring. Professional and tidy.", date: "2023-02-20" },
  ];

  return <HandymanDetailClientContent handyman={handyman} reviews={reviews} />;
}
