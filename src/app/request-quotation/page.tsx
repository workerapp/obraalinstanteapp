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
import { Loader2, Send, FileText, Package, Trash2, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { Service } from '@/types/service';
import { useQuotationCart } from '@/hooks/useQuotationCart';

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
  services.sort((a, b) => a.name.localeCompare(b.name));
  return services;
};

export default function RequestQuotationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    items: cartItems,
    supplierId: cartSupplierId,
    supplierName: cartSupplierName,
    removeItem,
    clearCart,
    getCartCount
  } = useQuotationCart();

  const isCartMode = getCartCount() > 0;
  
  const { data: availableServices, isLoading: servicesLoading } = useQuery<Service[], Error>({
    queryKey: ['platformServices'],
    queryFn: fetchActiveServices,
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactFullName: "", contactEmail: "", contactPhone: "", address: "", serviceId: "",
      serviceName: "", problemDescription: "", preferredDate: "", handymanId: "", handymanName: "",
    },
  });

  // --- START: REFACTORED LOGIC ---

  // Effect 1: Handles the INITIAL population of the form.
  // It uses data from the user session, cart, and URL parameters.
  // It runs once when these dependencies are resolved and does not depend on `availableServices`.
  useEffect(() => {
    const serviceId = searchParams.get('serviceId');
    const serviceName = searchParams.get('serviceName') ? decodeURIComponent(searchParams.get('serviceName')!) : '';
    const handymanId = searchParams.get('handymanId');
    const handymanName = searchParams.get('handymanName') ? decodeURIComponent(searchParams.get('handymanName')!) : '';
    const problem = searchParams.get('problem') ? decodeURIComponent(searchParams.get('problem')!) : '';

    const newValues: Partial<FormData> = {};

    if (typedUser) {
        newValues.contactFullName = typedUser.displayName || '';
        newValues.contactEmail = typedUser.email || '';
    }

    if (isCartMode) {
        newValues.handymanId = cartSupplierId || '';
        newValues.handymanName = cartSupplierName || '';
        newValues.serviceId = 'product-quotation';
        newValues.serviceName = `Cotización de productos de ${cartSupplierName}`;
        newValues.problemDescription = `Solicitud de cotización para los siguientes ${cartItems.length} productos:\n` +
            cartItems.map(item => `- ${item.name} (Unidad: ${item.unit})`).join('\n');
    } else {
        if (serviceId) newValues.serviceId = serviceId;
        if (serviceName) newValues.serviceName = serviceName;
        if (handymanId) newValues.handymanId = handymanId;
        if (handymanName) newValues.handymanName = handymanName;

        if (problem) {
            newValues.problemDescription = problem;
        } else if (serviceName) {
            newValues.problemDescription = 
`Solicito una cotización para el servicio de "${serviceName}".

---
Por favor, describe a continuación los detalles específicos de tu problema o necesidad:
`;
        }
    }
    
    // `reset` will update the form state with the new values.
    form.reset(newValues);

  }, [
    typedUser, 
    searchParams, 
    isCartMode, 
    cartItems, 
    cartSupplierId, 
    cartSupplierName, 
    form
  ]);

  const watchedServiceId = form.watch("serviceId");

  // Effect 2: Handles USER INTERACTION with the service dropdown.
  // This updates the form ONLY if the user selects a new service.
  useEffect(() => {
    if (!watchedServiceId || !availableServices || isCartMode) return;

    const selectedService = availableServices.find(s => s.id === watchedServiceId);
    
    // Only update if the selected service is different from the one already in the form.
    // This prevents this effect from overriding the initial state set by the first effect.
    if (selectedService && selectedService.name !== form.getValues('serviceName')) {
      form.setValue('serviceName', selectedService.name, { shouldValidate: true });
      form.setValue('problemDescription', 
`Solicito una cotización para el servicio de "${selectedService.name}".

---
Por favor, describe a continuación los detalles específicos de tu problema o necesidad:
`);
    }
  }, [watchedServiceId, availableServices, isCartMode, form]);

  // --- END: REFACTORED LOGIC ---

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    if (!typedUser?.uid) {
      toast({ title: "Usuario no Autenticado", description: "Debes iniciar sesión para enviar una solicitud.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const quotationData = {
      userId: typedUser.uid,
      userFullName: typedUser.displayName || null, userEmail: typedUser.email || null,
      contactFullName: data.contactFullName, contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null, address: data.address,
      serviceId: data.serviceId || null,
      serviceName: data.serviceName || null,
      problemDescription: data.problemDescription,
      preferredDate: data.preferredDate || null,
      imageUrl: null, 
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
      });
      if (isCartMode) clearCart();
      router.push('/dashboard/customer');
    } catch (e) {
      console.error("Error al añadir documento: ", e);
      toast({ title: "Error al Enviar Solicitud", description: "Hubo un problema al guardar tu solicitud.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const serviceNameFromQuery = searchParams.get('serviceName') ? decodeURIComponent(searchParams.get('serviceName')!) : null;
  const handymanNameFromQuery = searchParams.get('handymanName') ? decodeURIComponent(searchParams.get('handymanName')!) : null;
  const hasContext = isCartMode || !!serviceNameFromQuery;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">
             {hasContext ? 'Completa tu Solicitud' : 'Solicitar una Cotización'}
          </CardTitle>
          <CardDescription>
            {isCartMode 
              ? `Estás a punto de solicitar una cotización para ${cartItems.length} productos.` 
              : serviceNameFromQuery 
              ? `Estás solicitando el servicio de "${serviceNameFromQuery}".`
              : `Completa el formulario para obtener una cotización de servicio.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCartMode && (
            <Card className="mb-6 bg-muted">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><List className="h-5 w-5"/> Tu Lista de Cotización para {cartSupplierName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {cartItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">${(item.price || 0).toLocaleString('es-CO')} / {item.unit}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id!)} aria-label={`Quitar ${item.name} de la lista`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={clearCart}>Vaciar Lista</Button>
                </CardFooter>
            </Card>
          )}

          {serviceNameFromQuery && !isCartMode && (
             <Card className="mb-6 bg-accent/10 border-accent/20">
                <CardHeader>
                    <CardTitle className="text-xl text-accent">Detalles de tu Solicitud</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1 text-sm">
                        <p><strong>Servicio:</strong> {serviceNameFromQuery}</p>
                        {handymanNameFromQuery && (
                            <p><strong>Operario seleccionado:</strong> {handymanNameFromQuery}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          )}


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="contactFullName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="contactEmail" render={({ field }) => ( <FormItem> <FormLabel>Correo Electrónico</FormLabel> <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              <FormField control={form.control} name="contactPhone" render={({ field }) => ( <FormItem> <FormLabel>Número de Teléfono (Opcional)</FormLabel> <FormControl><Input type="tel" placeholder="Tu número de teléfono" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección (para entrega o servicio)</FormLabel> <FormControl><Input placeholder="Calle 123, Ciudad, Provincia" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              
              {!hasContext && (
                 <FormField control={form.control} name="serviceId" render={({ field }) => ( 
                      <FormItem> 
                        <FormLabel>Servicio Requerido</FormLabel> 
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={servicesLoading}> 
                          <FormControl> 
                            <SelectTrigger> 
                              <SelectValue placeholder={servicesLoading ? "Cargando servicios..." : "Selecciona un servicio o describe tu problema abajo"} /> 
                            </SelectTrigger> 
                          </FormControl> 
                          <SelectContent> 
                            {availableServices?.map(service => ( <SelectItem key={service.id} value={service.id!}> {service.name} </SelectItem> ))} 
                          </SelectContent> 
                        </Select> 
                        <FormMessage /> 
                      </FormItem> 
                  )}
                />
              )}
              
              <FormField control={form.control} name="problemDescription" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>{isCartMode ? 'Comentarios Adicionales (Opcional)' : 'Descripción del Problema o Productos'}</FormLabel> 
                    <FormControl> 
                      <Textarea placeholder='Describe el problema en detalle...' rows={8} className={isCartMode ? "bg-muted" : ""} {...field} readOnly={isCartMode && field.value.startsWith('Solicitud de cotización para')} /> 
                    </FormControl>
                    <FormDescription>{isCartMode ? 'La lista de productos ya se ha generado. Usa este campo para cualquier nota adicional para el proveedor.' : 'Si no seleccionaste un servicio específico, describe tu problema o los productos que necesitas.'}</FormDescription>
                    <FormMessage /> 
                  </FormItem> 
              )}/>
              
              <FormField control={form.control} name="preferredDate" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>Fecha Preferida (Opcional)</FormLabel> 
                    <FormControl><Input type="date" {...field} min={new Date().toISOString().split("T")[0]}/></FormControl> 
                    <FormDescription>Indícanos si tienes una fecha preferida para el servicio o entrega.</FormDescription> 
                    <FormMessage /> 
                  </FormItem> 
              )}/>

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
