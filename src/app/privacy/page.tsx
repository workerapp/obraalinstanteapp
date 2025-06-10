
// src/app/privacy/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/"> &larr; Volver al Inicio</Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Política de Privacidad</CardTitle>
          <CardDescription>
            Tu privacidad es importante para nosotros en Obra al Instante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          <p className="font-semibold text-destructive text-center">
            **AVISO IMPORTANTE:** El siguiente contenido es un marcador de posición y NO constituye asesoramiento legal.
            Debes consultar con un profesional legal para redactar una Política de Privacidad completa y adecuada
            para tu negocio y que cumpla con la legislación colombiana, incluyendo la Ley 1581 de 2012 y sus decretos reglamentarios.
          </p>
          
          <h2 className="text-xl font-semibold font-headline mt-6">1. Introducción</h2>
          <p>
            Bienvenido a Obra al Instante. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos
            tu información personal cuando utilizas nuestra plataforma y servicios.
          </p>

          <h2 className="text-xl font-semibold font-headline">2. Información que Recopilamos</h2>
          <p>
            Podemos recopilar información personal que nos proporcionas directamente, como:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Nombre, dirección de correo electrónico, número de teléfono.</li>
            <li>Dirección física para la prestación de servicios.</li>
            <li>Información de pago (procesada de forma segura por nuestros proveedores).</li>
            <li>Detalles de los servicios solicitados o ofrecidos.</li>
            <li>Comunicaciones con nosotros o con otros usuarios a través de la plataforma.</li>
          </ul>
          <p>
            También podemos recopilar información automáticamente cuando utilizas nuestros servicios, como tu dirección IP,
            tipo de navegador, sistema operativo, e información de uso.
          </p>

          <h2 className="text-xl font-semibold font-headline">3. Cómo Usamos tu Información</h2>
          <p>
            Utilizamos la información recopilada para:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Proveer, operar y mantener nuestros servicios.</li>
            <li>Mejorar, personalizar y expandir nuestros servicios.</li>
            <li>Entender y analizar cómo utilizas nuestros servicios.</li>
            <li>Desarrollar nuevos productos, servicios, características y funcionalidades.</li>
            <li>Comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios, incluyendo para servicio al cliente,
            para proporcionarte actualizaciones y otra información relacionada con el servicio, y para fines de marketing y promoción
            (sujeto a tu consentimiento cuando sea requerido por la ley).</li>
            <li>Procesar tus transacciones.</li>
            <li>Encontrar y prevenir el fraude.</li>
            <li>Cumplir con las obligaciones legales en Colombia.</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">4. Compartir tu Información</h2>
          <p>
            Podemos compartir tu información personal en las siguientes situaciones:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Con operarios o clientes para facilitar la prestación de servicios.</li>
            <li>Con proveedores de servicios de terceros que nos ayudan a operar nuestra plataforma (ej. procesadores de pago, proveedores de hosting).</li>
            <li>Para cumplir con obligaciones legales o responder a solicitudes legales válidas.</li>
            <li>Para proteger nuestros derechos, privacidad, seguridad o propiedad, y/o la de nuestros afiliados, tú u otros.</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline">5. Tus Derechos (Habeas Data en Colombia)</h2>
          <p>
            De acuerdo con la Ley 1581 de 2012 y sus decretos reglamentarios, tienes derecho a:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos.</li>
            <li>Ser informado sobre el uso que se le ha dado a tus datos personales.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
            <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.</li>
            <li>Acceder en forma gratuita a tus datos personales que hayan sido objeto de tratamiento.</li>
          </ul>
          <p>
            Para ejercer estos derechos, por favor contáctanos a través de [Correo Electrónico de Contacto para Privacidad].
          </p>

          <h2 className="text-xl font-semibold font-headline">6. Seguridad de los Datos</h2>
          <p>
            Tomamos medidas razonables para proteger tu información personal. Sin embargo, ningún sistema de transmisión
            o almacenamiento electrónico es completamente seguro.
          </p>

          <h2 className="text-xl font-semibold font-headline">7. Cambios a esta Política de Privacidad</h2>
          <p>
            Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando
            la nueva Política de Privacidad en esta página.
          </p>

          <h2 className="text-xl font-semibold font-headline">8. Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre esta Política de Privacidad, por favor contáctanos en:
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
