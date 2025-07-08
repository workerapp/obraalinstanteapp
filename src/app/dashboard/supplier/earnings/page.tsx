// src/app/dashboard/supplier/earnings/page.tsx
"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import type { QuotationRequest } from '@/types/quotationRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ArrowLeft, DollarSign, CreditCard, CheckCircle, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { markCommissionsAsPaid } from '@/actions/mark-commissions-paid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const fetchCompletedRequests = async (userId: string | undefined): Promise<QuotationRequest[]> => {
  if (!userId) return [];
  
  const requestsRef = collection(firestore, "quotationRequests");
  // Query is simplified to avoid complex indexing issues. Sorting is done on the client.
  const q = query(
    requestsRef, 
    where("handymanId", "==", userId),
    where("status", "==", "Completada")
  );
  
  const querySnapshot = await getDocs(q);
  const requests: QuotationRequest[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    requests.push({ 
      id: doc.id, 
      ...data,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    } as QuotationRequest);
  });
  
  // Sort data on the client to avoid complex Firestore indexes
  requests.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
  
  return requests;
};

export default function SupplierEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPaying, setIsPaying] = useState(false);

  const { data: completedRequests, isLoading, error } = useQuery<QuotationRequest[], Error>({
    queryKey: ['completedSupplierRequests', typedUser?.uid],
    queryFn: () => fetchCompletedRequests(typedUser?.uid),
    enabled: !!typedUser?.uid,
  });

  const totalEarnings = completedRequests?.reduce((sum, req) => sum + (req.handymanEarnings || 0), 0) || 0;
  const totalCommissionPaid = completedRequests
    ?.filter(req => req.commissionPaymentStatus === 'Pagada')
    .reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0) || 0;
  const totalCommissionPending = completedRequests
    ?.filter(req => req.commissionPaymentStatus === 'Pendiente')
    .reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0) || 0;

  const handlePayCommissions = async () => {
    if (!typedUser?.uid) return;
    setIsPaying(true);
    toast({ title: "Procesando Pago...", description: "Estamos actualizando el estado de tus comisiones." });

    const result = await markCommissionsAsPaid(typedUser.uid);

    if (result.success) {
      toast({ 
        title: "¡Pago Simulado Exitoso!", 
        description: `Se marcaron ${result.count || 0} comisiones como pagadas.`,
        variant: 'default',
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['completedSupplierRequests', typedUser.uid] });
      queryClient.invalidateQueries({ queryKey: ['allCompletedRequestsForAdmin'] });
    } else {
      toast({ 
        title: "Error en el Pago", 
        description: result.error || "No se pudo completar el pago simulado.", 
        variant: "destructive" 
      });
    }

    setIsPaying(false);
  };
  
  const getCommissionStatusColor = (status?: "Pendiente" | "Pagada"): string => {
    if (status === "Pagada") return "bg-green-600 text-white";
    if (status === "Pendiente") return "bg-orange-500 text-white";
    return "border-gray-400 text-gray-600";
  };
  
  if (isLoading || authLoading) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!typedUser) {
    router.push('/sign-in');
    return null;
  }
  
  if (error) {
    const isIndexError = error.message.toLowerCase().includes('index') || error.message.toLowerCase().includes('failed-precondition');
    return (
        <div className="max-w-2xl mx-auto py-10">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Ganancias</AlertTitle>
                <AlertDescription>
                    {isIndexError
                        ? "Error de base de datos: La consulta para obtener tus ganancias requiere un índice en Firestore que no existe. Revisa la consola de depuración del navegador (F12) y busca el mensaje de error de Firestore que contiene un enlace para crear el índice."
                        : "No se pudieron cargar tus ganancias. Por favor, intenta de nuevo más tarde."
                    }
                    <br />
                    <small className="text-xs opacity-70 mt-2 block">Detalle: {error.message}</small>
                </AlertDescription>
            </Alert>
             <Button variant="outline" onClick={() => router.back()} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Mis Ganancias y Comisiones</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/supplier"><ArrowLeft size={16} className="mr-2" />Volver al Panel</Link>
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Total Ganado (Neto)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">${totalEarnings.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Suma de tus ganancias después de comisiones.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="text-orange-500"/>Comisión Pendiente de Pago</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-orange-600">${totalCommissionPending.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Comisiones por pagar a la plataforma.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="text-blue-500"/>Comisión ya Pagada</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">${totalCommissionPaid.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Comisiones que ya has liquidado.</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liquidación de Comisiones</CardTitle>
          <CardDescription>
            Aquí puedes liquidar todas tus comisiones pendientes. En el futuro, podrás conectar una pasarela de pagos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalCommissionPending > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center sm:text-left">
                  <p className="font-semibold">Monto total a pagar:</p>
                  <p className="text-2xl font-bold text-primary">${totalCommissionPending.toLocaleString('es-CO')}</p>
              </div>
              <Button size="lg" onClick={handlePayCommissions} disabled={isPaying}>
                {isPaying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
                {isPaying ? 'Procesando...' : 'Pagar Comisiones Pendientes (Simulación)'}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">¡No tienes comisiones pendientes por pagar!</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas Completadas</CardTitle>
          <CardDescription>Detalle de todas tus ventas finalizadas que han generado ingresos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Producto/Solicitud</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha Finalizado</TableHead><TableHead className="text-right">Tu Ganancia</TableHead><TableHead className="text-right">Comisión</TableHead><TableHead>Estado Comisión</TableHead></TableRow></TableHeader>
            <TableBody>
              {completedRequests && completedRequests.length > 0 ? (
                completedRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium"><Button variant="link" asChild className="p-0 h-auto font-medium"><Link href={`/dashboard/requests/${req.id}`}>{req.serviceName}</Link></Button></TableCell>
                    <TableCell>{req.contactFullName}</TableCell>
                    <TableCell>{req.updatedAt?.toDate ? format(req.updatedAt.toDate(), 'P', { locale: es }) : 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">${(req.handymanEarnings || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="text-right text-red-600">${(req.platformFeeCalculated || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                      {req.platformFeeCalculated && req.platformFeeCalculated > 0 ? (
                        <Badge variant={req.commissionPaymentStatus === "Pagada" ? "default" : "secondary"} className={getCommissionStatusColor(req.commissionPaymentStatus)}>{req.commissionPaymentStatus}</Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center h-24">No tienes ventas completadas todavía.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
