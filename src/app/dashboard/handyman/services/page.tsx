
// src/app/dashboard/handyman/services/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, ListChecks, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { HandymanService, PriceType } from '@/types/handymanService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const serviceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio debe tener al menos 3 caracteres.").max(100),
  category: z.string().min(3, "La categoría debe tener al menos 3 caracteres.").max(50),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(500),
  priceType: z.enum(["fijo", "porHora", "porProyecto", "consultar"], {
    required_error: "Selecciona un tipo de precio.",
  }),
  priceValue: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

const priceTypeTranslations: Record<PriceType, string> = {
  fijo: "Fijo",
  porHora: "Por Hora",
  porProyecto: "Por Proyecto",
  consultar: "Consultar Cotización",
};

async function fetchHandymanServices(handymanUid: string): Promise<HandymanService[]> {
  if (!handymanUid) return [];
  const servicesRef = collection(firestore, "handymanServices");
  const q = query(servicesRef, where("handymanUid", "==", handymanUid), orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const services: HandymanService[] = [];
  querySnapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() } as HandymanService);
  });
  return services;
}


export default function HandymanServicesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offeredServices, setOfferedServices] = useState<HandymanService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      priceType: "consultar",
      priceValue: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (typedUser?.uid) {
      setIsLoadingServices(true);
      fetchHandymanServices(typedUser.uid)
        .then(setOfferedServices)
        .catch(err => {
          console.error("Detailed error fetching services:", err);
          let description = "No se pudieron cargar tus servicios. Revisa la consola del navegador para más detalles.";
          if (err.message) {
            if (err.message.toLowerCase().includes('permission-denied') || err.message.toLowerCase().includes('missing or insufficient permissions')) {
              description = "Error de permisos al cargar servicios. Asegúrate de que tus reglas de seguridad de Firestore permitan leer 'handymanServices' para tu usuario.";
            } else if (err.message.toLowerCase().includes('failed-precondition') && err.message.toLowerCase().includes('index')) {
              description = "Error al cargar servicios: Firestore necesita un índice. Revisa la consola del navegador, usualmente hay un enlace para crearlo directamente.";
            } else {
              description = `Error al cargar servicios: ${err.message}`;
            }
          }
          toast({ title: "Error al Cargar Servicios", description, variant: "destructive", duration: 10000 });
        })
        .finally(() => setIsLoadingServices(false));
    } else {
      setIsLoadingServices(false);
      setOfferedServices([]);
    }
  }, [typedUser, toast]);

  useEffect(() => {
    // Reset form and editing state when dialog closes, unless we are in edit mode and just opened it.
    if (!isDialogOpen && editingServiceId) {
      setEditingServiceId(null);
      form.reset({
        name: "",
        category: "",
        description: "",
        priceType: "consultar",
        priceValue: "",
        isActive: true,
      });
    }
  }, [isDialogOpen, editingServiceId, form]);

  const handleEdit = (service: HandymanService) => {
    if (!service.id) {
        toast({ title: "Error", description: "ID de servicio no encontrado para editar.", variant: "destructive"});
        return;
    }
    setEditingServiceId(service.id);
    form.reset({
        name: service.name,
        category: service.category,
        description: service.description,
        priceType: service.priceType,
        priceValue: service.priceValue || "",
        isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    if (!typedUser?.uid) {
      toast({ title: "Error", description: "Debes iniciar sesión para gestionar servicios.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    try {
      const serviceDataForFirestore: Omit<HandymanService, 'id' | 'createdAt' | 'updatedAt'> & { handymanUid: string; updatedAt: Timestamp; createdAt?: Timestamp } = {
        handymanUid: typedUser.uid,
        name: data.name,
        category: data.category,
        description: data.description,
        priceType: data.priceType as PriceType,
        priceValue: data.priceType !== 'consultar' ? (data.priceValue || null) : null,
        isActive: data.isActive,
        currency: "COP",
        updatedAt: serverTimestamp() as Timestamp, // Type assertion for serverTimestamp
      };

      if (editingServiceId) {
        // Editing existing service
        const serviceDocRef = doc(firestore, "handymanServices", editingServiceId);
        await updateDoc(serviceDocRef, serviceDataForFirestore);
        
        toast({
          title: "Servicio Actualizado",
          description: `El servicio "${data.name}" ha sido actualizado exitosamente.`,
        });
        
        setOfferedServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...serviceDataForFirestore, id: editingServiceId, updatedAt: Timestamp.now() } as HandymanService : s));
        setEditingServiceId(null);

      } else {
        // Adding new service
        serviceDataForFirestore.createdAt = serverTimestamp() as Timestamp; // Type assertion
        const docRef = await addDoc(collection(firestore, "handymanServices"), serviceDataForFirestore);
        toast({
          title: "Servicio Añadido",
          description: `El servicio "${data.name}" ha sido añadido exitosamente.`,
        });
        
        const newService: HandymanService = {
            id: docRef.id,
            ...serviceDataForFirestore,
            priceValue: serviceDataForFirestore.priceValue, // Ensure it's string or null
            createdAt: Timestamp.now(), 
            updatedAt: Timestamp.now(),
        };
        setOfferedServices(prev => [newService, ...prev]);
      }
      
      form.reset({ // Reset to default values after add or edit
        name: "",
        category: "",
        description: "",
        priceType: "consultar",
        priceValue: "",
        isActive: true,
      });
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error("Error saving service:", error);
      let description = "Hubo un problema al guardar el servicio. Revisa la consola del navegador para más detalles.";
       if (error.message) {
            if (error.message.toLowerCase().includes('permission-denied') || error.message.toLowerCase().includes('missing or insufficient permissions')) {
                description = "Error de permisos al guardar el servicio. Asegúrate de que tus reglas de seguridad de Firestore permitan escribir en 'handymanServices' para tu usuario.";
            } else {
                 description = `Error al guardar servicio: ${error.message}`;
            }
       }
      toast({ title: `Error al ${editingServiceId ? 'Actualizar' : 'Añadir'} Servicio`, description, variant: "destructive", duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!typedUser && !isLoading) {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Debes iniciar sesión como operario para gestionar tus servicios.</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  const handleOpenDialogForNewService = () => {
    setEditingServiceId(null); // Asegurarse de que no estamos en modo edición
    form.reset({ // Restablecer el formulario a valores predeterminados
        name: "",
        category: "",
        description: "",
        priceType: "consultar",
        priceValue: "",
        isActive: true,
    });
    setIsDialogOpen(true);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Mis Servicios Ofrecidos</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/handyman">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenDialogForNewService} className="mb-6">
            <PlusCircle size={18} className="mr-2" /> Añadir Nuevo Servicio
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? "Modifica los detalles de tu servicio." : "Completa los detalles del servicio que ofreces."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Servicio</FormLabel>
                    <FormControl><Input placeholder="Ej: Reparación de Grifos" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl><Input placeholder="Ej: Plomería" {...field} /></FormControl>
                    <FormDescription>Una categoría general para tu servicio.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Describe brevemente el servicio..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Precio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(priceTypeTranslations).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("priceType") !== "consultar" && (
                   <FormField
                    control={form.control}
                    name="priceValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (COP)</FormLabel>
                        <FormControl><Input type="number" placeholder="Ej: 50000" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Servicio Activo</FormLabel>
                      <FormDescription>
                        Los clientes podrán ver y solicitar este servicio.
                      </FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => {setEditingServiceId(null); setIsDialogOpen(false);}}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Guardando..." : (editingServiceId ? "Guardar Cambios" : "Guardar Servicio")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Tus Servicios Actuales</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar los servicios que has añadido.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingServices && (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          )}
          {!isLoadingServices && offeredServices.length > 0 ? (
            <div className="space-y-4">
              {offeredServices.map((service) => (
                <Card key={service.id} className={`bg-background ${!service.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription>{service.category}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-1 truncate" title={service.description}>{service.description}</p>
                    <p className="text-sm">
                      <strong>Precio:</strong> {priceTypeTranslations[service.priceType]}
                      {service.priceType !== 'consultar' && service.priceValue && ` - $${Number(service.priceValue).toLocaleString('es-CO')} ${service.currency || 'COP'}`}
                    </p>
                    {service.createdAt && typeof (service.createdAt as any).toDate === 'function' && (
                       <p className="text-xs text-muted-foreground mt-2">
                        Añadido: {format((service.createdAt as any).toDate(), "PPP", { locale: es })}
                       </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => toast({ title: "Próximamente", description: "Eliminar servicio estará disponible pronto."})} disabled>Eliminar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingServices && (
              <div className="text-center py-10">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Aún no has añadido ningún servicio.</p>
                <p className="text-sm text-muted-foreground">Haz clic en "Añadir Nuevo Servicio" para empezar.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
