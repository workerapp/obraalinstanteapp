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
import { services as availableServices } from '@/data/services';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  contactFullName: z.string().min(2, "El nombre completo es requerido."),
  contactEmail: z.string().email("Dirección de correo inválida."),
  contactPhone: z.string().min(7, "Se requiere un número de teléfono válido.").optional().or(z.literal('')),
  address: z.string().min(5, "La dirección es requerida."),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  problemDescription: z.string().min(20, "Por favor, describe tu problema en al menos 20 caracteres.").max(1000),
  preferredDate: z.string().optional(),
  handymanId: z.string().optional(),
  handymanName: z.string().optional(),
}).refine(data => {
    return data.serviceId || data.problemDescription;
}, {
    message: "Debes seleccionar un servicio o proporcionar una descripción del problema.",
    path: ["serviceId"],
});

type FormData = z.infer<typeof formSchema>;

export default function RequestQuotationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const searchParams = useSearchParams();

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
    const { reset, getValues } = form;
    const currentFormValues = getValues();

    let newProblemDescription = problemFromQuery
        ? decodeURIComponent(problemFromQuery)
        : currentFormValues.problemDescription || "";

    if (serviceIdFromQuery && problemFromQuery) {
        newProblemDescription = decodeURIComponent(problemFromQuery);
    } else if (serviceIdFromQuery && !problemFromQuery) {
        newProblemDescription = currentFormValues.problemDescription || "";
    }

    const resetValues: Partial<FormData> = {
      contactFullName: typedUser?.displayName || currentFormValues.contactFullName || "",
      contactEmail: typedUser?.email || currentFormValues.contactEmail || "",
      contactPhone: currentFormValues.contactPhone || "",
      address: currentFormValues.address || "",
      serviceId: serviceIdFromQuery || currentFormValues.serviceId || "",
      serviceName: serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (currentFormValues.serviceName || ""),
      problemDescription: newProblemDescription,
      handymanId: handymanIdFromQuery || currentFormValues.handymanId || "",
      handymanName: handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (currentFormValues.handymanName || ""),
    };

    reset(resetValues);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
      typedUser,
      serviceIdFromQuery,
      serviceNameFromQuery,
      handymanIdFromQuery,
      handymanNameFromQuery,
      problemFromQuery,
      form.reset
    ]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);

    if (!typedUser?.uid) {
      toast({ title: "Usuario no Autenticado", description: "Debes iniciar sesión para enviar una solicitud.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    let finalServiceName = data.serviceName;
    let finalServiceId = data.serviceId;

    const queryServiceName = serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : null;

    if (serviceIdFromQuery && queryServiceName) {
      finalServiceId = serviceIdFromQuery;
      finalServiceName = queryServiceName;
    } else if (data.serviceId && availableServices.find(s => s.id === data.serviceId)) {
      finalServiceId = data.serviceId;
      finalServiceName = availableServices.find(s => s.id === data.serviceId)?.name || 'Servicio no especificado';
    } else if (data.problemDescription && !data.serviceId) {
      finalServiceName = 'Consulta General (Problema Detallado)';
      finalServiceId = 'general-consultation';
    } else {
      toast({ title: "Error de Servicio", description: "Debes seleccionar un servicio del listado o si es una consulta general, asegúrate que la descripción del problema esté completa.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const queryHandymanName = handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : null;

    const quotationData = {
      userId: typedUser.uid,
      userFullName: typedUser.displayName || null,
      userEmail: typedUser.email || null,
      contactFullName: data.contactFullName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      address: data.address,
      serviceId: finalServiceId,
      serviceName: finalServiceName,
      problemDescription: data.problemDescription,
      preferredDate: data.preferredDate || null,
      handymanId: handymanIdFromQuery || data.handymanId || null,
      handymanName: queryHandymanName || (data.handymanName ? decodeURIComponent(data.handymanName) : null),
      status: "Enviada" as const,
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(firestore, "quotationRequests"), quotationData);
      console.log("Solicitud de cotización guardada con ID: ", docRef.id);
      let descriptionToast = `Servicio: ${quotationData.serviceName}.`;
      if (quotationData.handymanName) descriptionToast += ` Solicitud para ${quotationData.handymanName}.`;
      descriptionToast += " Hemos recibido tu solicitud y nos pondremos en contacto pronto.";
      toast({
        title: "¡Solicitud Enviada!",
        description: descriptionToast,
        action: typedUser ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/customer">Ver Mis Solicitudes</Link>
          </Button>
        ) : undefined,
      });
      form.reset({
        contactFullName: typedUser?.displayName || "",
        contactEmail: typedUser?.email || "",
        contactPhone: "", address: "",
        problemDescription: "",
        preferredDate: "",
        serviceId: "",
        serviceName: "",
        handymanId: "",
        handymanName: "",
      });
    } catch (e) {
      console.error("Error al añadir documento: ", e);
      toast({ title: "Error al Enviar Solicitud", description: "Hubo un problema al guardar tu solicitud.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const displayServiceName = serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (form.watch("serviceName") || null);
  const displayHandymanName = handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (form.watch("handymanName") || null);


  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            Completa el formulario para obtener una cotización.
            {displayHandymanName && ` Estás solicitando una cotización específicamente a ${displayHandymanName}.`}
            {problemFromQuery && !serviceIdFromQuery && " La descripción de tu problema ha sido pre-llenada por nuestro Asistente IA."}
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
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección del Servicio</FormLabel> <FormControl><Input placeholder="Calle 123, Ciudad, Provincia" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>

              {serviceIdFromQuery ? (
                <FormItem> <FormLabel>Servicio Requerido</FormLabel> <div className="flex items-center gap-2 p-3 rounded-md border bg-muted"> <Package className="h-5 w-5 text-muted-foreground" /> <span className="text-sm text-foreground">{displayServiceName || 'Servicio Específico'}</span> </div> <FormDescription> {displayHandymanName ? `Solicitando cotización para ${displayServiceName} de ${displayHandymanName}.` : `Solicitando cotización para ${displayServiceName}.`} </FormDescription> </FormItem>
              ) : problemFromQuery && !serviceIdFromQuery ? (
                 <FormItem> <FormLabel>Servicio Requerido</FormLabel> <div className="flex items-center gap-2 p-3 rounded-md border bg-muted"> <FileText className="h-5 w-5 text-muted-foreground" /> <span className="text-sm text-foreground">Consulta General (basada en tu descripción)</span> </div> <FormDescription>Tu problema descrito a la IA se usará como base para la cotización.</FormDescription> </FormItem>
              ) : (
                  <FormField control={form.control} name="serviceId" render={({ field }) => ( <FormItem> <FormLabel>Servicio Requerido</FormLabel> <Select onValueChange={(value) => { field.onChange(value); const selectedService = availableServices.find(s => s.id === value); form.setValue('serviceName', selectedService?.name || ''); }} value={field.value || ""} > <FormControl> <SelectTrigger> <SelectValue placeholder="Selecciona un servicio" /> </SelectTrigger> </FormControl> <SelectContent> {availableServices.map(service => ( <SelectItem key={service.id} value={service.id}> {service.name} </SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
              )}

              <FormField control={form.control} name="problemDescription" render={({ field }) => ( <FormItem> <FormLabel>Descripción del Problema</FormLabel> <FormControl> <Textarea placeholder="Describe el problema en detalle..." rows={5} className="resize-none" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>

              <FormField control={form.control} name="preferredDate" render={({ field }) => ( <FormItem> <FormLabel>Fecha Preferida (Opcional)</FormLabel> <FormControl><Input type="date" {...field} min={new Date().toISOString().split("T")[0]}/></FormControl> <FormDescription>Indícanos si tienes una fecha preferida para el servicio.</FormDescription> <FormMessage /> </FormItem> )}/>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando Solicitud...</> ) : ( <><Send className="mr-2 h-4 w-4" /> Enviar Solicitud</> )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
