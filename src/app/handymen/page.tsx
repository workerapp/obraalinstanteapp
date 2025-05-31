// src/app/handymen/page.tsx
import { handymen } from '@/data/handymen';
import HandymanProfileCard from '@/components/handymen/handyman-profile-card';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

export default function HandymenPage() {
  const displayedHandymen = handymen;

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Find a Handyman</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Browse our directory of skilled and trusted handymen ready to help with your home projects.
        </p>
      </section>

      {/* Placeholder for search/filter bar */}
      {/*
      <div className="mb-8">
        <Input 
          type="search" 
          placeholder="Search by name, skill, or location..." 
          className="max-w-lg mx-auto shadow-sm"
        />
      </div>
      */}

      {displayedHandymen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedHandymen.map((handyman) => (
            <HandymanProfileCard key={handyman.id} handyman={handyman} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">
          No handymen listed at the moment. Please check back soon.
        </p>
      )}
    </div>
  );
}
