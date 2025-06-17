
// src/app/dashboard/handyman/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  FileSignature, 
  XCircle, 
  CalendarPlus, 
  CheckCircle2,
  Eye,
  CreditCard // Added for commission status
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

// Tasa de comisión de la plataforma (ej. 10%)
const PLATFORM_COMMISSION_RATE = 0.10;

const fetchHandymanRequests = async (handymanUid: string | undefined): Promise<QuotationRequest[]> => {
  if (!handymanUid) return [];
  
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(
    requestsRef, 
    where("handymanId", "==", handymanUid),
    orderBy("status"), 
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
      commissionPaymentStatus: data.commissionPaymentStatus || undefined,
    } as QuotationRequest);
  });
  return requests;
};

const quoteFormSchema = z.object({
  quotedAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({invalid_type_error: "El monto debe ser un número."}).positive({ message: "El monto debe ser positivo." })
  ),
  quotationDetails: z.string().max(500, "Los detalles no deben exceder 500 caracteres.").optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

export default function HandymanDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdatingRequestId, setIsUpdatingRequestId] = useState<string | null>(null);

  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [requestBeingQuoted, setRequestBeingQuoted] = useState<QuotationRequest | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const quoteForm = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quotedAmount: undefined,
      quotationDetails: "",
    },
  });

  const { data: quotationRequests, isLoading: requestsLoading, error: requestsError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['handymanRequests', typedUser?.uid],
    queryFn: () => fetchHandymanRequests(typedUser?.uid),
    enabled: !!typedUser?.uid && typedUser.role === 'handyman', 
  });

  const totalHandymanEarnings = quotationRequests
    ?.filter(req => req.status === 'Completada' && req.handymanEarnings)
    .reduce((sum, req) => sum + (req.handymanEarnings || 0), 0) || 0;

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
  }
  
  const getCommissionStatusColor = (status?: "Pendiente" | "Pagada"): string => {
    if (status === "Pagada") return "bg-green-600 text-white";
    if (status === "Pendiente") return "bg-orange-500 text-white";
    return "border-gray-400 text-gray-600";
  };

  const handleChangeRequestStatus = async (requestId: string, newStatus: QuotationRequest['status']) => {
    if (!typedUser?.uid) {
      toast({ title: "Error", description: "No se pudo identificar al operario.", variant: "destructive" });
      return;
    }
    setIsUpdatingRequestId(requestId);
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'Completada') {
        const currentRequest = quotationRequests?.find(req => req.id === requestId);
        if (currentRequest && currentRequest.quotedAmount && currentRequest.quotedAmount > 0) {
          updateData.platformCommissionRate = PLATFORM_COMMISSION_RATE;
          updateData.platformFeeCalculated = currentRequest.quotedAmount * PLATFORM_COMMISSION_RATE;
          updateData.handymanEarnings = currentRequest.quotedAmount - updateData.platformFeeCalculated;
          if (updateData.platformFeeCalculated > 0) {
            updateData.commissionPaymentStatus = "Pendiente";
          } else {
            updateData.commissionPaymentStatus = null;
          }
        } else {
          updateData.platformCommissionRate = null;
          updateData.platformFeeCalculated = null;
          updateData.handymanEarnings = currentRequest?.quotedAmount ?? 0; 
          updateData.commissionPaymentStatus = null;
        }
      } else if (newStatus !== 'Cotizada') { 
        updateData.platformCommissionRate = null;
        updateData.platformFeeCalculated = null;
        updateData.handymanEarnings = null;
        updateData.commissionPaymentStatus = null;
      }


      await updateDoc(requestDocRef, updateData);

      toast({ title: "Estado Actualizado", description: `La solicitud ahora está "${newStatus}".` });
      queryClient.invalidateQueries({ queryKey: ['handymanRequests', typedUser.uid] });
      queryClient.invalidateQueries({ queryKey: ['allCompletedRequestsForAdmin'] }); 
    } catch (error: any) {
      console.error("Error al actualizar estado de solicitud:", error);
      toast({ title: "Error al Actualizar", description: error.message || "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setIsUpdatingRequestId(null);
    }
  };

  const openQuoteDialog = (request: QuotationRequest) => {
    setRequestBeingQuoted(request);
    quoteForm.reset({ 
      quotedAmount: request.quotedAmount ?? undefined, 
      quotationDetails: request.quotationDetails || "",
    });
    setIsQuoteDialogOpen(true);
  };

  const handleQuoteSubmit: SubmitHandler<QuoteFormData> = async (data) => {
    if (!requestBeingQuoted || !typedUser?.uid) {
      toast({ title: "Error", description: "No se pudo identificar la solicitud o el operario.", variant: "destructive" });
      return;
    }
    setIsSubmittingQuote(true);
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestBeingQuoted.id);
      await updateDoc(requestDocRef, {
        status: "Cotizada",
        quotedAmount: data.quotedAmount,
        quotedCurrency: "COP", 
        quotationDetails: data.quotationDetails || null,
        updatedAt: serverTimestamp(),
        platformCommissionRate: null,
        platformFeeCalculated: null,
        handymanEarnings: null,
        commissionPaymentStatus: null,
      });

      toast({ title: "Cotización Enviada", description: `La cotización para "${requestBeingQuoted.serviceName}" ha sido enviada.` });
      queryClient.invalidateQueries({ queryKey: ['handymanRequests', typedUser.uid] });
      setIsQuoteDialogOpen(false);
      setRequestBeingQuoted(null);
    } catch (error: any) {
      console.error("Error al enviar cotización:", error);
      toast({ title: "Error al Cotizar", description: error.message || "No se pudo enviar la cotización.", variant: "destructive" });
    } finally {
      setIsSubmittingQuote(false);
    }
  };


  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!typedUser && !authLoading) { 
     return <div className="text-center py-10"><h1 className="text-2xl font-bold">Acceso Denegado</h1><p className="text-muted-foreground">Debes iniciar sesión como operario para ver este panel.</p><Button asChild className="mt-4"><Link href="/sign-in">Iniciar Sesión</Link></Button></div>;
  }
  if (typedUser && typedUser.role !== 'handyman' && !authLoading) {
     return <div className="text-center py-10"><h1 className="text-2xl font-bold">Acceso Denegado</h1><p className="text-muted-foreground">Esta sección es solo para operarios.</p><Button asChild className="mt-4"><Link href="/dashboard/customer">Ir al Panel de Cliente</Link></Button></div>;
  }
  
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
        <UserCog className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Panel de Operario</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">Gestiona tus servicios, solicitudes de clientes, y perfil.</p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="text-accent"/>Mis Servicios</CardTitle><CardDescription>Gestiona los servicios que ofreces.</CardDescription></CardHeader>
          <CardContent><p>Añade nuevos servicios, actualiza precios y establece tu disponibilidad.</p></CardContent>
          <CardFooter><Button asChild variant="outline" className="w-full"><Link href="/dashboard/handyman/services">Gestionar Servicios</Link></Button></CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Mis Ganancias (Neto)</CardTitle><CardDescription>Ganancias después de comisión de plataforma.</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">${totalHandymanEarnings.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Basado en solicitudes completadas.</p></CardContent>
           <CardFooter><Button asChild variant="outline" className="w-full" disabled><Link href="/dashboard/handyman/earnings">Ver Detalles (Próximamente)</Link></Button></CardFooter>
        </Card>
         <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="text-muted-foreground"/>Perfil y Configuración</CardTitle><CardDescription>Actualiza tu perfil público y cuenta.</CardDescription></CardHeader>
          <CardContent><p>Mantén tu información actualizada para los clientes.</p></CardContent>
          <CardFooter><Button asChild variant="outline" className="w-full"><Link href="/dashboard/handyman/profile">Editar Perfil</Link></Button></CardFooter>
        </Card>
      </div>

      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Realizar Cotización para "{requestBeingQuoted?.serviceName}"</DialogTitle>
            <DialogDescription>
              Ingresa el monto y detalles para la solicitud de {requestBeingQuoted?.contactFullName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...quoteForm}>
            <form onSubmit={quoteForm.handleSubmit(handleQuoteSubmit)} className="space-y-4 py-4">
              <FormField
                control={quoteForm.control}
                name="quotedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Cotizado (COP)</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 150000" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={quoteForm.control}
                name="quotationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles Adicionales (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Incluye materiales y mano de obra. Válido por 15 días." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmittingQuote}>
                  {isSubmittingQuote ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar Cotización"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Card className="shadow-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Solicitudes de Servicio Recibidas</CardTitle><CardDescription>Gestiona tu agenda y responde a nuevas solicitudes.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading && <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {requestsError && ( 
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Solicitudes</AlertTitle>
              <AlertDescription>
                {requestsError.message.toLowerCase().includes('index') || requestsError.message.toLowerCase().includes('failed-precondition') ? 
                  (<>Firestore necesita un índice para esta consulta. Revisa la consola para un enlace y créalo en Firebase.<br /><small>Detalle: {requestsError.message}</small></>) : 
                  (<>No pudimos cargar tus solicitudes. Inténtalo más tarde.<br /><small>Detalle: {requestsError.message}</small></>)
                }
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
                    <p className="text-sm text-muted-foreground">Solicitado: {req.requestedAt?.toDate ? format(req.requestedAt.toDate(), 'PPPp', { locale: es }) : 'Fecha no disp.'}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md" title={req.problemDescription}>Problema: {req.problemDescription}</p>
                    
                    {req.status === 'Completada' && req.quotedAmount != null && (
                      <div className="text-xs mt-1 space-y-0.5">
                        <p className="text-purple-600">Cotizado: ${req.quotedAmount.toLocaleString('es-CO')}</p>
                        <p className="text-red-600">Comisión Plataforma ({((req.platformCommissionRate || 0) * 100).toFixed(0)}%): -${(req.platformFeeCalculated || 0).toLocaleString('es-CO')}</p>
                        <p className="text-green-700 font-medium">Tu Ganancia: ${(req.handymanEarnings || 0).toLocaleString('es-CO')}</p>
                        {req.platformFeeCalculated && req.platformFeeCalculated > 0 && (
                           <div className="flex items-center gap-1.5 mt-1">
                               <CreditCard className="h-3 w-3 text-muted-foreground" />
                               <span className="text-xs text-muted-foreground">Comisión:</span>
                               <Badge 
                                variant={req.commissionPaymentStatus === "Pagada" ? "default" : "secondary"}
                                className={`text-xs ${getCommissionStatusColor(req.commissionPaymentStatus)}`}
                               >
                                {req.commissionPaymentStatus || 'N/A'}
                               </Badge>
                           </div>
                        )}
                      </div>
                    )}
                    {(req.status === 'Cotizada' || req.status === 'Programada') && req.quotedAmount != null && (
                        <p className="text-sm text-purple-600 font-medium mt-1">Monto Cotizado: ${req.quotedAmount.toLocaleString('es-CO')} {req.quotedCurrency || 'COP'}</p>
                    )}
                  </div>
                  <Badge className={`mt-2 sm:mt-0 self-start sm:self-end ${getStatusColorClass(req.status)}`}>{req.status}</Badge>
                </div>
                 <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent hover:text-accent/80">
                        <Link href={`/dashboard/requests/${req.id}`}><Eye className="mr-1.5 h-4 w-4" />Ver Detalles</Link>
                    </Button>
                    
                    {req.status === 'Enviada' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-orange-600 hover:text-orange-700" onClick={() => handleChangeRequestStatus(req.id, 'Revisando')} disabled={isUpdatingRequestId === req.id}>
                          {isUpdatingRequestId === req.id && req.status === 'Enviada' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Edit3 className="mr-1.5 h-4 w-4" />}Marcar como Revisando
                        </Button>
                    }
                     {(req.status === 'Enviada' || req.status === 'Revisando') && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive hover:text-destructive/70" onClick={() => handleChangeRequestStatus(req.id, 'Cancelada')} disabled={isUpdatingRequestId === req.id}>
                          {isUpdatingRequestId === req.id && (req.status === 'Enviada' || req.status === 'Revisando') ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}Rechazar Solicitud
                        </Button>
                    }
                     {req.status === 'Revisando' &&
                        <Button variant="link" size="sm" className="p-0 h-auto text-purple-600 hover:text-purple-700" onClick={() => openQuoteDialog(req)} disabled={isUpdatingRequestId === req.id || isQuoteDialogOpen}>
                           {isUpdatingRequestId === req.id && req.status === 'Revisando' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileSignature className="mr-1.5 h-4 w-4" />}Realizar Cotización
                        </Button>
                    }
                     {req.status === 'Cotizada' && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 hover:text-blue-700" onClick={() => handleChangeRequestStatus(req.id, 'Programada')} disabled={isUpdatingRequestId === req.id}>
                          {isUpdatingRequestId === req.id && req.status === 'Cotizada' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-1.5 h-4 w-4" />}Marcar como Programada
                        </Button>
                    }
                     {req.status === 'Programada' &&
                        <Button variant="link" size="sm" className="p-0 h-auto text-green-700 hover:text-green-800" onClick={() => handleChangeRequestStatus(req.id, 'Completada')} disabled={isUpdatingRequestId === req.id}>
                          {isUpdatingRequestId === req.id && req.status === 'Programada' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}Marcar como Completada
                        </Button>
                    }
                </div>
              </div>
              {index < quotationRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            !requestsLoading && !requestsError && <p className="text-muted-foreground text-center py-6">No tienes solicitudes activas o asignadas.</p>
          )}
        </CardContent>
         <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('Ver historial completo')} disabled><CalendarCheck className="mr-2 h-4 w-4"/>Ver Historial (Próximamente)</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    
