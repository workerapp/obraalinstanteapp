import type { Metadata } from 'next';
import Link from 'next/link';
import { PT_Sans } from 'next/font/google'; // Using next/font for PT Sans
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import Providers from '@/components/layout/providers';
import { AuthProvider } from '@/hooks/useAuth'; // Import AuthProvider

// Configure PT Sans font
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans', // CSS variable for PT Sans
});

export const metadata: Metadata = {
  title: 'Manitas Listas - Your Home Services Solution',
  description: 'Find reliable handyman services or offer your skills. Get AI-powered solutions for your home problems.',
  icons: [{ rel: "icon", url: "/favicon.ico" }] // Assuming a favicon might be added later
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable} h-full`}>
      <head>
        {/* Keep existing Google Font links if any, but PT Sans is now managed by next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Example: if Inter was also used for fallback or specific elements 
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        */}
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
