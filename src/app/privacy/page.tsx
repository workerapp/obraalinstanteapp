
// src/app/privacy/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  const lastUpdated = "15 de Mayo de 2024";

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-headline font-bold text-primary">Política de Privacidad</h1>
        <Button variant="outline" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" />Volver al Inicio</Link>
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <ShieldAlert className="h-8 w-8 text-primary" />
                <span>Tu Privacidad es Nuestra Prioridad</span>
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
                debes consultar con un profesional legal para redactar una Política de Privacidad completa y adecuada
                que cumpla con la legislación colombiana, incluyendo la Ley 1581 de 2012 (Ley de Habeas Data) y sus decretos reglamentarios.
            </p>
          </div>
          
          <h2 className="text-xl font-semibold font-headline mt-6">1. Introducción y Responsable del Tratamiento</h2>
          <p>
            Bienvenido a Obra al Instante (la "Plataforma"). Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos
            tu información personal. El responsable del tratamiento de tus datos es Obra al Instante S.A.S. (en adelante, "nosotros"), con domicilio en [Ciudad, Colombia] y correo electrónico de contacto para temas de privacidad: <a href="mailto:privacidad@obraalinstante.com" className="text-primary hover:underline">privacidad@obraalinstante.com</a>.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Información que Recopilamos</h2>
          <p>
            Recopilamos información para poder operar nuestra plataforma y conectar a clientes con profesionales. El tipo de información depende de tu rol:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
                <strong>Para todos los usuarios:</strong> Nombre, correo electrónico y contraseña para la creación de la cuenta. También recopilamos datos de uso, como dirección IP y tipo de navegador, para mejorar el servicio.
            </li>
            <li>
                <strong>Si eres Cliente:</strong> Recopilamos la información que proporcionas al solicitar una cotización, como tu número de teléfono (opcional), dirección para el servicio, y la descripción del problema o necesidad. También guardamos el historial de tus solicitudes y las conversaciones con los profesionales a través de nuestro chat.
            </li>
            <li>
                <strong>Si eres Operario o Proveedor:</strong> Recopilamos la información de tu perfil público, que puede incluir tu nombre o el de tu empresa, lema, descripción ("Sobre Mí"), ubicación, teléfono de contacto, foto de perfil o logo, y la lista de servicios o productos que ofreces. También guardamos tu historial de trabajos y cotizaciones en la plataforma.
            </li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">3. Finalidad del Tratamiento de Datos</h2>
          <p>
            Utilizamos tu información para los siguientes fines:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Para crear y gestionar tu cuenta en la Plataforma.</li>
            <li>Para facilitar la comunicación y conexión entre Clientes y Profesionales. Esto incluye compartir la información de contacto necesaria (como dirección y teléfono) únicamente cuando una cotización es aceptada y un servicio es programado.</li>
            <li>Para procesar solicitudes, cotizaciones y pagos (a través de proveedores de pago externos).</li>
            <li>Para operar y mejorar la Plataforma, incluyendo nuestro Asistente de IA "Obrita". Las descripciones de problemas que envías a "Obrita" se procesan para darte un análisis, pero no se asocian públicamente a tu identidad.</li>
            <li>Para comunicarnos contigo sobre tus solicitudes, actualizaciones de la plataforma o con fines de marketing (siempre con tu consentimiento previo).</li>
            <li>Para garantizar la seguridad de la plataforma y prevenir el fraude.</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">4. Tus Derechos (Ley 1581 de 2012 - Habeas Data)</h2>
          <p>
            Como titular de la información, tienes los siguientes derechos:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Conocer, Actualizar y Rectificar:</strong> Tienes derecho a acceder a tus datos, actualizarlos y corregirlos si son incorrectos o incompletos. Puedes hacerlo directamente desde tu panel de perfil.</li>
            <li><strong>Solicitar Prueba de Autorización:</strong> Puedes solicitarnos una copia de la autorización que nos diste para tratar tus datos.</li>
            <li><strong>Ser Informado del Uso:</strong> Puedes preguntarnos cómo hemos utilizado tus datos personales.</li>
            <li><strong>Presentar Quejas:</strong> Si consideras que hemos infringido la ley de protección de datos, puedes presentar una queja ante la Superintendencia de Industria y Comercio (SIC).</li>
            <li><strong>Revocar la Autorización y Solicitar la Supresión:</strong> Puedes revocar tu consentimiento para el tratamiento de datos y solicitar que los eliminemos de nuestras bases de datos en cualquier momento, siempre y cuando no tengas una obligación legal o contractual de permanecer en ellas.</li>
          </ul>
           <p>
            Para ejercer estos derechos, por favor contáctanos en <a href="mailto:privacidad@obraalinstante.com" className="text-primary hover:underline">privacidad@obraalinstante.com</a>, adjuntando una copia de tu documento de identidad para verificar tu titularidad.
          </p>

          <h2 className="text-xl font-semibold font-headline">5. Seguridad y Transferencia de Datos</h2>
          <p>
            Tomamos medidas técnicas y organizativas razonables para proteger tu información. Tus datos pueden ser almacenados en servidores ubicados fuera de Colombia (por ejemplo, los de nuestro proveedor de servicios en la nube), pero siempre nos aseguraremos de que cumplan con estándares de seguridad adecuados y equivalentes a los exigidos por la ley colombiana.
          </p>
          
          <h2 className="text-xl font-semibold font-headline">6. Vigencia</h2>
           <p>
            Esta política entra en vigor a partir de la fecha de su publicación. Tus datos serán tratados durante el tiempo que sea necesario para cumplir con las finalidades mencionadas o hasta que solicites su supresión.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
