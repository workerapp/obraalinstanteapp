
// src/app/dashboard/customer/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, MessageSquarePlus, History, UserCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { QuotationRequest } from '@/types/quotationRequest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const fetchQuotationRequests = async (userId: string | undefined): Promise<QuotationRequest[]> => {
  if (!userId) return [];
  
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(requestsRef, where("userId", "==", userId), orderBy("requestedAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const requests: QuotationRequest[] = [];
  querySnapshot.forEach((doc) => {
    requests.push({ id: doc.id, ...doc.data() } as QuotationRequest);
  });
  return requests;
};

export default function CustomerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;

  const { data: quotationRequests, isLoading: requestsLoading, error: requestsError } = useQuery<QuotationRequest[], Error>(
    ['quotationRequests', typedUser?.uid],
    () => fetchQuotationRequests(typedUser?.uid),
    {
      enabled: !!typedUser?.uid, // Solo ejecutar la query si tenemos un userId
    }
  );

  const getStatusVariant = (status: QuotationRequest['status']): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'Completada':
        return 'default'; // Verde o color primario sólido
      case 'Programada':
        return 'secondary'; // Un color secundario
      case 'Enviada':
      case 'Revisando':
      case 'Cotizada':
        return 'outline'; // Con borde, menos prominente
      case 'Cancelada':
        return 'destructive'; // Rojo
      default:
        return 'outline';
    }
  };

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


  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!typedUser) {
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

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Mis Solicitudes de Servicio</CardTitle>
          <CardDescription>Resumen de tus solicitudes de servicio activas y pasadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {requestsError && (
            <Alert variant="destructive">
              <AlertTitle>Error al Cargar Solicitudes</AlertTitle>
              <AlertDescription>
                No pudimos cargar tus solicitudes en este momento. Por favor, intenta de nuevo más tarde.
                <br />
                <small>{requestsError.message}</small>
              </AlertDescription>
            </Alert>
          )}
          {!requestsLoading && !requestsError && quotationRequests && quotationRequests.length > 0 ? quotationRequests.map((req, index) => (
            <div key={req.id}>
              <div className="p-4 border rounded-md hover:shadow-md transition-shadow bg-background">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="font-semibold">{req.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Solicitado: {req.requestedAt ? format(req.requestedAt.toDate(), 'PPPp', { locale: es }) : 'Fecha no disponible'}
                      {req.handymanName && ` | Operario Solicitado: ${req.handymanName}`}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-md" title={req.problemDescription}>Problema: {req.problemDescription}</p>
                  </div>
                  <Badge 
                    // variant={getStatusVariant(req.status)}
                    className={`mt-2 sm:mt-0 self-start sm:self-center ${getStatusColorClass(req.status)}`}
                  >
                    {req.status}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => console.log('Ver detalles de la solicitud:', req.id)} disabled>Ver Detalles (Próximamente)</Button>
                    {(req.status === 'Enviada' || req.status === 'Cotizada') && 
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => console.log('Cancelar solicitud:', req.id)} disabled>Cancelar Solicitud (Próximamente)</Button>
                    }
                </div>
              </div>
              {index < quotationRequests.length - 1 && <Separator className="my-4" />}
            </div>
          )) : (
            !requestsLoading && !requestsError && <p className="text-muted-foreground text-center py-4">Aún no tienes solicitudes de servicio.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => console.log('Ver historial completo clickeado')} disabled>
                <History className="mr-2 h-4 w-4"/> Ver Historial Completo (Próximamente)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
