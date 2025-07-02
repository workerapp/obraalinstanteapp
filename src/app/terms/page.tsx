// src/app/terms/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  const lastUpdated = "15 de Mayo de 2024";

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-4xl font-headline font-bold text-primary">Términos y Condiciones</h1>
        <Button variant="outline" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" />Volver al Inicio</Link>
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
           <CardTitle className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <span>Acuerdo de Uso de la Plataforma</span>
            </CardTitle>
          <CardDescription>
            Última actualización: {lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          
          <h2 className="text-xl font-semibold font-headline mt-6">1. Aceptación de los Términos</h2>
          <p>
            Al registrarse, acceder o utilizar la plataforma Obra al Instante (en adelante, la "Plataforma"), usted (en adelante, el "Usuario") acepta y se obliga a cumplir los presentes Términos y Condiciones de Servicio ("Términos"). Si no está de acuerdo con la totalidad de estos Términos, no debe utilizar la Plataforma.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Descripción del Servicio y Rol de la Plataforma</h2>
          <p>
            Obra al Instante es una plataforma tecnológica que funciona como un <strong>mercado y canal de intermediación</strong>. Nuestro propósito es conectar a usuarios que buscan servicios o productos para el hogar ("Clientes") con profesionales, técnicos y empresas independientes que ofrecen dichos servicios ("Operarios") o productos ("Proveedores") (colectivamente, "Profesionales").
          </p>
          <p>
            <strong>ACLARACIÓN FUNDAMENTAL:</strong> El rol de Obra al Instante se limita exclusivamente a la intermediación. <strong>No somos una empresa constructora, no empleamos a los Profesionales y no somos parte del contrato de servicio que se genera entre un Cliente y un Profesional.</strong> La responsabilidad por la calidad, idoneidad, garantía, seguridad y correcta ejecución de los servicios o la calidad de los productos recae enteramente en el Profesional contratado.
          </p>
          
          <h2 className="text-xl font-semibold font-headline">3. Cuentas de Usuario y Roles</h2>
          <p>
            Para acceder a la mayoría de las funcionalidades, es necesario crear una cuenta. El Usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso. Existen tres roles principales:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Cliente:</strong> Persona natural o jurídica que busca contratar servicios o adquirir productos.</li>
            <li><strong>Operario:</strong> Profesional o técnico independiente que ofrece servicios.</li>
            <li><strong>Proveedor:</strong> Persona natural o jurídica que ofrece productos o materiales.</li>
          </ul>
          <p>Los Operarios y Proveedores deben pasar por un proceso de verificación y ser aprobados por el Administrador de la Plataforma para poder ofertar activamente. Nos reservamos el derecho de admisión y permanencia en la Plataforma.</p>

          <h2 className="text-xl font-semibold font-headline">4. Proceso de Contratación y Cotización</h2>
          <p>
            El Cliente puede solicitar cotizaciones a través de la Plataforma. El Profesional interesado puede responder a dicha solicitud, comunicarse a través del sistema de mensajería y presentar una cotización formal. La decisión de aceptar o rechazar dicha cotización es exclusiva del Cliente. <strong>La aceptación de una cotización por parte del Cliente perfecciona un acuerdo contractual directo y vinculante entre dicho Cliente y el Profesional correspondiente,</strong> del cual Obra al Instante no es parte.
          </p>

          <h2 className="text-xl font-semibold font-headline">5. Tarifas y Comisiones</h2>
          <p>
            El uso de la Plataforma es gratuito para los Clientes. Obra al Instante genera ingresos a través de una <strong>tarifa de comisión</strong> que se cobra a los Profesionales por cada servicio o venta completado y pagado a través de la Plataforma. Dicha tarifa corresponde a un porcentaje del valor total de la cotización aceptada. Los Profesionales serán informados de la tasa de comisión vigente y aceptan que esta sea deducida de los montos a recibir.
          </p>

          <h2 className="text-xl font-semibold font-headline">6. Propiedad Intelectual</h2>
          <p>
            La Plataforma, su logotipo, código fuente, textos, gráficos y demás contenido (excluyendo el contenido generado por el usuario) son propiedad exclusiva de Obra al Instante S.A.S. y están protegidos por las leyes de propiedad intelectual. El contenido generado por los usuarios (como información de perfil, fotos, reseñas) es propiedad de quien lo genera, pero al subirlo a la Plataforma, el Usuario nos concede una licencia no exclusiva, mundial y libre de regalías para usar, reproducir y mostrar dicho contenido con el fin de operar y promocionar la Plataforma.
          </p>

          <h2 className="text-xl font-semibold font-headline">7. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley, Obra al Instante no será responsable por ningún daño directo, indirecto, incidental, especial o consecuente que resulte del uso o la incapacidad de usar la Plataforma. Dado que actuamos como meros intermediarios, <strong>no asumimos ninguna responsabilidad por la calidad, seguridad, legalidad, puntualidad o cualquier otro aspecto de los servicios prestados o productos vendidos por los Profesionales.</strong> Cualquier disputa, reclamo o daño debe ser resuelto directamente entre el Cliente y el Profesional.
          </p>

          <h2 className="text-xl font-semibold font-headline">8. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Se notificará a los usuarios de cualquier cambio material. El uso continuado de la Plataforma después de la publicación de los cambios constituirá la aceptación de los nuevos Términos.
          </p>

          <h2 className="text-xl font-semibold font-headline">9. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos se interpretarán y regirán de conformidad con las leyes de la República de Colombia. Para cualquier controversia que surja de estos Términos, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Bogotá D.C., Colombia.
          </p>

          <h2 className="text-xl font-semibold font-headline">10. Contacto</h2>
          <p>
            Si tiene alguna pregunta sobre estos Términos, puede contactarnos a través del correo electrónico:
            <a href="mailto:obraalinstante@gmail.com" className="text-primary hover:underline ml-1">obraalinstante@gmail.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
