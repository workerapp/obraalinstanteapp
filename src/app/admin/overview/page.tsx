
// src/app/admin/overview/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    DollarSign, Users, ListChecks, Loader2, AlertTriangle, ArrowLeft, 
    CheckCircle, XCircle, CreditCard, UserCog, UserCheck2, UserX2, Briefcase, Eye, Activity, Package, Layers, Award
} from 'lucide-react';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QuotationRequest } from '@/types/quotationRequest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

const fetchAllCompletedRequests = async (): Promise<QuotationRequest[]> => {
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(requestsRef, where("status", "==", "Completada"));
  
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

  requests.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
  return requests;
};

const fetchActiveRequests = async (): Promise<QuotationRequest[]> => {
  const requestsRef = collection(firestore, "quotationRequests");
  const q = query(requestsRef, where("status", "in", ["Enviada", "Revisando", "Cotizada", "Aceptada", "En Progreso", "Finalizada por Profesional"]));
  
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

  requests.sort((a, b) => (b.requestedAt?.toMillis() || 0) - (a.requestedAt?.toMillis() || 0));
  return requests;
};


interface UserAdminView {
  uid: string;
  displayName: string;
  email: string;
  isApproved: boolean;
  createdAt: Timestamp;
  phone?: string;
  subscriptionStatus?: 'free' | 'premium';
}

const fetchAllProfessionals = async (): Promise<UserAdminView[]> => {
  const usersRef = collection(firestore, "users");
  const q = query(usersRef, where("role", "==", "handyman"));
  
  const querySnapshot = await getDocs(q);
  const professionals: UserAdminView[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    professionals.push({ 
      uid: doc.id,
      displayName: data.displayName || 'Sin Nombre',
      email: data.email || 'Sin Email',
      isApproved: data.isApproved || false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      phone: data.phone || 'No registrado',
    });
  });

  professionals.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return professionals;
};

const fetchAllSuppliers = async (): Promise<UserAdminView[]> => {
  const usersRef = collection(firestore, "users");
  const q = query(usersRef, where("role", "==", "supplier"));
  
  const querySnapshot = await getDocs(q);
  const suppliers: UserAdminView[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    suppliers.push({ 
      uid: doc.id,
      displayName: data.displayName || 'Sin Nombre',
      email: data.email || 'Sin Email',
      isApproved: data.isApproved || false,
      subscriptionStatus: data.subscriptionStatus || 'free',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      phone: data.phone || 'No registrado',
    });
  });

  suppliers.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return suppliers;
};


interface CommissionsByUser {
  [userId: string]: {
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
  const [isUpdatingApprovalId, setIsUpdatingApprovalId] = useState<string | null>(null);
  const [isUpdatingSupplierApprovalId, setIsUpdatingSupplierApprovalId] = useState<string | null>(null);
  const [isUpdatingSubscriptionId, setIsUpdatingSubscriptionId] = useState<string | null>(null);


  useEffect(() => { setIsClient(true); }, []);

  const { data: allCompletedRequests, isLoading: requestsLoading, error: requestsError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['allCompletedRequestsForAdmin'],
    queryFn: fetchAllCompletedRequests,
  });

  const { data: allActiveRequests, isLoading: activeRequestsLoading, error: activeRequestsError } = useQuery<QuotationRequest[], Error>({
    queryKey: ['allActiveRequestsForAdmin'],
    queryFn: fetchActiveRequests,
  });

  const { data: allProfessionals, isLoading: professionalsLoading, error: professionalsError } = useQuery<UserAdminView[], Error>({
    queryKey: ['allProfessionalsForAdmin'],
    queryFn: fetchAllProfessionals,
  });

  const { data: allSuppliers, isLoading: suppliersLoading, error: suppliersError } = useQuery<UserAdminView[], Error>({
    queryKey: ['allSuppliersForAdmin'],
    queryFn: fetchAllSuppliers,
  });
  
  const validCompletedRequests = allCompletedRequests?.filter(req => req.platformFeeCalculated && req.platformFeeCalculated > 0) || [];
  
  const totalPlatformRevenue = validCompletedRequests.reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0);
  const totalPaidCommissions = validCompletedRequests.filter(req => req.commissionPaymentStatus === "Pagada").reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0);
  const totalPendingCommissions = validCompletedRequests.filter(req => req.commissionPaymentStatus === "Pendiente").reduce((sum, req) => sum + (req.platformFeeCalculated || 0), 0);

  const commissionsByUser = validCompletedRequests.reduce((acc, req) => {
    if (req.professionalId && req.professionalName && req.platformFeeCalculated && req.platformFeeCalculated > 0) {
      if (!acc[req.professionalId]) {
        acc[req.professionalId] = { name: req.professionalName, totalPlatformFee: 0, totalPendingPlatformFee: 0, totalPaidPlatformFee: 0, requestCount: 0 };
      }
      acc[req.professionalId].totalPlatformFee += req.platformFeeCalculated;
      acc[req.professionalId].requestCount += 1;
      if (req.commissionPaymentStatus === "Pendiente") { acc[req.professionalId].totalPendingPlatformFee += req.platformFeeCalculated; } 
      else if (req.commissionPaymentStatus === "Pagada") { acc[req.professionalId].totalPaidPlatformFee += req.platformFeeCalculated; }
    }
    return acc;
  }, {} as CommissionsByUser);

  
  const handleToggleCommissionStatus = async (requestId: string, currentStatus?: "Pendiente" | "Pagada") => {
    setIsUpdatingCommissionStatusId(requestId);
    const newStatus = currentStatus === "Pagada" ? "Pendiente" : "Pagada";
    try {
      await updateDoc(doc(firestore, "quotationRequests", requestId), { commissionPaymentStatus: newStatus, updatedAt: serverTimestamp() });
      toast({ title: "Estado de Comisión Actualizado", description: `La comisión para la solicitud ahora está ${newStatus}.` });
      queryClient.invalidateQueries({ queryKey: ['allCompletedRequestsForAdmin'] });
    } catch (e: any) {
      console.error("Error al actualizar estado de comisión:", e);
      toast({ title: "Error", description: `No se pudo actualizar: ${e.message}`, variant: "destructive" });
    } finally {
      setIsUpdatingCommissionStatusId(null);
    }
  };

  const handleToggleApprovalStatus = async (uid: string, currentStatus: boolean, userType: 'profesional' | 'proveedor') => {
    const aId = userType === 'profesional' ? setIsUpdatingApprovalId : setIsUpdatingSupplierApprovalId;
    const queryKey = userType === 'profesional' ? ['allProfessionalsForAdmin'] : ['allSuppliersForAdmin'];
    const typeName = userType === 'profesional' ? 'Profesional' : 'Proveedor';
    
    aId(uid);
    const newStatus = !currentStatus;
    try {
      await updateDoc(doc(firestore, "users", uid), { isApproved: newStatus, updatedAt: serverTimestamp() });
      toast({ title: `Estado del ${typeName} Actualizado`, description: `El ${typeName} ha sido ${newStatus ? 'Aprobado' : 'Desactivado'}.` });
      queryClient.invalidateQueries({ queryKey: queryKey });
    } catch (e: any) {
      console.error(`Error al actualizar estado de aprobación del ${typeName}:`, e);
      toast({ title: "Error", description: `No se pudo actualizar: ${e.message}`, variant: "destructive" });
    } finally {
      aId(null);
    }
  };
  
  const handleToggleSubscriptionStatus = async (uid: string, currentStatus: 'free' | 'premium') => {
    setIsUpdatingSubscriptionId(uid);
    const newStatus = currentStatus === 'premium' ? 'free' : 'premium';
    try {
        await updateDoc(doc(firestore, "users", uid), { subscriptionStatus: newStatus, updatedAt: serverTimestamp() });
        toast({ title: "Suscripción Actualizada", description: `El proveedor ahora está en el plan ${newStatus === 'premium' ? 'Premium' : 'Gratuito'}.` });
        queryClient.invalidateQueries({ queryKey: ['allSuppliersForAdmin'] });
    } catch (e: any) {
        console.error("Error al actualizar estado de suscripción:", e);
        toast({ title: "Error", description: `No se pudo actualizar: ${e.message}`, variant: "destructive" });
    } finally {
        setIsUpdatingSubscriptionId(null);
    }
  };
  
  const getStatusColorClass = (status: QuotationRequest['status']): string => {
    switch (status) {
      case 'Completada': return 'bg-green-600 text-white';
      case 'Finalizada por Profesional': return 'bg-emerald-500 text-white';
      case 'En Progreso': return 'bg-sky-500 text-white';
      case 'Aceptada': return 'bg-blue-500 text-white';
      case 'Enviada': return 'bg-yellow-500 text-black';
      case 'Revisando': return 'bg-orange-500 text-white';
      case 'Cotizada': return 'bg-purple-500 text-white';
      case 'Cancelada': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
   }
 };

  if (!isClient || requestsLoading || professionalsLoading || activeRequestsLoading || suppliersLoading) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Cargando datos del administrador...</p>
        </div>
    );
  }

  if (requestsError || professionalsError || activeRequestsError || suppliersError) {
    const error = requestsError || professionalsError || activeRequestsError || suppliersError;
    return (
      <div className="max-w-4xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información del panel.
            {error?.message.toLowerCase().includes('index') || error?.message.toLowerCase().includes('failed-precondition') 
              ? " Firestore podría necesitar un índice para esta consulta. Revisa la consola para un enlace de creación automática."
              : ` Detalle: ${error?.message}`
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
        <Activity className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-accent mb-2">Panel de Administración</h1>
        <p className="text-lg text-foreground/80 max-w-xl mx-auto">Resumen de actividad, finanzas y gestión de usuarios de la plataforma.</p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Ingresos Totales</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">${totalPlatformRevenue.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Suma de comisiones pagadas y pendientes.</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="text-blue-500"/>Comisiones Pagadas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">${totalPaidCommissions.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Comisiones que los usuarios ya pagaron.</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="text-orange-500"/>Comisiones Pendientes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-orange-600">${totalPendingCommissions.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground">Comisiones por cobrar a los usuarios.</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="text-indigo-500"/>Servicios Gestionados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">{validCompletedRequests.length || 0}</p><p className="text-xs text-muted-foreground">Total de trabajos y ventas completadas.</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="text-purple-500"/>Profesionales Aprobados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">{allProfessionals?.filter(h => h.isApproved).length || 0}</p><p className="text-xs text-muted-foreground">Profesionales de servicios activos.</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-cyan-500"/>Proveedores Aprobados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">{allSuppliers?.filter(s => s.isApproved).length || 0}</p><p className="text-xs text-muted-foreground">Proveedores de productos activos.</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/>Gestión Global de Servicios</CardTitle><CardDescription>Administra el catálogo de servicios que verán los clientes.</CardDescription></CardHeader><CardContent><p>Crea y edita las categorías de servicio que los clientes y profesionales seleccionarán.</p></CardContent><CardFooter><Button asChild className="w-full"><Link href="/admin/services">Gestionar Catálogo de Servicios</Link></Button></CardFooter></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Layers className="text-primary"/>Gestión de Categorías de Productos</CardTitle><CardDescription>Administra el catálogo de categorías de productos.</CardDescription></CardHeader><CardContent><p>Define las categorías que los proveedores usarán para clasificar sus productos.</p></CardContent><CardFooter><Button asChild className="w-full"><Link href="/admin/product-categories">Gestionar Categorías de Productos</Link></Button></CardFooter></Card>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="text-primary"/>Solicitudes Activas</CardTitle><CardDescription>Monitoriza todos los servicios en curso que aún no se han completado.</CardDescription></CardHeader>
        <CardContent>
          {allActiveRequests && allActiveRequests.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Servicio/Producto</TableHead><TableHead>Cliente</TableHead><TableHead>Asignado A</TableHead><TableHead>Estado</TableHead><TableHead>Fecha Solicitud</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
              <TableBody>
                {allActiveRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.serviceName}</TableCell>
                    <TableCell>{req.contactFullName}</TableCell>
                    <TableCell>{req.professionalName || <Badge variant="outline">Sin asignar</Badge>}</TableCell>
                    <TableCell><Badge variant="secondary" className={getStatusColorClass(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell>{req.requestedAt?.toDate ? format(req.requestedAt.toDate(), 'P', { locale: es }) : 'N/A'}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href={`/dashboard/requests/${req.id}`}><Eye className="mr-1.5 h-4 w-4"/>Ver</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (<p className="text-muted-foreground text-center py-6">No hay solicitudes activas en este momento.</p>)}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-xl"><CardHeader><CardTitle>Estado de Comisiones por Usuario</CardTitle><CardDescription>Basado en servicios/productos completados que generan comisión.</CardDescription></CardHeader><CardContent>{Object.keys(commissionsByUser).length > 0 ? (<Table><TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Comisión Total</TableHead><TableHead className="text-right">Com. Pendiente</TableHead><TableHead className="text-right">Com. Pagada</TableHead></TableRow></TableHeader><TableBody>{Object.entries(commissionsByUser).sort(([, a], [, b]) => b.totalPlatformFee - a.totalPlatformFee).map(([id, data]) => (<TableRow key={id}><TableCell className="font-medium">{data.name} <span className="text-xs text-muted-foreground">({id.substring(0,6)}...)</span></TableCell><TableCell className="text-right">{data.requestCount}</TableCell><TableCell className="text-right font-semibold text-gray-700">${data.totalPlatformFee.toLocaleString('es-CO')}</TableCell><TableCell className="text-right font-semibold text-orange-600">${data.totalPendingPlatformFee.toLocaleString('es-CO')}</TableCell><TableCell className="text-right font-semibold text-green-600">${data.totalPaidPlatformFee.toLocaleString('es-CO')}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-center py-4">No hay comisiones registradas todavía.</p>)}</CardContent></Card>
      </div>
      
      <Card className="shadow-xl"><CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="text-primary"/>Gestión de Profesionales</CardTitle><CardDescription>Activa o desactiva profesionales en la plataforma y visualiza su información de contacto.</CardDescription></CardHeader><CardContent>{allProfessionals && allProfessionals.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Profesional</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Fecha de Registro</TableHead><TableHead>Estado</TableHead><TableHead className="text-center">Acción (Activar/Desactivar)</TableHead></TableRow></TableHeader><TableBody>{allProfessionals.map((professional) => (<TableRow key={professional.uid}><TableCell className="font-medium">{professional.displayName}</TableCell><TableCell>{professional.email}</TableCell><TableCell>{professional.phone}</TableCell><TableCell>{professional.createdAt?.toDate ? format(professional.createdAt.toDate(), 'PP', { locale: es }) : 'N/A'}</TableCell><TableCell><Badge variant={professional.isApproved ? "default" : "destructive"} className={professional.isApproved ? "bg-green-600 text-white" : ""}>{professional.isApproved ? <><UserCheck2 className="mr-1.5 h-3 w-3"/>Aprobado</> : <><UserX2 className="mr-1.5 h-3 w-3"/>Pendiente/Inactivo</>}</Badge></TableCell><TableCell className="flex justify-center items-center">{isUpdatingApprovalId === professional.uid ? (<Loader2 className="h-5 w-5 animate-spin" />) : (<Switch checked={professional.isApproved} onCheckedChange={() => handleToggleApprovalStatus(professional.uid, professional.isApproved, 'profesional')} aria-label={`Aprobar a ${professional.displayName}`}/>)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-center py-6">No hay profesionales registrados en la plataforma.</p>)}</CardContent></Card>

      <Card className="shadow-xl"><CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-primary"/>Gestión de Proveedores</CardTitle><CardDescription>Activa o desactiva proveedores y gestiona su nivel de suscripción.</CardDescription></CardHeader><CardContent>{allSuppliers && allSuppliers.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Proveedor</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Fecha de Registro</TableHead><TableHead>Estado</TableHead><TableHead className="text-center">Suscripción</TableHead><TableHead className="text-center">Acción (Activar/Desactivar)</TableHead></TableRow></TableHeader><TableBody>{allSuppliers.map((supplier) => (<TableRow key={supplier.uid}><TableCell className="font-medium">{supplier.displayName}</TableCell><TableCell>{supplier.email}</TableCell><TableCell>{supplier.phone}</TableCell><TableCell>{supplier.createdAt?.toDate ? format(supplier.createdAt.toDate(), 'PP', { locale: es }) : 'N/A'}</TableCell><TableCell><Badge variant={supplier.isApproved ? "default" : "destructive"} className={supplier.isApproved ? "bg-green-600 text-white" : ""}>{supplier.isApproved ? <><UserCheck2 className="mr-1.5 h-3 w-3"/>Aprobado</> : <><UserX2 className="mr-1.5 h-3 w-3"/>Pendiente/Inactivo</>}</Badge></TableCell><TableCell className="text-center">{isUpdatingSubscriptionId === supplier.uid ? (<Loader2 className="h-5 w-5 animate-spin mx-auto" />) : (<div className="flex flex-col items-center gap-1"><Switch id={`sub-${supplier.uid}`} checked={supplier.subscriptionStatus === 'premium'} onCheckedChange={() => handleToggleSubscriptionStatus(supplier.uid, supplier.subscriptionStatus || 'free')} aria-label={`Cambiar suscripción para ${supplier.displayName}`} /><label htmlFor={`sub-${supplier.uid}`} className="text-xs text-muted-foreground flex items-center gap-1">{supplier.subscriptionStatus === 'premium' ? <><Award className="h-3 w-3 text-yellow-500" />Premium</> : 'Gratuito'}</label></div>)}</TableCell><TableCell className="flex justify-center items-center">{isUpdatingSupplierApprovalId === supplier.uid ? (<Loader2 className="h-5 w-5 animate-spin" />) : (<Switch checked={supplier.isApproved} onCheckedChange={() => handleToggleApprovalStatus(supplier.uid, supplier.isApproved, 'proveedor')} aria-label={`Aprobar a ${supplier.displayName}`}/>)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-center py-6">No hay proveedores registrados en la plataforma.</p>)}</CardContent></Card>


      <Card className="shadow-xl"><CardHeader><CardTitle>Detalle de Ventas Completadas y Comisiones</CardTitle><CardDescription>Lista de todos los servicios y ventas de productos completados que generaron comisión (comisión > 0).</CardDescription></CardHeader><CardContent>{validCompletedRequests && validCompletedRequests.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Servicio/Producto</TableHead><TableHead>Usuario</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Monto Cotizado</TableHead><TableHead className="text-right">Tasa Aplicada</TableHead><TableHead className="text-right">Com. Plataforma</TableHead><TableHead className="text-right">G. Usuario</TableHead><TableHead>Estado Comisión</TableHead><TableHead className="text-center">Acción</TableHead><TableHead>Fecha Completado</TableHead></TableRow></TableHeader><TableBody>{validCompletedRequests.map((req) => (<TableRow key={req.id}><TableCell className="font-medium"><Button variant="link" asChild className="p-0 h-auto font-medium"><Link href={`/dashboard/requests/${req.id}`}>{req.serviceName}</Link></Button></TableCell><TableCell>{req.professionalName || 'N/A'}</TableCell><TableCell>{req.contactFullName}</TableCell><TableCell className="text-right">${(req.quotedAmount || 0).toLocaleString('es-CO')}</TableCell><TableCell className="text-right">{((req.platformCommissionRate || 0) * 100).toFixed(0)}%</TableCell><TableCell className="text-right text-red-600">${(req.platformFeeCalculated || 0).toLocaleString('es-CO')}</TableCell><TableCell className="text-right text-green-700">${(req.handymanEarnings || 0).toLocaleString('es-CO')}</TableCell><TableCell><Badge variant={req.commissionPaymentStatus === "Pagada" ? "default" : (req.commissionPaymentStatus === "Pendiente" ? "secondary" : "outline")} className={req.commissionPaymentStatus === "Pagada" ? "bg-green-600 text-white" : (req.commissionPaymentStatus === "Pendiente" ? "bg-orange-500 text-white" : "border-gray-400 text-gray-600")}>{req.commissionPaymentStatus || 'N/A'}</Badge></TableCell><TableCell className="text-center">{req.platformFeeCalculated && req.platformFeeCalculated > 0 && (<Button variant="outline" size="sm" onClick={() => handleToggleCommissionStatus(req.id, req.commissionPaymentStatus)} disabled={isUpdatingCommissionStatusId === req.id} className="w-full max-w-[160px]">{isUpdatingCommissionStatusId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : req.commissionPaymentStatus === "Pagada" ? <XCircle className="mr-1.5 h-4 w-4"/> : <CheckCircle className="mr-1.5 h-4 w-4"/>}{req.commissionPaymentStatus === "Pagada" ? "Marcar Pendiente" : "Marcar Pagada"}</Button>)}</TableCell><TableCell>{req.updatedAt?.toDate ? format(req.updatedAt.toDate(), 'PP', { locale: es }) : 'N/A'}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-center py-6">No hay servicios completados que hayan generado comisión todavía.</p>)}</CardContent><CardFooter><p className="text-xs text-muted-foreground">Cálculos basados en tasa vigente y monto cotizado al momento de completar el servicio. El estado de pago de la comisión se actualiza manualmente.</p></CardFooter></Card>
    </div>
  );
}
