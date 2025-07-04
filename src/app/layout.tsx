
import type { Metadata } from 'next';
import Link from 'next/link';
import { PT_Sans, Oswald } from 'next/font/google'; // Using next/font
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import Providers from '@/components/layout/providers';
import { AuthProvider } from '@/hooks/useAuth'; // Import AuthProvider

// Configure PT Sans font for body text
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

// Configure Oswald font for headlines
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-oswald',
});


export const metadata: Metadata = {
  title: 'Obra al Instante - Tu Solución de Servicios para el Hogar',
  description: 'Encuentra operarios calificados u ofrece tus servicios. Obtén soluciones impulsadas por IA para los problemas de tu hogar.',
  icons: [{ rel: "icon", url: "/images/icon.png" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ptSans.variable} ${oswald.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Providers> {/* QueryClientProvider is here */}
          <AuthProvider> {/* AuthProvider wraps Navbar and children */}
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
