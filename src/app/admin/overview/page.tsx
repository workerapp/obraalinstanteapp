
// src/app/admin/overview/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, DollarSign, Users, ListChecks, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { QuotationRequest } from '@/types/quotationRequest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';


// Consulta simplificada: solo filtra por estado y ordena por fecha de actualización.
// El filtrado de quotedAmount > 0 se hará en el cliente.
const fetchAllCompletedRequests = async (): Promise<QuotationRequest[]> => {
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
    } as QuotationRequest);
  });
  return requests;
};

interface CommissionsByHandyman {
  [handymanId: string]: {
    name: string;
    totalCommission: number;
    requestCount: number;
  };
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: allCompletedRequests, isLoading, error } = useQuery<QuotationRequest[], Error>({
    queryKey: ['allCompletedRequestsForAdmin'],
    queryFn: fetchAllCompletedRequests,
  });

  // Filtrar por quotedAmount > 0 aquí en el cliente
  const validCompletedRequests = allCompletedRequests?.filter(req => req.quotedAmount && req.quotedAmount > 0) || [];
  
  const totalPlatformRevenue = validCompletedRequests.reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0);
  const totalQuotedAmount = validCompletedRequests.reduce((sum, req) => sum + (req.quotedAmount || 0), 0);
  const totalHandymanPayout = validCompletedRequests.reduce((sum, req) => sum + (req.handymanEarnings || 0), 0);

  const commissionsByHandyman = validCompletedRequests.reduce((acc, req) => {
    if (req.handymanId && req.handymanName && req.platformFeeCalculated) {
      if (!acc[req.handymanId]) {
        acc[req.handymanId] = { name: req.handymanName, totalCommission: 0, requestCount: 0 };
      }
      acc[req.handymanId].totalCommission += req.platformFeeCalculated;
      acc[req.handymanId].requestCount += 1;
    }
    return acc;
  }, {} as CommissionsByHandyman);
  
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
            <CardHeader><CardTitle>Comisiones Generadas por Operario</CardTitle></CardHeader>
            <CardContent>
            {Object.keys(commissionsByHandyman).length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Operario</TableHead>
                            <TableHead className="text-right">Servicios Completados</TableHead>
                            <TableHead className="text-right">Comisión Total para Plataforma</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(commissionsByHandyman)
                            .sort(([, a], [, b]) => b.totalCommission - a.totalCommission) // Sort by highest commission
                            .map(([id, data]) => (
                            <TableRow key={id}>
                                <TableCell className="font-medium">{data.name} <span className="text-xs text-muted-foreground">({id.substring(0,6)}...)</span></TableCell>
                                <TableCell className="text-right">{data.requestCount}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">${data.totalCommission.toLocaleString('es-CO')}</TableCell>
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
                  <TableHead className="text-right">Comisión ({ (validCompletedRequests[0]?.platformCommissionRate || 0) * 100 }%)</TableHead>
                  <TableHead className="text-right">Ganancia Operario</TableHead>
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
                    <TableCell className="text-right text-red-600">${(req.platformFeeCalculated || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="text-right text-green-700">${(req.handymanEarnings || 0).toLocaleString('es-CO')}</TableCell>
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
                Los cálculos se basan en una tasa de comisión fija del { (validCompletedRequests.length > 0 && validCompletedRequests[0]?.platformCommissionRate ? validCompletedRequests[0]?.platformCommissionRate : 0) * 100 }% sobre el monto cotizado.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    

    

