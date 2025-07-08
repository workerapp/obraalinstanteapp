// src/app/dashboard/supplier/earnings/page.tsx
"use client";

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import type { QuotationRequest } from '@/types/quotationRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ArrowLeft, DollarSign, CreditCard, CheckCircle, Phone } from 'lucide-react';
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

  useEffect(() => {
    if (!authLoading && !typedUser) {
      router.push('/sign-in');
    }
  }, [authLoading, typedUser, router]);

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

  const getCommissionStatusColor = (status?: "Pendiente" | "Pagada"): string => {
    if (status === "Pagada") return "bg-green-600 text-white";
    if (status === "Pendiente") return "bg-orange-500 text-white";
    return "border-gray-400 text-gray-600";
  };
  
  if (isLoading || authLoading) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
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

      <Card className="shadow-lg bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="text-primary"/> ¿Listo para Pagar tus Comisiones?
          </CardTitle>
          <CardDescription>
            Para liquidar el saldo de comisiones pendientes, por favor contacta directamente al administrador de la plataforma a través de WhatsApp para coordinar el pago.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          {totalCommissionPending > 0 ? (
            <Button asChild>
              <Link 
                href={`https://wa.me/573243529658?text=${encodeURIComponent(`Hola, soy ${typedUser?.displayName || 'un proveedor'} (ID: ${typedUser?.uid}). Quiero coordinar el pago de mis comisiones pendientes por $${totalCommissionPending.toLocaleString('es-CO')}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="mr-2 h-4 w-4" /> Contactar para Pagar
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">¡Estás al día! No tienes comisiones pendientes por pagar.</p>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas Completadas</CardTitle>
          <CardDescription>Detalle de todas tus ventas finalizadas que han generado ingresos. Para pagar comisiones pendientes, contacta al administrador.</CardDescription>
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
