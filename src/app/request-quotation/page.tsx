
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
import { Loader2, Send, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { services as availableServices } from '@/data/services';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  fullName: z.string().min(2, "El nombre completo es requerido."),
  email: z.string().email("Dirección de correo inválida."),
  phone: z.string().min(10, "Se requiere un número de teléfono válido.").optional().or(z.literal('')),
  address: z.string().min(5, "La dirección es requerida."),
  serviceId: z.string({ required_error: "Por favor, selecciona un servicio." }),
  problemDescription: z.string().min(20, "Por favor, describe tu problema en al menos 20 caracteres.").max(1000),
  preferredDate: z.string().optional(),
  handymanId: z.string().optional(), // To store handyman ID if coming from their profile
  handymanName: z.string().optional(), // To store handyman name for the toast
});

type FormData = z.infer<typeof formSchema>;

export default function RequestQuotationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const serviceIdFromQuery = searchParams.get('serviceId');
  const handymanIdFromQuery = searchParams.get('handymanId');
  const handymanNameFromQuery = searchParams.get('handymanName');


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      serviceId: serviceIdFromQuery || "",
      problemDescription: "",
      preferredDate: "",
      handymanId: handymanIdFromQuery || "",
      handymanName: handymanNameFromQuery || "",
    },
  });

  useEffect(() => {
    // Update default values if query params change after initial load
    form.reset({
      ...form.getValues(), // keep existing values
      serviceId: serviceIdFromQuery || form.getValues("serviceId") || "",
      handymanId: handymanIdFromQuery || form.getValues("handymanId") || "",
      handymanName: handymanNameFromQuery || form.getValues("handymanName") || "",
    });
  }, [serviceIdFromQuery, handymanIdFromQuery, handymanNameFromQuery, form]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Datos de Solicitud de Cotización:", data);

    let description = `Servicio: ${availableServices.find(s => s.id === data.serviceId)?.name || 'N/A'}.`;
    if (data.handymanName) {
      description += ` Solicitud para ${data.handymanName}.`;
    }
    description += " Un administrador se pondrá en contacto pronto (revisa la consola para ver los datos).";


    toast({
      title: "Solicitud de Cotización Enviada (Demo)",
      description: description,
      action: (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/customer">Ver Panel</Link>
        </Button>
      ),
    });
    setIsLoading(false);
    form.reset({ 
      fullName: "",
      email: "",
      phone: "",
      address: "",
      problemDescription: "",
      preferredDate: "",
      serviceId: serviceIdFromQuery || "", // Keep serviceId if it came from query
      handymanId: handymanIdFromQuery || "", // Keep handymanId if it came from query
      handymanName: handymanNameFromQuery || "", // Keep handymanName if it came from query
    }); 
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            Completa el formulario a continuación para obtener una cotización para el servicio que necesitas.
            {handymanNameFromQuery && ` Estás solicitando una cotización específicamente a ${handymanNameFromQuery}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
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
                  name="phone"
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
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio Requerido</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value}>
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
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormDescription>Indícanos si tienes una fecha preferida para el servicio.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Hidden fields for handymanId and handymanName if they came from query params */}
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

