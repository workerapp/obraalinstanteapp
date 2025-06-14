
// src/app/request-quotation/page.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, FileText, Package } from 'lucide-react'; // Added Package icon
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
  serviceId: z.string({ required_error: "Por favor, selecciona un servicio o asegúrate que venga preseleccionado." }),
  serviceName: z.string().optional(), // Added serviceName to schema for pre-filled cases
  problemDescription: z.string().min(20, "Por favor, describe tu problema en al menos 20 caracteres.").max(1000),
  preferredDate: z.string().optional(),
  handymanId: z.string().optional(),
  handymanName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RequestQuotationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const searchParams = useSearchParams();
  const serviceIdFromQuery = searchParams.get('serviceId');
  const serviceNameFromQuery = searchParams.get('serviceName'); // Get serviceName
  const handymanIdFromQuery = searchParams.get('handymanId');
  const handymanNameFromQuery = searchParams.get('handymanName');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactFullName: typedUser?.displayName || "",
      contactEmail: typedUser?.email || "",
      contactPhone: "",
      address: "",
      serviceId: serviceIdFromQuery || "",
      serviceName: serviceNameFromQuery || "", // Initialize serviceName
      problemDescription: "",
      preferredDate: "",
      handymanId: handymanIdFromQuery || "",
      handymanName: handymanNameFromQuery || "",
    },
  });

  useEffect(() => {
    // Pre-fill form if user is logged in or query params change
    const currentValues = form.getValues();
    form.reset({
      ...currentValues, // Preserve existing form data if any
      contactFullName: typedUser?.displayName || currentValues.contactFullName || "",
      contactEmail: typedUser?.email || currentValues.contactEmail || "",
      serviceId: serviceIdFromQuery || currentValues.serviceId || "",
      serviceName: serviceNameFromQuery || currentValues.serviceName || "", // Update serviceName
      handymanId: handymanIdFromQuery || currentValues.handymanId || "",
      handymanName: handymanNameFromQuery || currentValues.handymanName || "",
    });
  }, [typedUser, serviceIdFromQuery, serviceNameFromQuery, handymanIdFromQuery, handymanNameFromQuery, form]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    
    let finalServiceName = data.serviceName; // Use pre-filled service name if available
    let finalServiceId = data.serviceId;

    if (serviceIdFromQuery && serviceNameFromQuery) {
      finalServiceId = serviceIdFromQuery;
      finalServiceName = serviceNameFromQuery;
    } else if (data.serviceId) { // If not pre-filled, find from availableServices
      const selectedService = availableServices.find(s => s.id === data.serviceId);
      finalServiceName = selectedService?.name || 'N/A';
      finalServiceId = selectedService?.id || data.serviceId; // Ensure finalServiceId is from selectedService if possible
    }


    const quotationData = {
      userId: typedUser?.uid || null,
      userFullName: typedUser?.displayName || null,
      userEmail: typedUser?.email || null,
      contactFullName: data.contactFullName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      address: data.address,
      serviceId: finalServiceId,
      serviceName: finalServiceName,
      problemDescription: data.problemDescription,
      preferredDate: data.preferredDate || null,
      handymanId: data.handymanId || null,
      handymanName: data.handymanName || null,
      status: "Enviada" as const,
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(firestore, "quotationRequests"), quotationData);
      console.log("Solicitud de cotización guardada con ID: ", docRef.id);

      let description = `Servicio: ${quotationData.serviceName}.`;
      if (data.handymanName) {
        description += ` Solicitud para ${data.handymanName}.`;
      }
      description += " Hemos recibido tu solicitud y nos pondremos en contacto pronto.";

      toast({
        title: "Solicitud de Cotización Enviada",
        description: description,
        action: typedUser ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/customer">Ver Mis Solicitudes</Link>
          </Button>
        ) : undefined,
      });

      form.reset({ 
        contactFullName: typedUser?.displayName || "",
        contactEmail: typedUser?.email || "",
        contactPhone: "",
        address: "",
        problemDescription: "",
        preferredDate: "",
        // Preserve query params for next potential submission if user stays on page
        serviceId: serviceIdFromQuery || "", 
        serviceName: serviceNameFromQuery || "",
        handymanId: handymanIdFromQuery || "",
        handymanName: handymanNameFromQuery || "",
      });

    } catch (e) {
      console.error("Error al añadir documento: ", e);
      toast({
        title: "Error al Enviar Solicitud",
        description: "Hubo un problema al guardar tu solicitud. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            Completa el formulario a continuación para obtener una cotización para el servicio que necesitas.
            {handymanNameFromQuery && ` Estás solicitando una cotización específicamente a ${decodeURIComponent(handymanNameFromQuery)}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactFullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono (Opcional)</FormLabel>
                      <FormControl><Input type="tel" placeholder="Tu número de teléfono" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección del Servicio</FormLabel>
                    <FormControl><Input placeholder="Calle 123, Ciudad, Provincia" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional rendering for service selection */}
              {serviceIdFromQuery && serviceNameFromQuery ? (
                <FormItem>
                  <FormLabel>Servicio Requerido</FormLabel>
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{decodeURIComponent(serviceNameFromQuery)}</span>
                  </div>
                  <FormDescription>
                    Solicitando cotización para el servicio específico de {handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : 'un operario'}.
                  </FormDescription>
                  {/* Hidden fields to carry these values if needed by the form structure, though serviceId is already in form state */}
                  <FormField control={form.control} name="serviceId" render={({ field }) => <Input type="hidden" {...field} />} />
                  <FormField control={form.control} name="serviceName" render={({ field }) => <Input type="hidden" {...field} />} />
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servicio Requerido</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedService = availableServices.find(s => s.id === value);
                          form.setValue('serviceName', selectedService?.name || '');
                        }} 
                        value={field.value || ""} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableServices.map(service => (
                            <SelectItem key={service.id} value={service.id}>
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
                    <FormLabel>Descripción del Problema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el problema en detalle..."
                        rows={5}
                        className="resize-none"
                        {...field}
                      />
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
                    <FormControl><Input type="date" {...field} min={new Date().toISOString().split("T")[0]} /></FormControl>
                    <FormDescription>Indícanos si tienes una fecha preferida para el servicio.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="handymanId" render={({ field }) => <FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>} />
              <FormField control={form.control} name="handymanName" render={({ field }) => <FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>} />
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando Solicitud...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Enviar Solicitud</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
