// src/components/layout/providers.tsx
"use client";

import type { PropsWithChildren } from 'react';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Dynamically import ReactQueryDevtools so it's only included in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then(mod => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : () => null;

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [isDevtoolsOpen, setIsDevtoolsOpen] = useState(false);

  // You can toggle the devtools by pressing "alt+." in your app
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.altKey && event.key === '.') {
            setIsDevtoolsOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <React.Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={isDevtoolsOpen} />
      </React.Suspense>
    </QueryClientProvider>
  );
}
