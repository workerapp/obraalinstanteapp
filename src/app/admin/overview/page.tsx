
// src/app/admin/overview/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, DollarSign, Users, ListChecks, Loader2, AlertTriangle, ArrowLeft, CheckCircle, XCircle, CreditCard, CircleDollarSign } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuotationRequest } from '@/types/quotationRequest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const fetchAllCompletedRequests = async (): Promise<QuotationRequest[]> => {
  console.log("Admin Overview: Fetching all completed requests from Firestore...");
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(
    requestsRef, 
    where("status", "==", "Completada"),
    orderBy("updatedAt", "desc")
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
      commissionPaymentStatus: data.commissionPaymentStatus || undefined, // Ensure field is present
    } as QuotationRequest);
  });
  console.log(`Admin Overview: Fetched ${requests.length} completed requests.`);
  return requests;
};

interface CommissionsByHandyman {
  [handymanId: string]: {
    name: string;
    totalPlatformFee: number;
    totalPendingPlatformFee: number;
    totalPaidPlatformFee: number;
    requestCount: number;
  };
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);
  const [isUpdatingCommissionStatusId, setIsUpdatingCommissionStatusId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: allCompletedRequests, isLoading, error, isError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['allCompletedRequestsForAdmin'],
    queryFn: fetchAllCompletedRequests,
  });
  
  console.log("Admin Overview: allCompletedRequests from useQuery:", allCompletedRequests);

  const validCompletedRequests = allCompletedRequests?.filter(req => req.quotedAmount && req.quotedAmount > 0) || [];
  console.log("Admin Overview: validCompletedRequests (filtered for quotedAmount > 0):", validCompletedRequests);
  
  const totalPlatformRevenue = validCompletedRequests.reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0);
  const totalQuotedAmount = validCompletedRequests.reduce((sum, req) => sum + (req.quotedAmount || 0), 0);
  const totalHandymanPayout = validCompletedRequests.reduce((sum, req) => sum + (req.handymanEarnings || 0), 0);

  const commissionsByHandyman = validCompletedRequests.reduce((acc, req) => {
    if (req.handymanId && req.handymanName && req.platformFeeCalculated) {
      if (!acc[req.handymanId]) {
        acc[req.handymanId] = { 
            name: req.handymanName, 
            totalPlatformFee: 0, 
            totalPendingPlatformFee: 0,
            totalPaidPlatformFee: 0,
            requestCount: 0 
        };
      }
      acc[req.handymanId].totalPlatformFee += req.platformFeeCalculated;
      acc[req.handymanId].requestCount += 1;
      if (req.commissionPaymentStatus === "Pendiente") {
        acc[req.handymanId].totalPendingPlatformFee += req.platformFeeCalculated;
      } else if (req.commissionPaymentStatus === "Pagada") {
        acc[req.handymanId].totalPaidPlatformFee += req.platformFeeCalculated;
      }
    }
    return acc;
  }, {} as CommissionsByHandyman);
  
  console.log("Admin Overview: Calculated Metrics:", { totalPlatformRevenue, totalQuotedAmount, totalHandymanPayout, commissionsByHandyman });

  const handleToggleCommissionStatus = async (requestId: string, currentStatus?: "Pendiente" | "Pagada") => {
    setIsUpdatingCommissionStatusId(requestId);
    const newStatus = currentStatus === "Pagada" ? "Pendiente" : "Pagada";
    try {
      const requestDocRef = doc(firestore, "quotationRequests", requestId);
      await updateDoc(requestDocRef, {
        commissionPaymentStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Estado de Comisión Actualizado", description: `La comisión para la solicitud ${requestId.substring(0,6)}... ahora está ${newStatus}.` });
      queryClient.invalidateQueries({ queryKey: ['allCompletedRequestsForAdmin'] });
    } catch (e: any) {
      console.error("Error al actualizar estado de comisión:", e);
      toast({ title: "Error", description: `No se pudo actualizar el estado de la comisión: ${e.message}`, variant: "destructive" });
    } finally {
      setIsUpdatingCommissionStatusId(null);
    }
  };
  
  if (!isClient) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando datos del administrador...</p>
      </div>
    );
  }

  if (error) {
    console.error("Admin Overview: Error from useQuery:", error);
    return (
      <div className="max-w-4xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información del panel de administración.
            {error.message.toLowerCase().includes('index') || error.message.toLowerCase().includes('failed-precondition') 
              ? " Firestore podría necesitar un índice para esta consulta. Por favor, revisa la consola del navegador o los logs del servidor. Generalmente Firebase provee un enlace para crear el índice automáticamente si es complejo. Un índice simple sobre 'status' (asc) y 'updatedAt' (desc) en 'quotationRequests' podría ser necesario."
              : ` Detalle: ${error.message}`
            }
          </AlertDescription>
        </Alert>
         <Button variant="outline" onClick={() => router.push('/')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-accent/10 via-background to-background rounded-lg shadow-md">
        <BarChart className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl font-headline font-bold text-accent mb-2">Panel de Administración</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">
          Resumen de la actividad y ganancias de la plataforma.
        </p>
         <p className="text-xs text-destructive mt-2 max-w-xl mx-auto">
            Nota: Esta es una vista simulada y no incluye seguridad de roles. En una app real, estaría protegida.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Ingresos Totales (Plataforma)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">${totalPlatformRevenue.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Comisiones de servicios completados y cotizados.</p></CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="text-blue-500"/>Servicios Gestionados</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{validCompletedRequests.length || 0}</p><p className="text-xs text-muted-foreground">Total de trabajos completados y cotizados.</p></CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="text-purple-500"/>Operarios Activos (Conceptual)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{Object.keys(commissionsByHandyman).length}</p><p className="text-xs text-muted-foreground">Operarios que generaron comisiones.</p></CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl">
            <CardHeader><CardTitle>Resumen Financiero Global</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Monto Total Cotizado (Válido):</span> <span className="font-medium">${totalQuotedAmount.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span>Total Pagado a Operarios (Neto):</span> <span className="font-medium">${totalHandymanPayout.toLocaleString('es-CO')}</span></div>
                <Separator/>
                <div className="flex justify-between text-base"><strong>Ingresos Plataforma:</strong> <strong className="text-green-600">${totalPlatformRevenue.toLocaleString('es-CO')}</strong></div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl">
            <CardHeader><CardTitle>Estado de Comisiones por Operario</CardTitle></CardHeader>
            <CardContent>
            {Object.keys(commissionsByHandyman).length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Operario</TableHead>
                            <TableHead className="text-right">Servicios</TableHead>
                            <TableHead className="text-right">Comisión Total</TableHead>
                            <TableHead className="text-right">Pendiente</TableHead>
                            <TableHead className="text-right">Pagada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(commissionsByHandyman)
                            .sort(([, a], [, b]) => b.totalPlatformFee - a.totalPlatformFee) 
                            .map(([id, data]) => (
                            <TableRow key={id}>
                                <TableCell className="font-medium">{data.name} <span className="text-xs text-muted-foreground">({id.substring(0,6)}...)</span></TableCell>
                                <TableCell className="text-right">{data.requestCount}</TableCell>
                                <TableCell className="text-right font-semibold text-gray-700">${data.totalPlatformFee.toLocaleString('es-CO')}</TableCell>
                                <TableCell className="text-right font-semibold text-orange-600">${data.totalPendingPlatformFee.toLocaleString('es-CO')}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">${data.totalPaidPlatformFee.toLocaleString('es-CO')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-muted-foreground text-center py-4">No hay comisiones registradas de operarios todavía.</p>
            )}
            </CardContent>
        </Card>
      </div>


      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Detalle de Servicios Completados y Comisiones</CardTitle>
          <CardDescription>Lista de todos los servicios completados que generaron comisión (monto cotizado > 0).</CardDescription>
        </CardHeader>
        <CardContent>
          {validCompletedRequests && validCompletedRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Operario</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Monto Cotizado</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">Com. Plataforma</TableHead>
                  <TableHead className="text-right">G. Operario</TableHead>
                  <TableHead>Estado Comisión</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Fecha Completado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validCompletedRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.serviceName}</TableCell>
                    <TableCell>{req.handymanName || 'N/A'}</TableCell>
                    <TableCell>{req.contactFullName}</TableCell>
                    <TableCell className="text-right">${(req.quotedAmount || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="text-right">{((req.platformCommissionRate || 0) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right text-red-600">${(req.platformFeeCalculated || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="text-right text-green-700">${(req.handymanEarnings || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                        <Badge 
                            variant={req.commissionPaymentStatus === "Pagada" ? "default" : (req.commissionPaymentStatus === "Pendiente" ? "secondary" : "outline")}
                            className={
                                req.commissionPaymentStatus === "Pagada" ? "bg-green-600 text-white" : 
                                (req.commissionPaymentStatus === "Pendiente" ? "bg-orange-500 text-white" : "")
                            }
                        >
                            {req.commissionPaymentStatus || 'N/A'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {req.platformFeeCalculated && req.platformFeeCalculated > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleCommissionStatus(req.id, req.commissionPaymentStatus)}
                          disabled={isUpdatingCommissionStatusId === req.id}
                        >
                          {isUpdatingCommissionStatusId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                            req.commissionPaymentStatus === "Pagada" ? <XCircle className="mr-1.5 h-4 w-4"/> : <CheckCircle className="mr-1.5 h-4 w-4"/>
                          }
                          {req.commissionPaymentStatus === "Pagada" ? "Marcar Pendiente" : "Marcar Pagada"}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{req.updatedAt?.toDate ? format(req.updatedAt.toDate(), 'PP', { locale: es }) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-6">No hay servicios completados que hayan generado comisión todavía.</p>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Los cálculos de comisión y ganancias se basan en la tasa vigente y el monto cotizado al momento de marcar el servicio como completado. 
                El estado de pago de la comisión se actualiza manualmente.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
    
