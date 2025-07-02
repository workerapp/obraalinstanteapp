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
                <span>Tratamiento de Datos Personales</span>
            </CardTitle>
          <CardDescription>
            Última actualización: {lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          
          <h2 className="text-xl font-semibold font-headline mt-6">1. Introducción y Responsable del Tratamiento</h2>
          <p>
            Bienvenido a Obra al Instante (la "Plataforma"). La presente Política de Privacidad describe cómo recolectamos, utilizamos, almacenamos y protegemos tu información personal en cumplimiento de la Ley 1581 de 2012 de Protección de Datos Personales (Habeas Data) y sus decretos reglamentarios en Colombia.
          </p>
          <p>
            El Responsable del Tratamiento de tus datos es **Obra al Instante S.A.S.** (en adelante, "nosotros", "la Compañía"), con correo electrónico de contacto para asuntos de privacidad: <a href="mailto:privacidad@obraalinstante.com" className="text-primary hover:underline">privacidad@obraalinstante.com</a>.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Información que Recopilamos</h2>
          <p>
            Recolectamos la información necesaria para la correcta operación de la Plataforma y para facilitar la conexión entre nuestros usuarios. La información varía según tu rol:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
                <strong>Para todos los usuarios (Clientes, Operarios y Proveedores):</strong> Al crear una cuenta, recopilamos tu nombre, correo electrónico y contraseña (la cual se almacena de forma segura y encriptada). Adicionalmente, podemos recopilar datos técnicos como dirección IP, tipo de navegador y datos de uso para el mantenimiento y mejora del servicio.
            </li>
            <li>
                <strong>Clientes:</strong> Al solicitar una cotización o servicio, recopilamos la información que proporcionas, incluyendo: número de teléfono, dirección física para la prestación del servicio, y la descripción detallada del problema o necesidad. El historial de tus solicitudes y las conversaciones mantenidas a través de nuestro sistema de mensajería también son almacenados.
            </li>
            <li>
                <strong>Operarios y Proveedores:</strong> Para tu perfil público, recopilamos la información que voluntariamente proporcionas, la cual puede incluir: nombre de la empresa, lema, descripción ("Sobre Mí"), ubicación, teléfono de contacto, fotografía de perfil o logo, y una lista detallada de los servicios, habilidades o categorías de productos que ofreces. Esta información es visible para los Clientes con el fin de facilitar la contratación.
            </li>
             <li>
                <strong>Asistente de IA "Obrita":</strong> Las descripciones de problemas que envías al Asistente de IA se procesan para generar análisis y recomendaciones. Utilizamos estas interacciones de forma anónima para mejorar la calidad de nuestro servicio de IA.
            </li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">3. Finalidad del Tratamiento de Datos</h2>
          <p>
            Tus datos personales serán utilizados exclusivamente para las siguientes finalidades:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Crear, verificar y gestionar tu cuenta de usuario en la Plataforma.</li>
            <li>Actuar como intermediario para facilitar la comunicación y conexión entre Clientes y Profesionales (Operarios/Proveedores). Esto incluye compartir información de contacto y de servicio estrictamente necesaria para la coordinación y ejecución de un trabajo una vez que una cotización ha sido aceptada.</li>
            <li>Procesar y dar seguimiento a las solicitudes, cotizaciones y estados de los servicios.</li>
            <li>Operar, mantener y mejorar la Plataforma, incluyendo las funcionalidades de nuestro Asistente de IA.</li>
            <li>Enviar comunicaciones transaccionales indispensables sobre tus solicitudes o el estado de tu cuenta (ej. notificaciones de nuevos mensajes, cambios de estado de un servicio).</li>
            <li>Prevenir el fraude, garantizar la seguridad de la Plataforma y hacer cumplir nuestros Términos de Servicio.</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">4. Derechos del Titular (Ley 1581 de 2012)</h2>
          <p>
            Como Titular de la información, tienes los siguientes derechos, que puedes ejercer en cualquier momento:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Conocer, Actualizar y Rectificar:</strong> Tienes derecho a acceder a tus datos personales y a solicitar la corrección o actualización de aquellos que sean parciales, inexactos, incompletos o fraccionados. Gran parte de esta información puede ser gestionada directamente desde tu panel de perfil.</li>
            <li><strong>Solicitar Prueba de la Autorización:</strong> Puedes solicitarnos una copia de la autorización que nos otorgaste para el tratamiento de tus datos al momento de tu registro.</li>
            <li><strong>Ser Informado del Uso:</strong> Puedes solicitarnos información sobre el uso que le hemos dado a tus datos personales.</li>
            <li><strong>Presentar Quejas:</strong> Tienes derecho a presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley de protección de datos.</li>
            <li><strong>Revocar la Autorización y Solicitar la Supresión:</strong> Puedes revocar tu consentimiento para el tratamiento de datos y solicitar su eliminación de nuestras bases de datos, siempre y cuando no exista un deber legal o contractual que nos obligue a conservarlos.</li>
          </ul>
           <p>
            Para ejercer estos derechos, por favor envía una solicitud al correo <a href="mailto:privacidad@obraalinstante.com" className="text-primary hover:underline">privacidad@obraalinstante.com</a>, adjuntando una copia de tu documento de identidad para verificar que eres el Titular de los datos.
          </p>

          <h2 className="text-xl font-semibold font-headline">5. Seguridad y Transferencia de Datos</h2>
          <p>
            Implementamos medidas técnicas, humanas y administrativas razonables para proteger tu información contra acceso no autorizado, alteración, pérdida o divulgación. Tus datos pueden ser alojados en servidores de proveedores de servicios en la nube (ej. Google Cloud, AWS) que pueden estar ubicados fuera de Colombia. Al aceptar esta política, autorizas la transferencia internacional de tus datos para fines de almacenamiento, garantizando que dichos proveedores cumplen con estándares de seguridad de la información adecuados y conformes a la normativa aplicable.
          </p>
          
          <h2 className="text-xl font-semibold font-headline">6. Vigencia de la Política y del Tratamiento de Datos</h2>
           <p>
            Esta política rige a partir de la fecha de su publicación. Tus datos personales serán tratados durante el tiempo que sea razonable y necesario para cumplir con las finalidades expuestas en este documento o hasta que solicites su supresión y no tengamos obligación legal de conservarlos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
