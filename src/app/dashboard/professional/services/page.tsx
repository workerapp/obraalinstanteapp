// src/app/dashboard/professional/services/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, List, ArrowLeft, Loader2, Trash2, ImageIcon, Upload, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, storage } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { HandymanService, PriceType } from '@/types/handymanService';
import type { Service } from '@/types/service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';


const serviceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio debe tener al menos 3 caracteres.").max(100),
  category: z.string({ required_error: "Debes seleccionar una categoría."}).min(1, "Debes seleccionar una categoría."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000, "La descripción detallada no debe exceder 1000 caracteres."),
  priceType: z.enum(["fijo", "porHora", "porProyecto", "consultar"], {
    required_error: "Selecciona un tipo de precio.",
  }),
  priceValue: z.string().optional(),
  isActive: z.boolean().default(true),
  dataAiHint: z.string().max(50, "La pista de IA para la imagen no debe exceder 50 caracteres.").optional().or(z.literal('')),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

const priceTypeTranslations: Record<PriceType, string> = {
  fijo: "Fijo",
  porHora: "Por Hora",
  porProyecto: "Por Proyecto",
  consultar: "Consultar Cotización",
};

async function fetchProfessionalServices(professionalUid: string): Promise<HandymanService[]> {
  if (!professionalUid) return [];
  const servicesRef = collection(firestore, "handymanServices");
  const q = query(servicesRef, where("handymanUid", "==", professionalUid), orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const services: HandymanService[] = [];
  querySnapshot.forEach((doc) => {
    services.push({ id: doc.id, ...doc.data() } as HandymanService);
  });

  return services;
}

async function fetchActivePlatformServices(): Promise<Service[]> {
    const servicesRef = collection(firestore, "platformServices");
    const q = query(servicesRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
            id: doc.id,
            ...data,
            commonTasks: Array.isArray(data.commonTasks) ? data.commonTasks : [],
        } as Service);
    });
    services.sort((a, b) => a.name.localeCompare(b.name));
    return services;
}


export default function ProfessionalServicesPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For add/edit
  
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serviceTemplate, setServiceTemplate] = useState<Service | null>(null);

  const { data: offeredServices, isLoading: isLoadingOfferedServices, refetch: refetchOfferedServices } = useQuery<HandymanService[], Error>({
    queryKey: ['professionalServices', typedUser?.uid],
    queryFn: () => fetchProfessionalServices(typedUser!.uid),
    enabled: !!typedUser?.uid,
  });
  
  const { data: platformServices, isLoading: isLoadingPlatformServices } = useQuery<Service[], Error>({
    queryKey: ['platformServices'],
    queryFn: fetchActivePlatformServices,
  });
  
  const platformCategories = useMemo(() => {
    if (!platformServices) return [];
    const categories = new Set<string>();
    platformServices.forEach(service => categories.add(service.category));
    return Array.from(categories).sort();
  }, [platformServices]);

  const availablePlatformServices = useMemo(() => {
    if (!platformServices || !offeredServices) return [];
    const offeredServiceNames = new Set(offeredServices.map(s => s.name));
    return platformServices.filter(ps => !offeredServiceNames.has(ps.name));
  }, [platformServices, offeredServices]);


  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "", category: "", description: "", priceType: "consultar", priceValue: "", isActive: true, dataAiHint: "",
    },
  });

  useEffect(() => {
    if (!isDialogOpen && !isLoading) { 
      setEditingServiceId(null); 
      setSelectedFile(null);
      setPreviewUrl(null);
      setServiceTemplate(null);
      form.reset({
        name: "", category: "", description: "", priceType: "consultar", priceValue: "", isActive: true, dataAiHint: "",
      });
    }
  }, [isDialogOpen, form, isLoading]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (service: HandymanService) => {
    if (!service.id) {
        toast({ title: "Error", description: "ID de servicio no encontrado para editar.", variant: "destructive"});
        return;
    }
    setServiceTemplate(null);
    setEditingServiceId(service.id);
    form.reset({
        name: service.name, category: service.category, description: service.description, priceType: service.priceType,
        priceValue: service.priceValue || "", isActive: service.isActive, dataAiHint: service.dataAiHint || "",
    });
    setPreviewUrl(service.imageUrl || null);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };
  
  const handleOfferService = (service: Service) => {
    setServiceTemplate(service);
    setEditingServiceId(null);
    form.reset({
        name: service.name,
        category: service.category,
        description: service.description,
        priceType: "consultar",
        priceValue: "",
        isActive: true,
        dataAiHint: service.dataAiHint || "",
    });
    setPreviewUrl(service.imageUrl || null);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    if (!typedUser?.uid) {
      toast({ title: "Error", description: "Debes iniciar sesión para gestionar servicios.", variant: "destructive"});
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUrl: string | null = null;
      if (editingServiceId) {
        const existingService = offeredServices?.find(s => s.id === editingServiceId);
        finalImageUrl = existingService?.imageUrl || null;
      } else if (serviceTemplate) { // New service from template
        finalImageUrl = serviceTemplate.imageUrl || null;
      }

      if (selectedFile) {
        toast({ title: "Subiendo imagen..." });
        const imagePath = `handyman-services/${typedUser.uid}/${editingServiceId || Date.now()}/${selectedFile.name}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, selectedFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }
      
      const serviceDataForFirestore: Omit<HandymanService, 'id' | 'createdAt' | 'updatedAt'> & { handymanUid: string; updatedAt: Timestamp; createdAt?: Timestamp } = {
        handymanUid: typedUser.uid,
        name: data.name,
        category: data.category,
        description: data.description,
        priceType: data.priceType as PriceType,
        priceValue: data.priceType !== 'consultar' ? (data.priceValue || null) : null,
        isActive: data.isActive,
        imageUrl: finalImageUrl,
        dataAiHint: data.dataAiHint || null,
        currency: "COP",
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (editingServiceId) {
        const serviceDocRef = doc(firestore, "handymanServices", editingServiceId);
        await updateDoc(serviceDocRef, serviceDataForFirestore);
        toast({ title: "Servicio Actualizado", description: `El servicio "${data.name}" ha sido actualizado.` });
      } else {
        serviceDataForFirestore.createdAt = serverTimestamp() as Timestamp;
        await addDoc(collection(firestore, "handymanServices"), serviceDataForFirestore);
        toast({ title: "Servicio Añadido", description: `El servicio "${data.name}" ha sido añadido.` });
      }
      
      queryClient.invalidateQueries({ queryKey: ['professionalServices', typedUser.uid] });
      setIsDialogOpen(false); 
    } catch (error: any) {
      console.error("onSubmit: Error saving service:", error);
      let description = "Hubo un problema al guardar el servicio.";
      toast({ title: `Error al ${editingServiceId ? 'Actualizar' : 'Añadir'} Servicio`, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirmDialog = (serviceId: string) => {
    setServiceToDeleteId(serviceId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDeleteId || !typedUser?.uid) return;
    setIsDeletingService(true);
    try {
      await deleteDoc(doc(firestore, "handymanServices", serviceToDeleteId));
      toast({ title: "Servicio Eliminado" });
      refetchOfferedServices();
      setServiceToDeleteId(null);
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({ title: "Error al Eliminar Servicio", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingService(false);
    }
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!typedUser || typedUser.role !== 'handyman') {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Debes iniciar sesión como profesional para gestionar tus servicios.</p>
        <Button asChild className="mt-4"><Link href="/sign-in">Iniciar Sesión</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Mis Servicios Ofrecidos</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/professional">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
             <PlusCircle size={18} className="mr-2" />
             Añadir Servicio desde Catálogo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? "Modifica los detalles de tu servicio." : `Añade "${serviceTemplate?.name}" a tu perfil. Puedes ajustar el precio y otros detalles.`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-160px)] pr-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-1">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre del Servicio</FormLabel> <FormControl><Input placeholder="Ej: Reparación de Grifos" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría</FormLabel> <FormControl><Select onValueChange={field.onChange} value={field.value} disabled={isLoadingPlatformServices}> <SelectTrigger> <SelectValue placeholder={isLoadingPlatformServices ? "Cargando categorías..." : "Selecciona una categoría"} /> </SelectTrigger> <SelectContent> {platformCategories?.map((cat) => ( <SelectItem key={cat} value={cat}>{cat}</SelectItem> ))} </SelectContent> </Select></FormControl> <FormDescription>Selecciona la categoría que mejor describa tu servicio.</FormDescription> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción Detallada</FormLabel> <FormControl><Textarea placeholder="Describe detalladamente el servicio..." rows={5} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="priceType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Precio</FormLabel> <FormControl><Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger> <SelectContent> {Object.entries(priceTypeTranslations).map(([value, label]) => ( <SelectItem key={value} value={value}>{label}</SelectItem> ))} </SelectContent> </Select></FormControl> <FormMessage /> </FormItem> )}/>
                  {form.watch("priceType") !== "consultar" && (
                     <FormField control={form.control} name="priceValue" render={({ field }) => ( <FormItem> <FormLabel>Valor (COP)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 50000" {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
                  )}
                </div>
                <FormItem>
                  <FormLabel>Imagen de Ejemplo (Opcional)</FormLabel>
                  <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted border">
                      {previewUrl ? (
                          <Image src={previewUrl} alt="Vista previa" layout="fill" objectFit="contain" />
                      ) : (
                          <div className="flex items-center justify-center h-full w-full">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                      )}
                      </div>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {previewUrl ? 'Cambiar' : 'Subir'} Imagen
                      </Button>
                  </div>
                </FormItem>
                 <FormField control={form.control} name="dataAiHint" render={({ field }) => ( <FormItem> <FormLabel>Pista para IA (placeholders)</FormLabel> <FormControl><Input placeholder="Ej: 'profesional trabajando', 'cocina renovada'" {...field} value={field.value || ''} /></FormControl> <FormDescription>Si usas un placeholder, escribe 1-2 palabras clave para la imagen real.</FormDescription> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"> <FormLabel>Servicio Activo</FormLabel> <FormDescription>Los clientes podrán ver y solicitar este servicio.</FormDescription> </div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); }}>Cancelar</Button></DialogClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Guardando..." : (editingServiceId ? "Guardar Cambios" : "Guardar Servicio")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio "{offeredServices?.find(s => s.id === serviceToDeleteId)?.name || 'seleccionado'}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} disabled={isDeletingService} className="bg-destructive hover:bg-destructive/90">{isDeletingService ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Eliminando...</> : <><Trash2 className="mr-2 h-4 w-4"/> Confirmar</>}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/> Mis Servicios Activos</CardTitle><CardDescription>Aquí puedes ver y gestionar los servicios que has añadido a tu perfil.</CardDescription></CardHeader>
        <CardContent>
          {isLoadingOfferedServices && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoadingOfferedServices && offeredServices && offeredServices.length > 0 ? (
            <div className="space-y-4">
              {offeredServices.map((service) => (
                <Card key={service.id} className={`bg-background ${!service.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-lg">{service.name}</CardTitle><CardDescription>{service.category}</CardDescription></div><span className={`px-2 py-1 text-xs rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{service.isActive ? 'Activo' : 'Inactivo'}</span></div></CardHeader>
                  <CardContent>
                    {service.imageUrl && <div className="mb-3 relative h-32 w-full sm:w-48 overflow-hidden rounded-md border bg-muted"><Image src={service.imageUrl} alt={`Imagen para ${service.name}`} layout="fill" objectFit="contain" className="p-2" data-ai-hint={service.dataAiHint || "servicio ejemplo"}/></div>}
                    <p className="text-sm text-muted-foreground mb-1 line-clamp-3" title={service.description}>{service.description}</p>
                    <p className="text-sm"><strong>Precio:</strong> {priceTypeTranslations[service.priceType]}{service.priceType !== 'consultar' && service.priceValue && ` - $${Number(service.priceValue).toLocaleString('es-CO')} ${service.currency || 'COP'}`}</p>
                    {service.createdAt && typeof (service.createdAt as any).toDate === 'function' && <p className="text-xs text-muted-foreground mt-2">Añadido: {format((service.createdAt as any).toDate(), "PPP", { locale: es })}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(service.id!)} disabled={!service.id}><Trash2 className="mr-1.5 h-4 w-4"/>Eliminar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingOfferedServices && <div className="text-center py-10"><Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4"/><p className="text-muted-foreground text-lg">Aún no has añadido ningún servicio.</p><p className="text-sm text-muted-foreground">Añade servicios desde el catálogo de la plataforma para empezar.</p></div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><List className="text-primary"/> Servicios de la Plataforma para Añadir</CardTitle>
          <CardDescription>Añade estos servicios a tu perfil con un solo clic. El nombre, la categoría y la descripción ya vienen pre-cargados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPlatformServices && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoadingPlatformServices && availablePlatformServices && availablePlatformServices.length > 0 ? (
            <div className="space-y-2">
              {availablePlatformServices.map((service) => (
                <Card key={service.id} className="bg-background flex flex-col sm:flex-row justify-between items-center p-4">
                  <div className="flex-grow mb-3 sm:mb-0">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.category}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOfferService(service)} className="w-full sm:w-auto shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Ofrecer este servicio
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingPlatformServices && <div className="text-center py-10"><List className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">¡Estás al día!</p><p className="text-sm text-muted-foreground">Ya ofreces todos los servicios disponibles en la plataforma.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
