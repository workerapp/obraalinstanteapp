
// src/app/dashboard/handyman/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  CalendarCheck, 
  DollarSign, 
  Settings2, 
  UserCog, 
  ListChecks, 
  Loader2, 
  AlertTriangle, 
  Edit3,
  FileSignature, // Para Cotizar
  XCircle, // Para Rechazar
  CalendarPlus, // Para Programar
  CheckCircle2 // Para Completar
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuotationRequest } from '@/types/quotationRequest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const fetchHandymanRequests = async (handymanUid: string | undefined): Promise<QuotationRequest[]> => {
  if (!handymanUid) return [];
  
  const requestsRef = collection(firestore, "quotationRequests");
  // Mostramos todas excepto las canceladas por el cliente directamente o ya completadas por el operario
  // O ajustamos para mostrar completadas si queremos que el operario las vea en su lista principal
  const q = query(
    requestsRef, 
    where("handymanId", "==", handymanUid),
    // Dejamos 'Cancelada' fuera para que no aparezcan las que el cliente canceló.
    // El operario podría tener su propio "historial de rechazadas" si fuera necesario.
    where("status", "in", ["Enviada", "Revisando", "Cotizada", "Programada", "Completada"]), 
    orderBy("status"), // Podríamos ordenar por status para agruparlas visualmente
    orderBy("requestedAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  const requests: QuotationRequest[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    requests.push({ 
      id: doc.id, 
      ...data,
      requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt : Timestamp.now(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    } as QuotationRequest);
  });
  return requests;
};


export default function HandymanDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdatingRequestId, setIsUpdatingRequestId] = useState<string | null>(null);

  const { data: quotationRequests, isLoading: requestsLoading, error: requestsError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['handymanRequests', typedUser?.uid],
    queryFn: () => fetchHandymanRequests(typedUser?.uid),
    enabled: !!typedUser?.uid && typedUser.role === 'handyman', 
  });

  // TODO: Calcular ganancias reales de `quotationRequests` con status 'Completada' y que tengan un precio.
  const totalEarnings = quotationRequests
    ?.filter(req => req.status === 'Completada')
    // .reduce((sum, req) => sum + (req.price || 0), 0) // Asumiendo que hay un campo 'price' en QuotationRequest
    .length * 0; // Placeholder, ya que no tenemos precio por ahora

  const getStatusColorClass = (status: QuotationRequest['status']): string => {
     switch (status) {
      case 'Completada':
        return 'bg-green-600 text-white';
      case 'Programada':
        return 'bg-blue-500 text-white';
      case 'Enviada':
        return 'bg-yellow-500 text-black';
      case 'Revisando':
        return 'bg-orange-500 text-white';
      case 'Cotizada':
        return 'bg-purple-500 text-white';
      case 'Cancelada': 
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  const handleChangeRequestStatus = async (requestId: string, newStatus: QuotationRequest['status']) => {
    if (!typedUser?.uid) {
      toast({ title: "Error", description: "No se pudo identificar al operario.", variant: "destructive" });
      return;
    }
    setIsUpdatingRequestId(requestId);
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestId);
      await updateDoc(requestDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Estado Actualizado", description: `La solicitud ahora está "${newStatus}".` });
      queryClient.invalidateQueries({ queryKey: ['handymanRequests', typedUser.uid] });
    } catch (error: any) {
      console.error("Error al actualizar estado de solicitud:", error);
      toast({ title: "Error al Actualizar", description: error.message || "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setIsUpdatingRequestId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!typedUser && !authLoading) { 
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Debes iniciar sesión como operario para ver este panel.</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  if (typedUser && typedUser.role !== 'handyman' && !authLoading) {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Esta sección es solo para operarios.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/customer">Ir al Panel de Cliente</Link>
        </Button>
      </div>
    );
  }
  

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <UserCog className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Panel de Operario</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Gestiona tus servicios, solicitudes de clientes, y perfil.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="text-accent"/>Mis Servicios</CardTitle>
            <CardDescription>Gestiona los servicios que ofreces.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Añade nuevos servicios, actualiza precios y establece tu disponibilidad.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/handyman/services">Gestionar Servicios</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Ganancias Totales</CardTitle>
            <CardDescription>Tus ganancias de trabajos completados.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">${totalEarnings.toLocaleString('es-CO')}</p>
            <p className="text-xs text-muted-foreground">Cálculo basado en solicitudes completadas (se requiere precio en la cotización).</p>
          </CardContent>
           <CardFooter>
            <Button asChild variant="outline" className="w-full" disabled>
              <Link href="/dashboard/handyman/earnings">Ver Detalles de Ganancias (Próximamente)</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="text-muted-foreground"/>Perfil y Configuración</CardTitle>
            <CardDescription>Actualiza tu perfil público y cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Mantén tu información actualizada para los clientes.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full" disabled>
              <Link href="/dashboard/handyman/profile">Editar Perfil (Próximamente)</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Solicitudes de Servicio Recibidas</CardTitle>
          <CardDescription>Gestiona tu agenda y responde a nuevas solicitudes de servicio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {requestsError && ( 
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Solicitudes</AlertTitle>
              <AlertDescription>
                {requestsError.message.toLowerCase().includes('index') || requestsError.message.toLowerCase().includes('failed-precondition') ? (
                  <>
                    Firestore necesita un índice para esta consulta. Por favor, revisa la consola de tu navegador (o los logs del servidor si estás desarrollando localmente) para obtener un enlace directo y crear el índice necesario en la consola de Firebase.
                    Una vez creado el índice, espera unos minutos e intenta recargar la página.
                    <br />
                    <small>Detalle del error original: {requestsError.message}</small>
                  </>
                ) : (
                  <>
                    No pudimos cargar tus solicitudes en este momento. Verifica tu conexión o inténtalo más tarde.
                    <br />
                    <small>Detalle: {requestsError.message}</small>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          {!requestsLoading && !requestsError && quotationRequests && quotationRequests.length > 0 ? quotationRequests.map((req, index) => (
            <div key={req.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-semibold">{req.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">Cliente: {req.contactFullName} ({req.contactEmail})</p>
                    <p className="text-sm text-muted-foreground">
                        Solicitado: {req.requestedAt && typeof req.requestedAt.toDate === 'function' ? format(req.requestedAt.toDate(), 'PPPp', { locale: es }) : 'Fecha no disponible'}
                    </p>
                     <p className="text-sm text-muted-foreground truncate max-w-md" title={req.problemDescription}>Problema: {req.problemDescription}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <Badge className={`mt-2 sm:mt-0 self-start sm:self-end ${getStatusColorClass(req.status)}`}>
                        {req.status}
                      </Badge>
                  </div>
                </div>
                 <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => console.log('Ver detalles de la solicitud:', req.id)} disabled>Ver Detalles (Próximamente)</Button>
                    
                    {req.status === 'Enviada' && 
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-orange-600 hover:text-orange-700" 
                          onClick={() => handleChangeRequestStatus(req.id, 'Revisando')}
                          disabled={isUpdatingRequestId === req.id}
                        >
                          {isUpdatingRequestId === req.id ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><Edit3 className="mr-1.5 h-4 w-4" /> Marcar como Revisando</>
                          )}
                        </Button>
                    }
                     {(req.status === 'Enviada' || req.status === 'Revisando') && 
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-destructive hover:text-destructive/70" 
                          onClick={() => handleChangeRequestStatus(req.id, 'Cancelada')}
                          disabled={isUpdatingRequestId === req.id}
                        >
                          {isUpdatingRequestId === req.id ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><XCircle className="mr-1.5 h-4 w-4" /> Rechazar Solicitud</>
                          )}
                        </Button>
                    }
                     {req.status === 'Revisando' &&
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-purple-600 hover:text-purple-700" 
                          onClick={() => handleChangeRequestStatus(req.id, 'Cotizada')}
                          disabled={isUpdatingRequestId === req.id}
                        >
                           {isUpdatingRequestId === req.id ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><FileSignature className="mr-1.5 h-4 w-4" /> Marcar como Cotizada</>
                          )}
                        </Button>
                    }
                     {req.status === 'Cotizada' && 
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-blue-600 hover:text-blue-700" 
                          onClick={() => handleChangeRequestStatus(req.id, 'Programada')}
                          disabled={isUpdatingRequestId === req.id}
                        >
                          {isUpdatingRequestId === req.id ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><CalendarPlus className="mr-1.5 h-4 w-4" /> Marcar como Programada</>
                          )}
                        </Button>
                    }
                     {req.status === 'Programada' &&
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-green-700 hover:text-green-800" 
                          onClick={() => handleChangeRequestStatus(req.id, 'Completada')}
                          disabled={isUpdatingRequestId === req.id}
                        >
                          {isUpdatingRequestId === req.id ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Marcar como Completada</>
                          )}
                        </Button>
                    }
                </div>
              </div>
              {index < quotationRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            !requestsLoading && !requestsError && <p className="text-muted-foreground text-center py-6">No tienes solicitudes de servicio activas o asignadas en este momento.</p>
          )}
        </CardContent>
         <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('Ver historial completo clickeado')} disabled>
                <CalendarCheck className="mr-2 h-4 w-4"/> Ver Historial Completo (Próximamente)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    
