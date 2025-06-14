
// src/app/dashboard/customer/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, MessageSquarePlus, History, UserCircle, Loader2, Trash2, CheckCircle2, CalendarPlus, Eye } from 'lucide-react'; // Added Eye icon
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const fetchQuotationRequests = async (userId: string | undefined): Promise<QuotationRequest[]> => {
  if (!userId) return [];
  
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(requestsRef, where("userId", "==", userId), orderBy("requestedAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const requests: QuotationRequest[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const requestedAt = data.requestedAt instanceof Timestamp ? data.requestedAt : Timestamp.now();
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now();

    requests.push({ 
      id: doc.id, 
      ...data,
      requestedAt: requestedAt,
      updatedAt: updatedAt,
    } as QuotationRequest);
  });
  return requests;
};

export default function CustomerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [requestToCancelId, setRequestToCancelId] = useState<string | null>(null);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);

  const [isAcceptAlertOpen, setIsAcceptAlertOpen] = useState(false);
  const [requestToAcceptId, setRequestToAcceptId] = useState<string | null>(null);
  const [isAcceptingQuotation, setIsAcceptingQuotation] = useState(false);

  const { data: quotationRequests, isLoading: requestsLoading, error: requestsError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['quotationRequests', typedUser?.uid],
    queryFn: () => fetchQuotationRequests(typedUser?.uid),
    enabled: !!typedUser?.uid, 
  });

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

  const openCancelConfirmDialog = (requestId: string) => {
    setRequestToCancelId(requestId);
    setIsCancelAlertOpen(true);
  };

  const handleCancelRequest = async () => {
    if (!requestToCancelId || !typedUser?.uid) {
      toast({ title: "Error", description: "No se pudo identificar la solicitud o el usuario.", variant: "destructive" });
      return;
    }

    setIsCancellingRequest(true);
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestToCancelId);
      await updateDoc(requestDocRef, {
        status: "Cancelada",
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Solicitud Cancelada", description: "Tu solicitud de cotización ha sido cancelada." });
      queryClient.invalidateQueries({ queryKey: ['quotationRequests', typedUser.uid] });
      setIsCancelAlertOpen(false);
      setRequestToCancelId(null);
    } catch (error: any) {
      console.error("Error al cancelar solicitud:", error);
      toast({ title: "Error al Cancelar", description: error.message || "No se pudo cancelar la solicitud.", variant: "destructive" });
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const openAcceptConfirmDialog = (requestId: string) => {
    setRequestToAcceptId(requestId);
    setIsAcceptAlertOpen(true);
  };

  const handleAcceptQuotation = async () => {
    if (!requestToAcceptId || !typedUser?.uid) {
      toast({ title: "Error", description: "No se pudo identificar la solicitud o el usuario.", variant: "destructive" });
      return;
    }

    setIsAcceptingQuotation(true);
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestToAcceptId);
      await updateDoc(requestDocRef, {
        status: "Programada",
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Cotización Aceptada", description: "El servicio ha sido programado. El operario se pondrá en contacto." });
      queryClient.invalidateQueries({ queryKey: ['quotationRequests', typedUser.uid] });
      setIsAcceptAlertOpen(false);
      setRequestToAcceptId(null);
    } catch (error: any) {
      console.error("Error al aceptar cotización:", error);
      toast({ title: "Error al Aceptar", description: error.message || "No se pudo aceptar la cotización.", variant: "destructive" });
    } finally {
      setIsAcceptingQuotation(false);
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
        <p className="text-muted-foreground">Debes iniciar sesión para ver tu panel de cliente.</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <UserCircle className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Panel de Cliente</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Realiza seguimiento de tus solicitudes de servicio, gestiona citas y consulta tu historial.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 lg:col-span-1 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="text-primary"/>Nueva Solicitud de Servicio</CardTitle>
                <CardDescription>¿Necesitas que algo se repare o instale?</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Solicita rápidamente un nuevo servicio de nuestro catálogo u obtén una cotización personalizada.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/request-quotation">Solicitar Nuevo Servicio</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la cancelación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará tu solicitud de cotización. No podrás deshacerla, pero puedes enviar una nueva solicitud si cambias de opinión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsCancelAlertOpen(false); setRequestToCancelId(null);}}>Volver</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelRequest} 
              disabled={isCancellingRequest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancellingRequest ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Confirmar Cancelación</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Quotation Confirmation Dialog */}
      <AlertDialog open={isAcceptAlertOpen} onOpenChange={setIsAcceptAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aceptar Cotización y Programar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto confirmará que aceptas la cotización y el servicio se marcará como "Programada". El operario se pondrá en contacto para coordinar los detalles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsAcceptAlertOpen(false); setRequestToAcceptId(null);}}>Volver</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAcceptQuotation} 
              disabled={isAcceptingQuotation}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAcceptingQuotation ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aceptando...</>
              ) : (
                <><CalendarPlus className="mr-2 h-4 w-4" /> Aceptar y Programar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Mis Solicitudes de Servicio</CardTitle>
          <CardDescription>Resumen de tus solicitudes de servicio activas y pasadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading && typedUser && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {requestsError && typedUser && ( 
            <Alert variant="destructive">
              <AlertTitle>Error al Cargar Solicitudes</AlertTitle>
              <AlertDescription>
                No pudimos cargar tus solicitudes en este momento. Por favor, intenta de nuevo más tarde.
                <br />
                <small>{requestsError.message}</small>
              </AlertDescription>
            </Alert>
          )}
          {!requestsLoading && !requestsError && quotationRequests && quotationRequests.length > 0 && typedUser ? quotationRequests.map((req, index) => (
            <div key={req.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="font-semibold">{req.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Solicitado: {req.requestedAt && typeof req.requestedAt.toDate === 'function' ? format(req.requestedAt.toDate(), 'PPPp', { locale: es }) : 'Fecha no disponible'}
                      {req.handymanName && ` | Operario Solicitado: ${req.handymanName}`}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-md" title={req.problemDescription}>Problema: {req.problemDescription}</p>
                  </div>
                  <Badge 
                    className={`mt-2 sm:mt-0 self-start sm:self-center ${getStatusColorClass(req.status)}`}
                  >
                    {req.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent hover:text-accent/80">
                        <Link href={`/dashboard/requests/${req.id}`}><Eye className="mr-1.5 h-4 w-4" />Ver Detalles</Link>
                    </Button>
                    {(req.status === 'Enviada' || req.status === 'Revisando') && 
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-destructive hover:text-destructive/70" 
                          onClick={() => openCancelConfirmDialog(req.id)}
                          disabled={isCancellingRequest && requestToCancelId === req.id}
                        >
                          {isCancellingRequest && requestToCancelId === req.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                          Cancelar Solicitud
                        </Button>
                    }
                     {req.status === 'Cotizada' && 
                        <>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-green-600 hover:text-green-700" 
                            onClick={() => openAcceptConfirmDialog(req.id)}
                            disabled={isAcceptingQuotation && requestToAcceptId === req.id}
                          >
                            {isAcceptingQuotation && requestToAcceptId === req.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                            Aceptar Cotización
                          </Button>
                           <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-destructive hover:text-destructive/70" 
                            onClick={() => openCancelConfirmDialog(req.id)} // Client can still cancel/reject a quote
                            disabled={isCancellingRequest && requestToCancelId === req.id}
                          >
                            {isCancellingRequest && requestToCancelId === req.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                            Rechazar Cotización
                          </Button>
                        </>
                    }
                </div>
              </div>
              {index < quotationRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            !requestsLoading && !requestsError && typedUser && <p className="text-muted-foreground text-center py-4">Aún no tienes solicitudes de servicio.</p>
          )}
        </CardContent>
        {typedUser && (
          <CardFooter className="justify-center">
              <Button variant="outline" onClick={() => console.log('Ver historial completo clickeado')} disabled>
                  <History className="mr-2 h-4 w-4"/> Ver Historial Completo (Próximamente)
              </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

