// src/app/request-quotation/page.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, FileText, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { Service } from '@/types/service';

const formSchema = z.object({
  contactFullName: z.string().min(2, "El nombre completo es requerido."),
  contactEmail: z.string().email("Dirección de correo inválida."),
  contactPhone: z.string().min(7, "Se requiere un número de teléfono válido.").optional().or(z.literal('')),
  address: z.string().min(5, "La dirección es requerida."),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  problemDescription: z.string().min(20, "Por favor, describe tu problema o los productos que necesitas en al menos 20 caracteres.").max(1000),
  preferredDate: z.string().optional(),
  handymanId: z.string().optional(),
  handymanName: z.string().optional(),
}).refine(data => {
    return data.serviceId || data.problemDescription;
}, {
    message: "Debes seleccionar un servicio o proporcionar una descripción del problema/productos.",
    path: ["serviceId"],
});

type FormData = z.infer<typeof formSchema>;

const fetchActiveServices = async (): Promise<Service[]> => {
  const servicesRef = collection(firestore, "platformServices");
  const q = query(servicesRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  const services: Service[] = [];
  querySnapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() } as Service);
  });
  // Sort client-side to avoid needing a composite index
  services.sort((a, b) => a.name.localeCompare(b.name));
  return services;
};

export default function RequestQuotationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const searchParams = useSearchParams();

  const { data: availableServices, isLoading: servicesLoading } = useQuery<Service[], Error>({
    queryKey: ['platformServices'],
    queryFn: fetchActiveServices,
  });

  const serviceIdFromQuery = searchParams.get('serviceId');
  const serviceNameFromQuery = searchParams.get('serviceName');
  const handymanIdFromQuery = searchParams.get('handymanId');
  const handymanNameFromQuery = searchParams.get('handymanName');
  const problemFromQuery = searchParams.get('problem');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactFullName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      serviceId: "",
      serviceName: "",
      problemDescription: "",
      preferredDate: "",
      handymanId: "",
      handymanName: "",
    },
  });

  useEffect(() => {
    const defaultValues: Partial<FormData> = {};
    if (typedUser) {
        defaultValues.contactFullName = typedUser.displayName || '';
        defaultValues.contactEmail = typedUser.email || '';
    }
    if (problemFromQuery) defaultValues.problemDescription = decodeURIComponent(problemFromQuery);
    if (serviceIdFromQuery) defaultValues.serviceId = serviceIdFromQuery;
    if (serviceNameFromQuery) defaultValues.serviceName = decodeURIComponent(serviceNameFromQuery);
    if (handymanIdFromQuery) defaultValues.handymanId = handymanIdFromQuery;
    if (handymanNameFromQuery) defaultValues.handymanName = decodeURIComponent(handymanNameFromQuery);
    
    form.reset(defaultValues);
  }, [typedUser, searchParams, form, problemFromQuery, serviceIdFromQuery, serviceNameFromQuery, handymanIdFromQuery, handymanNameFromQuery]);
  
  const watchedServiceId = form.watch("serviceId");

  useEffect(() => {
    if (watchedServiceId && availableServices) {
      const selectedService = availableServices.find(s => s.id === watchedServiceId);
      if (selectedService) {
        form.setValue('serviceName', selectedService.name, { shouldValidate: true });
      }
    }
  }, [watchedServiceId, availableServices, form]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

    if (!typedUser?.uid) {
      toast({ title: "Usuario no Autenticado", description: "Debes iniciar sesión para enviar una solicitud.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    let finalServiceName = data.serviceName;
    if (data.serviceId && availableServices) {
        finalServiceName = availableServices.find(s => s.id === data.serviceId)?.name || 'Servicio personalizado';
    } else if (data.handymanId) {
        finalServiceName = 'Cotización de Productos';
    } else if (!data.serviceId && data.problemDescription) {
        finalServiceName = 'Consulta General (Problema Detallado)';
    }

    if (!finalServiceName) {
        toast({ title: "Error de Servicio", description: "Por favor, selecciona un servicio o describe tu problema.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const quotationData = {
      userId: typedUser.uid,
      userFullName: typedUser.displayName || null,
      userEmail: typedUser.email || null,
      contactFullName: data.contactFullName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      address: data.address,
      serviceId: data.serviceId || (data.handymanId ? 'product-quotation' : 'general-consultation'),
      serviceName: finalServiceName,
      problemDescription: data.problemDescription,
      preferredDate: data.preferredDate || null,
      imageUrl: null, // Images disabled for now
      handymanId: data.handymanId || null,
      handymanName: data.handymanName || null,
      status: "Enviada" as const,
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, "quotationRequests"), quotationData);
      toast({
        title: "¡Solicitud Enviada!",
        description: "Hemos recibido tu solicitud y nos pondremos en contacto pronto.",
        action: <Button variant="outline" size="sm" asChild><Link href="/dashboard/customer">Ver Mis Solicitudes</Link></Button>,
      });
      form.reset({
        contactFullName: typedUser?.displayName || "",
        contactEmail: typedUser?.email || "",
        contactPhone: "", address: "", problemDescription: "",
        preferredDate: "", serviceId: "", serviceName: "", handymanId: "", handymanName: "",
      });
    } catch (e) {
      console.error("Error al añadir documento: ", e);
      toast({ title: "Error al Enviar Solicitud", description: "Hubo un problema al guardar tu solicitud.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayServiceNameFromState = form.watch("serviceName");
  const displayServiceName = serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (displayServiceNameFromState || null);
  const displayHandymanName = handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (form.watch("handymanName") || null);
  const isSupplierQuote = searchParams.has('handymanId') && !searchParams.has('serviceId');
  const hasSpecificProvider = !!handymanIdFromQuery;


  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            {isSupplierQuote ? `Completa el formulario para solicitar una cotización de productos a ${displayHandymanName}.` 
            : `Completa el formulario para obtener una cotización de servicio.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="contactFullName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="contactEmail" render={({ field }) => ( <FormItem> <FormLabel>Correo Electrónico</FormLabel> <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              <FormField control={form.control} name="contactPhone" render={({ field }) => ( <FormItem> <FormLabel>Número de Teléfono (Opcional)</FormLabel> <FormControl><Input type="tel" placeholder="Tu número de teléfono" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección (para entrega o servicio)</FormLabel> <FormControl><Input placeholder="Calle 123, Ciudad, Provincia" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>

              {hasSpecificProvider ? (
                <FormItem>
                  <FormLabel>Solicitando a</FormLabel>
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{displayHandymanName || 'Destinatario Específico'}</span>
                  </div>
                  <FormDescription>
                    {isSupplierQuote
                      ? `Solicitando cotización de productos a ${displayHandymanName}.`
                      : `Solicitando cotización para "${displayServiceName}" de ${displayHandymanName}.`
                    }
                  </FormDescription>
                </FormItem>
              ) : serviceIdFromQuery ? (
                 <FormItem>
                    <FormLabel>Servicio Seleccionado</FormLabel>
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{displayServiceName || 'Servicio General'}</span>
                    </div>
                    <FormDescription>
                        Tu solicitud será enviada como una consulta pública para el servicio de "{displayServiceName}". Los operarios y proveedores disponibles podrán responder.
                    </FormDescription>
                </FormItem>
              ) : problemFromQuery ? (
                 <FormItem>
                    <FormLabel>Servicio Requerido</FormLabel>
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-foreground">Consulta General (basada en tu descripción)</span>
                    </div>
                    <FormDescription>Tu problema descrito a la IA se usará como base para la cotización.</FormDescription>
                 </FormItem>
              ) : (
                  <FormField 
                    control={form.control} 
                    name="serviceId" 
                    render={({ field }) => ( 
                      <FormItem> 
                        <FormLabel>Servicio Requerido</FormLabel> 
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={servicesLoading}> 
                          <FormControl> 
                            <SelectTrigger> 
                              <SelectValue placeholder={servicesLoading ? "Cargando servicios..." : "Selecciona un servicio"} /> 
                            </SelectTrigger> 
                          </FormControl> 
                          <SelectContent> 
                            {availableServices?.map(service => ( 
                              <SelectItem key={service.id} value={service.id!}> 
                                {service.name} 
                              </SelectItem> 
                            ))} 
                          </SelectContent> 
                        </Select> 
                        <FormMessage /> 
                      </FormItem> 
                    )}
                  />
              )}

              <FormField 
                control={form.control} 
                name="problemDescription" 
                render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>{isSupplierQuote ? 'Productos Requeridos' : 'Descripción del Problema'}</FormLabel> 
                    <FormControl> 
                      <Textarea placeholder={isSupplierQuote ? 'Ej: 10 bultos de cemento, 5 galones de pintura blanca...' : 'Describe el problema en detalle...'} rows={5} className="resize-none" {...field}/> 
                    </FormControl> 
                    <FormMessage /> 
                  </FormItem> 
                )}
              />

              <FormField 
                control={form.control} 
                name="preferredDate" 
                render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>Fecha Preferida (Opcional)</FormLabel> 
                    <FormControl><Input type="date" {...field} min={new Date().toISOString().split("T")[0]}/></FormControl> 
                    <FormDescription>Indícanos si tienes una fecha preferida para el servicio o entrega.</FormDescription> 
                    <FormMessage /> 
                  </FormItem> 
                )}
              />

              <Button type="submit" disabled={isSubmitting || authLoading} className="w-full">
                {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando Solicitud...</> ) : ( <><Send className="mr-2 h-4 w-4" /> Enviar Solicitud</> )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
