
// src/app/terms/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/"> &larr; Volver al Inicio</Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Términos de Servicio</CardTitle>
          <CardDescription>
            Por favor, lee estos términos cuidadosamente antes de usar Obra al Instante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          <p className="font-semibold text-destructive text-center">
            **AVISO IMPORTANTE:** El siguiente contenido es un marcador de posición y NO constituye asesoramiento legal.
            Debes consultar con un profesional legal para redactar Términos de Servicio completos y adecuados
            para tu negocio y que cumplan con la legislación colombiana.
          </p>

          <h2 className="text-xl font-semibold font-headline mt-6">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar la plataforma Obra al Instante (en adelante "Plataforma" o "Servicio"), aceptas
            estar sujeto a estos Términos de Servicio ("Términos"). Si no estás de acuerdo con alguna parte de los términos,
            entonces no podrás acceder al Servicio.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Descripción del Servicio</h2>
          <p>
            Obra al Instante es una plataforma que conecta a usuarios que buscan servicios para el hogar ("Clientes")
            con profesionales independientes que ofrecen dichos servicios ("Operarios"). Obra al Instante actúa como
            un intermediario y no es responsable directo por la prestación de los servicios ni por las acciones de los
            Clientes u Operarios.
          </p>

          <h2 className="text-xl font-semibold font-headline">3. Cuentas de Usuario</h2>
          <p>
            Para acceder a ciertas funciones de la Plataforma, es posible que debas registrarte y crear una cuenta.
            Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran
            bajo tu cuenta. Aceptas notificar inmediatamente a Obra al Instante sobre cualquier uso no autorizado de tu cuenta.
          </p>

          <h2 className="text-xl font-semibold font-headline">4. Responsabilidades de los Usuarios</h2>
          <p>
            <strong>Clientes:</strong> Aceptan proporcionar información precisa sobre los servicios requeridos, tratar a los Operarios
            con respeto y cumplir con los acuerdos de pago.
          </p>
          <p>
            <strong>Operarios:</strong> Aceptan proporcionar información precisa sobre sus habilidades y servicios, realizar los trabajos
            de manera profesional y diligente, y cumplir con las leyes y regulaciones aplicables en Colombia.
            Los Operarios son contratistas independientes y no empleados de Obra al Instante.
          </p>

          <h2 className="text-xl font-semibold font-headline">5. Cotizaciones, Pagos y Tarifas</h2>
          <p>
            Los detalles sobre cotizaciones, pagos por servicios y cualquier tarifa de la plataforma se describirán
            en el momento de la transacción o según se comunique en la Plataforma. Obra al Instante puede utilizar
            procesadores de pago de terceros.
          </p>

          <h2 className="text-xl font-semibold font-headline">6. Propiedad Intelectual</h2>
          <p>
            El Servicio y su contenido original (excluyendo el contenido proporcionado por los usuarios), características y
            funcionalidad son y seguirán siendo propiedad exclusiva de Obra al Instante y sus licenciantes.
          </p>

          <h2 className="text-xl font-semibold font-headline">7. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley colombiana, Obra al Instante no será responsable por ningún daño
            indirecto, incidental, especial, consecuente o punitivo, incluyendo, entre otros, pérdida de ganancias,
            datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de (i) tu acceso o uso o incapacidad
            para acceder o usar el Servicio; (ii) cualquier conducta o contenido de cualquier tercero en el Servicio;
            (iii) cualquier contenido obtenido del Servicio; y (iv) el acceso no autorizado, uso o alteración de
            tus transmisiones o contenido, ya sea basado en garantía, contrato, agravio (incluyendo negligencia) o
            cualquier otra teoría legal.
          </p>
          <p>
             Obra al Instante no garantiza la calidad, idoneidad, seguridad o habilidad de los Operarios.
             Cualquier acuerdo por servicios es estrictamente entre el Cliente y el Operario.
          </p>

          <h2 className="text-xl font-semibold font-headline">8. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento.
            Te notificaremos los cambios importantes.
          </p>

          <h2 className="text-xl font-semibold font-headline">9. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia,
            sin tener en cuenta sus disposiciones sobre conflicto de leyes. Cualquier disputa se someterá a la
            jurisdicción de los tribunales competentes en Colombia.
          </p>

          <h2 className="text-xl font-semibold font-headline">10. Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre estos Términos, por favor contáctanos en:
            [Tu Dirección de Correo Electrónico de Contacto]
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            Última actualización: [Fecha de la Última Actualización]
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
