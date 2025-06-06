
// src/components/layout/footer.tsx
import Link from 'next/link';
import { Construction } from 'lucide-react'; // Changed Wrench to Construction

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <Construction className="h-6 w-6 text-primary mr-2" />
          <p className="text-lg font-headline font-semibold">Obra al Instante</p>
        </div>
        <p className="text-sm mb-2">
          Conectándote con operarios calificados para todas tus necesidades de servicios para el hogar.
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <Link href="/about" className="hover:text-primary transition-colors">Sobre Nosotros</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contacto</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidad</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Términos de Servicio</Link>
        </div>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Obra al Instante. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

// Placeholder pages for footer links (optional, can be created later)
export const AboutPage = () => <div className="container mx-auto p-4"><h1>Sobre Nosotros</h1><p>Información sobre Obra al Instante.</p></div>;
export const ContactPage = () => <div className="container mx-auto p-4"><h1>Contacto</h1><p>Formulario de contacto o detalles.</p></div>;
export const PrivacyPage = () => <div className="container mx-auto p-4"><h1>Política de Privacidad</h1><p>Detalles sobre la privacidad de los datos.</p></div>;
export const TermsPage = () => <div className="container mx-auto p-4"><h1>Términos de Servicio</h1><p>Términos y condiciones para usar el servicio.</p></div>;
