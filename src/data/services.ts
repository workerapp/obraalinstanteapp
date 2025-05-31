// src/data/services.ts
import type { Service } from '@/types/service';

export const services: Service[] = [
  {
    id: 'plumbing',
    name: 'Plumbing Services',
    description: 'Expert solutions for all your plumbing needs, from leaky faucets to pipe installations.',
    category: 'Home Repair',
    iconName: 'Wrench', // Lucide icon name
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'plumbing tools',
    averagePrice: null,
    commonTasks: ['Fix leaky faucets and toilets', 'Unclog drains', 'Water heater repair/install', 'Pipe repair'],
  },
  {
    id: 'electrical',
    name: 'Electrical Works',
    description: 'Safe and reliable electrical services, including wiring, fixture installation, and troubleshooting.',
    category: 'Home Repair',
    iconName: 'PlugZap',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'electrical panel',
    averagePrice: null,
    commonTasks: ['Install light fixtures and ceiling fans', 'Outlet and switch repair/install', 'Electrical panel upgrades', 'Troubleshoot electrical issues'],
  },
  {
    id: 'painting',
    name: 'Painting Services',
    description: 'Professional interior and exterior painting services to refresh your home.',
    category: 'Home Improvement',
    iconName: 'PaintRoller',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'painting wall',
    averagePrice: null,
    commonTasks: ['Interior painting (walls, ceilings)', 'Exterior painting', 'Trim and door painting', 'Drywall repair and texturing'],
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    description: 'Custom carpentry work, repairs, and installations for furniture, cabinetry, and structures.',
    category: 'Home Improvement',
    iconName: 'Hammer',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'carpentry wood',
    averagePrice: null,
    commonTasks: ['Custom shelving and cabinets', 'Door and window frame repair', 'Deck and fence repair', 'Furniture assembly'],
  },
  {
    id: 'cleaning',
    name: 'Home Cleaning',
    description: 'Thorough and reliable home cleaning services tailored to your needs.',
    category: 'Home Services',
    iconName: 'Sparkles', // Using Sparkles as a general cleaning icon
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'cleaning supplies',
    averagePrice: null,
    commonTasks: ['Regular house cleaning', 'Deep cleaning', 'Move-in/move-out cleaning', 'Window cleaning'],
  },
  {
    id: 'gardening',
    name: 'Gardening & Landscaping',
    description: 'Keep your garden beautiful with our landscaping and maintenance services.',
    category: 'Outdoor Services',
    iconName: 'Leaf',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'gardening tools',
    averagePrice: null,
    commonTasks: ['Lawn mowing and maintenance', 'Planting and weeding', 'Hedge trimming', 'Garden design'],
  },
];

