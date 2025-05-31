// src/components/layout/footer.tsx
import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <Wrench className="h-6 w-6 text-primary mr-2" />
          <p className="text-lg font-headline font-semibold">Manitas Listas</p>
        </div>
        <p className="text-sm mb-2">
          Connecting you with skilled handymen for all your home service needs.
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
        </div>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Manitas Listas. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Placeholder pages for footer links (optional, can be created later)
export const AboutPage = () => <div className="container mx-auto p-4"><h1>About Us</h1><p>Information about Manitas Listas.</p></div>;
export const ContactPage = () => <div className="container mx-auto p-4"><h1>Contact Us</h1><p>Contact form or details.</p></div>;
export const PrivacyPage = () => <div className="container mx-auto p-4"><h1>Privacy Policy</h1><p>Details about data privacy.</p></div>;
export const TermsPage = () => <div className="container mx-auto p-4"><h1>Terms of Service</h1><p>Terms and conditions for using the service.</p></div>;
