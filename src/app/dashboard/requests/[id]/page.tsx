
// src/app/dashboard/requests/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/clientApp';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import type { QuotationRequest } from '@/types/quotationRequest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ArrowLeft, User, Wrench, MapPin, Calendar, MessageSquare, Tag, FileText, DollarSign, Phone } from 'lucide-react'; // Changed Tool to Wrench
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

const fetchRequestDetails = async (requestId: string | undefined, userId: string | undefined): Promise<QuotationRequest | null> => {
  if (!requestId || !userId) {
    throw new Error("ID de solicitud o ID de usuario no proporcionado.");
  }

  const requestDocRef = doc(firestore, "quotationRequests", requestId);
  const requestDocSnap = await getDoc(requestDocRef);

  if (!requestDocSnap.exists()) {
    return null; // O lanzar un error específico de "no encontrado"
  }

  const requestData = requestDocSnap.data() as Omit<QuotationRequest, 'id'>;
  
  // Basic permission check: user must be the one who created it OR the handyman assigned
  if (requestData.userId !== userId && requestData.handymanId !== userId) {
    throw new Error("No tienes permiso para ver esta solicitud.");
  }

  return {
    id: requestDocSnap.id,
    ...requestData,
    requestedAt: requestData.requestedAt instanceof Timestamp ? requestData.requestedAt : Timestamp.now(),
    updatedAt: requestData.updatedAt instanceof Timestamp ? requestData.updatedAt : Timestamp.now(),
  } as QuotationRequest;
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = typeof params.id === 'string' ? params.id : undefined;
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;

  const { data: request, isLoading, error, isError } = useQuery<QuotationRequest | null, Error>({
    queryKey: ['quotationRequestDetails', requestId, typedUser?.uid],
    queryFn: () => fetchRequestDetails(requestId, typedUser?.uid),
    enabled: !!requestId && !!typedUser?.uid,
    retry: 1, // No reintentar muchas veces si no se encuentra o no hay permisos
  });

  const getStatusColorClass = (status: QuotationRequest['status']): string => {
    switch (status) {
     case 'Completada': return 'bg-green-600 text-white';
     case 'Programada': return 'bg-blue-500 text-white';
     case 'Enviada': return 'bg-yellow-500 text-black';
     case 'Revisando': return 'bg-orange-500 text-white';
     case 'Cotizada': return 'bg-purple-500 text-white';
     case 'Cancelada': return 'bg-red-600 text-white';
     default: return 'bg-gray-500 text-white';
   }
 };

  if (authLoading || (isLoading && !isError)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando detalles de la solicitud...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar la Solicitud</AlertTitle>
          <AlertDescription>
            {error?.message.includes("No tienes permiso") 
              ? "No tienes permiso para ver los detalles de esta solicitud."
              : "No pudimos cargar los detalles de la solicitud. Es posible que no exista o haya ocurrido un error."}
            <br />
            <small>{error?.message}</small>
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Solicitud no Encontrada</AlertTitle>
            <AlertDescription>La solicitud que buscas no existe o no se pudo cargar.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const isUserCustomer = typedUser?.uid === request.userId;
  const isUserHandyman = typedUser?.uid === request.handymanId;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-headline text-primary flex items-center">
              <FileText className="mr-3 h-8 w-8" /> Detalles de la Solicitud
            </CardTitle>
            <Badge className={`text-lg px-4 py-1.5 ${getStatusColorClass(request.status)}`}>
              {request.status}
            </Badge>
          </div>
          <CardDescription>ID de Solicitud: {request.id}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
          
          {/* Sección de Servicio */}
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><Wrench className="mr-2 text-accent h-5 w-5"/>Información del Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Servicio:</strong> {request.serviceName}</p>
              {request.handymanName && <p><strong>Operario Solicitado:</strong> {request.handymanName}</p>}
            </div>
            <p className="text-sm mt-2"><strong>Descripción del Problema:</strong></p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">{request.problemDescription}</p>
          </div>
          
          <Separator />

          {/* Sección de Contacto y Ubicación */}
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><User className="mr-2 text-accent h-5 w-5"/>Información de Contacto y Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Nombre Contacto:</strong> {request.contactFullName}</p>
              <p><strong>Email Contacto:</strong> {request.contactEmail}</p>
              {request.contactPhone && <p className="flex items-center"><Phone className="mr-1.5 h-4 w-4 text-muted-foreground"/><strong>Teléfono:</strong> {request.contactPhone}</p>}
              <p className="flex items-center col-span-1 md:col-span-2"><MapPin className="mr-1.5 h-4 w-4 text-muted-foreground"/><strong>Dirección:</strong> {request.address}</p>
            </div>
          </div>

          <Separator />

          {/* Sección de Fechas y Estado */}
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><Calendar className="mr-2 text-accent h-5 w-5"/>Fechas y Estado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Fecha Solicitud:</strong> {request.requestedAt?.toDate ? format(request.requestedAt.toDate(), 'PPPp', { locale: es }) : 'N/A'}</p>
              <p><strong>Última Actualización:</strong> {request.updatedAt?.toDate ? format(request.updatedAt.toDate(), 'PPPp', { locale: es }) : 'N/A'}</p>
              {request.preferredDate && <p><strong>Fecha Preferida:</strong> {format(new Date(request.preferredDate), 'PPP', { locale: es })}</p>}
            </div>
          </div>
          
          {/* Sección de Cotización (si existe y el estado es apropiado) */}
          {(request.status === 'Cotizada' || request.status === 'Programada' || request.status === 'Completada') && request.quotedAmount && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><DollarSign className="mr-2 text-accent h-5 w-5"/>Detalles de la Cotización</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong>Monto Cotizado:</strong> ${request.quotedAmount.toLocaleString('es-CO')} {request.quotedCurrency || 'COP'}</p>
                </div>
                {request.quotationDetails && (
                    <>
                     <p className="text-sm mt-2"><strong>Notas de la Cotización:</strong></p>
                     <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">{request.quotationDetails}</p>
                    </>
                )}
              </div>
            </>
          )}
          
        </CardContent>
        <CardFooter className="border-t pt-6">
            {/* Aquí podrían ir acciones futuras específicas para la página de detalles si es necesario */}
            <p className="text-xs text-muted-foreground text-center w-full">Si necesitas realizar alguna acción sobre esta solicitud (ej. cancelar, aceptar cotización), por favor hazlo desde tu panel principal.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

