
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
        <h1 className="text-4xl font-headline font-bold text-primary">Términos de Servicio</h1>
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
          <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-md">
            <p className="font-semibold text-destructive">
              **AVISO IMPORTANTE:** El siguiente contenido es una guía informativa y NO constituye asesoramiento legal.
              Ha sido redactado para reflejar las funcionalidades de esta aplicación de demostración. Para su uso en producción,
              debes consultar con un profesional legal para redactar Términos de Servicio completos y adecuados
              para tu modelo de negocio y que cumplan con la legislación colombiana.
            </p>
          </div>

          <h2 className="text-xl font-semibold font-headline mt-6">1. Aceptación de los Términos</h2>
          <p>
            Al registrarte y utilizar la plataforma Obra al Instante (en adelante "Plataforma" o "Servicio"), aceptas
            estar legalmente vinculado a estos Términos de Servicio ("Términos"). Si no estás de acuerdo con estos Términos, no debes utilizar la Plataforma.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Descripción del Servicio</h2>
          <p>
            Obra al Instante es una plataforma tecnológica que actúa como un <strong>intermediario</strong>. Conectamos a usuarios que buscan servicios o productos para el hogar ("Clientes")
            con profesionales y empresas independientes que ofrecen dichos servicios ("Operarios") o productos ("Proveedores").
          </p>
          <p>
            <strong>ACLARACIÓN IMPORTANTE:</strong> Obra al Instante no es una empresa de construcción, ni un empleador, ni una agencia de contratación. Los Operarios y Proveedores son contratistas independientes y son los únicos responsables por la calidad, garantía, seguridad y ejecución de los servicios o productos que ofrecen. Nuestra función se limita a facilitar esta conexión.
          </p>
          
          <h2 className="text-xl font-semibold font-headline">3. Cuentas y Roles de Usuario</h2>
          <p>
            Debes registrarte para usar la mayoría de las funciones. Eres responsable de mantener la confidencialidad de tu contraseña. Hay tres roles principales:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Cliente:</strong> Persona o empresa que busca un servicio o producto.</li>
            <li><strong>Operario:</strong> Profesional independiente que ofrece servicios.</li>
            <li><strong>Proveedor:</strong> Empresa que ofrece productos o materiales.</li>
          </ul>
          <p>Los Operarios y Proveedores pasan por un proceso de revisión y deben ser aprobados por el Administrador de la Plataforma para poder ofrecer sus servicios o productos.</p>

          <h2 className="text-xl font-semibold font-headline">4. Proceso de Servicio y Cotización</h2>
          <p>
            Un Cliente puede solicitar una cotización general, para un servicio específico o a un profesional específico. El Operario/Proveedor asignado podrá revisar la solicitud, comunicarse a través del chat de la plataforma y enviar una cotización. El Cliente es libre de aceptar o rechazar dicha cotización. La aceptación de una cotización constituye un acuerdo directo entre el Cliente y el Operario/Proveedor.
          </p>

          <h2 className="text-xl font-semibold font-headline">5. Tarifas y Modelo de Comisión</h2>
          <p>
            La plataforma cobra una tarifa de comisión a los Operarios y Proveedores por cada servicio o venta completada y pagada a través de la plataforma. Esta tarifa se calcula como un porcentaje sobre el monto cotizado y aceptado por el Cliente. La tarifa de comisión actual se comunicará a los profesionales y será deducida de sus ganancias.
          </p>

          <h2 className="text-xl font-semibold font-headline">6. Obligaciones y Conducta del Usuario</h2>
          <p>
            Todos los usuarios se comprometen a proporcionar información veraz y a comunicarse de manera respetuosa. Queda prohibido el uso de la plataforma para fines ilegales, fraudulentos o para compartir información que no sea relevante para la solicitud de un servicio. Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.
          </p>

          <h2 className="text-xl font-semibold font-headline">7. Limitación de Responsabilidad</h2>
          <p>
            Dado que Obra al Instante es solo un intermediario, no somos responsables por la calidad, seguridad, legalidad o cualquier aspecto de los servicios prestados o los productos vendidos por los Operarios y Proveedores. Cualquier disputa, daño o reclamo relacionado con un servicio debe resolverse directamente entre el Cliente y el profesional correspondiente. Recomendamos a los Clientes realizar su propia debida diligencia antes de contratar.
          </p>

          <h2 className="text-xl font-semibold font-headline">8. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te notificaremos los cambios importantes. El uso continuado de la plataforma después de una modificación constituye la aceptación de los nuevos Términos.
          </p>

          <h2 className="text-xl font-semibold font-headline">9. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos se regirán por las leyes de la República de Colombia. Cualquier disputa se someterá a la jurisdicción de los tribunales competentes en Colombia.
          </p>

          <h2 className="text-xl font-semibold font-headline">10. Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre estos Términos, por favor contáctanos en:
            <a href="mailto:legal@obraalinstante.com" className="text-primary hover:underline ml-1">legal@obraalinstante.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
