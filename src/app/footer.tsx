// src/components/layout/footer.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <Image 
            src="/images/icon.png" 
            alt="Obra al Instante Logo" 
            width={24} 
            height={24} 
            className="mr-2"
            data-ai-hint="logo simple"
          />
          <p className="text-lg font-headline font-semibold">Obra al Instante</p>
        </div>
        <p className="text-sm mb-2">
          Conectándote con profesionales calificados y proveedores de confianza para todas tus necesidades del hogar.
        </p>
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-4">
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
