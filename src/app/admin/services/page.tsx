// src/app/admin/services/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { PlusCircle, ListChecks, ArrowLeft, Loader2, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { firestore, storage } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Service } from '@/types/service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const serviceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio debe tener al menos 3 caracteres.").max(100),
  category: z.string().min(3, "La categoría debe tener al menos 3 caracteres.").max(50),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000, "La descripción no debe exceder 1000 caracteres."),
  commonTasks: z.string().min(10, "Debe haber al menos una tarea común."),
  iconName: z.string().optional(),
  isActive: z.boolean().default(true),
  dataAiHint: z.string().max(50, "La pista de IA no debe exceder 50 caracteres.").optional().or(z.literal('')),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;


async function fetchPlatformServices(): Promise<Service[]> {
  const servicesRef = collection(firestore, "platformServices");
  const q = query(servicesRef, orderBy("createdAt", "desc"));
  
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
  return services;
}


export default function AdminServicesPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      commonTasks: "",
      iconName: "",
      isActive: true,
      dataAiHint: "",
    },
  });

  useEffect(() => {
    if (authLoading) return; // Wait until auth state is resolved
    if (user?.role === 'admin') {
      setIsLoadingServices(true);
      fetchPlatformServices()
        .then(setServices)
        .catch(err => {
          console.error("Error fetching platform services:", err);
          toast({ title: "Error al Cargar Servicios", description: err.message, variant: "destructive" });
        })
        .finally(() => setIsLoadingServices(false));
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (!isDialogOpen) { 
      setEditingServiceId(null); 
      setSelectedFile(null);
      setPreviewUrl(null);
      form.reset({
        name: "", category: "", description: "", commonTasks: "", iconName: "", isActive: true, dataAiHint: "",
      });
    }
  }, [isDialogOpen, form]);

  const handleEdit = (service: Service) => {
    if (!service.id) {
        toast({ title: "Error", description: "ID de servicio no encontrado.", variant: "destructive"});
        return;
    }
    setEditingServiceId(service.id);
    form.reset({
        name: service.name,
        category: service.category,
        description: service.description,
        commonTasks: Array.isArray(service.commonTasks) ? service.commonTasks.join('\n') : '',
        iconName: service.iconName || "",
        isActive: service.isActive !== false,
        dataAiHint: service.dataAiHint || "",
    });
    setPreviewUrl(service.imageUrl || null);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Imagen muy grande", description: "Por favor, sube una imagen de menos de 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const existingService = editingServiceId ? services.find(s => s.id === editingServiceId) : null;
      let finalImageUrl: string | null = existingService?.imageUrl || null;

      if (selectedFile) {
        toast({ title: "Subiendo imagen...", description: "Por favor espera." });
        const imagePath = `platform-services/${editingServiceId || data.name.replace(/\s+/g, '-') + '-' + Date.now()}/${selectedFile.name}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, selectedFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }

      const commonTasksArray = data.commonTasks.split('\n').map(task => task.trim()).filter(Boolean);

      const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: Timestamp; createdAt?: Timestamp, isActive: boolean } = {
        name: data.name,
        category: data.category,
        description: data.description,
        commonTasks: commonTasksArray,
        iconName: data.iconName || null,
        imageUrl: finalImageUrl,
        dataAiHint: data.dataAiHint || null,
        isActive: data.isActive,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (editingServiceId) {
        const serviceDocRef = doc(firestore, "platformServices", editingServiceId);
        await updateDoc(serviceDocRef, serviceData);
        toast({ title: "Servicio Actualizado", description: `El servicio "${data.name}" ha sido actualizado.` });
      } else {
        serviceData.createdAt = serverTimestamp() as Timestamp;
        await addDoc(collection(firestore, "platformServices"), serviceData);
        toast({ title: "Servicio Añadido", description: `El servicio "${data.name}" ha sido creado.` });
      }
      
      fetchPlatformServices().then(setServices);
      setIsDialogOpen(false); 
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirmDialog = (serviceId: string) => {
    setServiceToDeleteId(serviceId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDeleteId) return;

    setIsDeletingService(true);
    try {
      const serviceDocRef = doc(firestore, "platformServices", serviceToDeleteId);
      await deleteDoc(serviceDocRef);
      toast({ title: "Servicio Eliminado", description: "El servicio ha sido eliminado." });
      setServices(prev => prev.filter(s => s.id !== serviceToDeleteId));
      setServiceToDeleteId(null);
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingService(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Esta sección es solo para administradores.</p>
        <Button asChild className="mt-4"><Link href="/">Volver al Inicio</Link></Button>
      </div>
    );
  }

  const handleOpenDialogForNewService = () => {
    setEditingServiceId(null); 
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset({
        name: "", category: "", description: "", commonTasks: "", iconName: "", isActive: true, dataAiHint: "",
    });
    setIsDialogOpen(true);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestionar Servicios Globales</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/overview"><ArrowLeft size={16} className="mr-2" />Volver al Panel de Admin</Link>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenDialogForNewService} className="mb-6">
            <PlusCircle size={18} className="mr-2" /> Añadir Nuevo Servicio Global
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
            <DialogDescription>Completa los detalles del servicio que se ofrecerá en la plataforma.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-160px)] pr-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-1">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Servicio</FormLabel><FormControl><Input placeholder="Ej: Servicios de Plomería" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="Ej: Reparación del Hogar" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Textarea placeholder="Describe brevemente el servicio." rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="commonTasks" render={({ field }) => (<FormItem><FormLabel>Tareas Comunes</FormLabel><FormControl><Textarea placeholder="Reparar grifos...
Destapar desagües...
Instalar calentadores..." rows={4} {...field} /></FormControl><FormDescription>Una tarea por línea.</FormDescription><FormMessage /></FormItem>)} />
                
                <FormItem>
                  <FormLabel>Imagen del Servicio</FormLabel>
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
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        <Upload className="mr-2 h-4 w-4" />
                        {previewUrl ? 'Cambiar' : 'Subir'} Imagen
                      </Button>
                  </div>
                </FormItem>
                
                <FormField control={form.control} name="iconName" render={({ field }) => (<FormItem><FormLabel>Nombre del Ícono (Lucide)</FormLabel><FormControl><Input placeholder="Ej: Wrench" {...field} /></FormControl><FormDescription>Visita lucide.dev para explorar íconos. Copia el nombre exacto (ej: 'Wrench', 'Paintbrush') y pégalo aquí.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Pista para IA (para placeholders)</FormLabel><FormControl><Input placeholder="Ej: 'plomero trabajando'" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Servicio Activo</FormLabel><FormDescription>Los clientes podrán ver este servicio.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></DialogClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Guardando..." : (editingServiceId ? "Guardar Cambios" : "Guardar Servicio")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} disabled={isDeletingService} className="bg-destructive hover:bg-destructive/90">
              {isDeletingService ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : <><Trash2 className="mr-2 h-4 w-4" /> Confirmar</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary" /> Servicios Globales de la Plataforma</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar los servicios que se muestran en el catálogo principal.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingServices && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoadingServices && services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className={`bg-background ${!service.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-lg">{service.name}</CardTitle><CardDescription>{service.category}</CardDescription></div><span className={`px-2 py-1 text-xs rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{service.isActive ? 'Activo' : 'Inactivo'}</span></div></CardHeader>
                  <CardContent>
                    {service.imageUrl && <div className="mb-3 relative h-32 w-full sm:w-48 overflow-hidden rounded-md border bg-muted"><Image src={service.imageUrl} alt={`Imagen para ${service.name}`} layout="fill" objectFit="contain" className="p-2" data-ai-hint={service.dataAiHint || "servicio ejemplo"} /></div>}
                    <p className="text-sm text-muted-foreground mb-1 line-clamp-2" title={service.description}>{service.description}</p>
                    {service.createdAt && typeof (service.createdAt as any).toDate === 'function' && <p className="text-xs text-muted-foreground mt-2">Añadido: {format((service.createdAt as any).toDate(), "PP", { locale: es })}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(service.id!)} disabled={!service.id}><Trash2 className="mr-1.5 h-4 w-4" />Eliminar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingServices && <div className="text-center py-10"><ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">No has añadido ningún servicio global.</p><p className="text-sm text-muted-foreground">Haz clic en "Añadir Nuevo Servicio Global" para empezar.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
