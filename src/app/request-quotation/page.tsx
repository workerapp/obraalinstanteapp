
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
import { Loader2, Send, FileText, Package, Upload, X } from 'lucide-react'; 
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { services as availableServices } from '@/data/services';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image'; 
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, storage } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


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
  attachments: z.instanceof(FileList).optional().nullable()
    .refine(files => !files || files.length <= MAX_FILES, `No puedes subir más de ${MAX_FILES} archivos.`)
    .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE_BYTES), `Cada archivo no debe exceder ${MAX_FILE_SIZE_MB}MB.`)
    .refine(files => !files || Array.from(files).every(file => ALLOWED_FILE_TYPES.includes(file.type)), 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP).'),
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
  
  const [selectedFileObjects, setSelectedFileObjects] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      attachments: null, // Ensure attachments default to null
    },
  });

 useEffect(() => {
    const { reset, getValues } = form; // getValues for reading current state if needed BEFORE reset
    const currentFormValues = getValues(); // Read existing values once

    let newProblemDescription = problemFromQuery 
        ? decodeURIComponent(problemFromQuery) 
        : currentFormValues.problemDescription || "";
    
    // If a specific service is coming from query, it might override the problem description
    // or complement it. Current logic keeps problem if service is also from query.
    if (serviceIdFromQuery && problemFromQuery) {
        newProblemDescription = decodeURIComponent(problemFromQuery);
    } else if (serviceIdFromQuery && !problemFromQuery) {
        // If only serviceId is present, maybe clear problem or keep existing, based on UX choice.
        // For now, we keep existing problem description if any.
        newProblemDescription = currentFormValues.problemDescription || "";
    }


    const resetValues = {
      contactFullName: typedUser?.displayName || currentFormValues.contactFullName || "",
      contactEmail: typedUser?.email || currentFormValues.contactEmail || "",
      contactPhone: currentFormValues.contactPhone || "",
      address: currentFormValues.address || "",
      serviceId: serviceIdFromQuery || currentFormValues.serviceId || "",
      serviceName: serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (currentFormValues.serviceName || ""),
      problemDescription: newProblemDescription,
      handymanId: handymanIdFromQuery || currentFormValues.handymanId || "",
      handymanName: handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (currentFormValues.handymanName || ""),
      attachments: null, // Explicitly set attachments to null in RHF's state on reset
    };
    
    reset(resetValues);

    // Clean up local state for file previews
    filePreviews.forEach(URL.revokeObjectURL);
    setFilePreviews([]);
    setSelectedFileObjects([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Attempt to clear the native file input
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
      typedUser, 
      serviceIdFromQuery, 
      serviceNameFromQuery, 
      handymanIdFromQuery, 
      handymanNameFromQuery, 
      problemFromQuery, 
      form.reset // form.reset is stable, but include if ESLint complains
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

    const attachmentUrls: string[] = [];
    if (selectedFileObjects.length > 0) {
      toast({ title: "Subiendo Archivos...", description: `Preparando ${selectedFileObjects.length} archivo(s). Esto puede tomar un momento.` });
      try {
        for (const file of selectedFileObjects) {
          const uniqueFileName = `${typedUser.uid}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const fileStorageRef = storageRef(storage, `quotation_attachments/${typedUser.uid}/${uniqueFileName}`);
          await uploadBytes(fileStorageRef, file);
          const downloadURL = await getDownloadURL(fileStorageRef);
          attachmentUrls.push(downloadURL);
        }
         toast({ title: "Archivos Subidos", description: `${attachmentUrls.length} archivo(s) subido(s) con éxito.`});
      } catch (uploadError: any) {
        console.error("Error al subir archivos: ", uploadError);
        toast({ title: "Error al Subir Adjuntos", description: "No se pudieron subir los archivos. Por favor, inténtalo de nuevo o envía la solicitud sin ellos.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
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
      attachmentUrls: attachmentUrls,
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
        attachments: null,
      });

      filePreviews.forEach(URL.revokeObjectURL);
      setSelectedFileObjects([]);
      setFilePreviews([]);
       if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e) {
      console.error("Error al añadir documento: ", e);
      toast({ title: "Error al Enviar Solicitud", description: "Hubo un problema al guardar tu solicitud.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const displayServiceName = serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (form.watch("serviceName") || null);
  const displayHandymanName = handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (form.watch("handymanName") || null);

  useEffect(() => {
    return () => {
      filePreviews.forEach(URL.revokeObjectURL);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            Completa el formulario para obtener una cotización. Puedes adjuntar imágenes para dar más detalles.
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
              
              <FormField
                control={form.control}
                name="attachments"
                render={({ field: { onChange, onBlur, name, ref } }) => {
                  const handleFileSelectionChangeInternal = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const newFilesFromInput = event.target.files;
                    if (!newFilesFromInput || newFilesFromInput.length === 0) {
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      if (selectedFileObjects.length === 0) {
                        onChange(null); // RHF field onChange
                      }
                      return;
                    }

                    let combinedFiles = [...selectedFileObjects];
                    Array.from(newFilesFromInput).forEach(file => {
                      if (combinedFiles.length >= MAX_FILES) {
                        toast({ title: "Límite Alcanzado", description: `Ya has alcanzado el máximo de ${MAX_FILES} archivos.`, variant: "default" });
                        return;
                      }
                      if (!combinedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
                        if (file.size > MAX_FILE_SIZE_BYTES) {
                          toast({ title: "Archivo Demasiado Grande", description: `El archivo "${file.name}" excede ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
                          return;
                        }
                        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                          toast({ title: "Tipo de Archivo no Permitido", description: `"${file.name}" no es válido. Solo imágenes.`, variant: "destructive" });
                          return;
                        }
                        combinedFiles.push(file);
                      }
                    });
                    
                    if (combinedFiles.length > MAX_FILES) {
                        toast({ title: "Límite de Archivos Excedido", description: `Puedes subir un máximo de ${MAX_FILES} archivos. Algunos no se añadieron.`, variant: "destructive" });
                        combinedFiles = combinedFiles.slice(0, MAX_FILES);
                    } 
                    
                    const newFilePreviews = combinedFiles.map(f => URL.createObjectURL(f));
                    setFilePreviews(prevPreviews => {
                        prevPreviews.forEach(URL.revokeObjectURL); // Revoke all old previews
                        return newFilePreviews;
                    });
                    setSelectedFileObjects(combinedFiles);

                    const dataTransfer = new DataTransfer();
                    combinedFiles.forEach(f => dataTransfer.items.add(f));
                    onChange(dataTransfer.files.length > 0 ? dataTransfer.files : null); // RHF field onChange

                    if (fileInputRef.current) fileInputRef.current.value = "";
                  };

                  const removeFileInternal = (indexToRemove: number) => {
                    if (filePreviews[indexToRemove]) {
                      URL.revokeObjectURL(filePreviews[indexToRemove]);
                    }
                    const updatedSelectedFiles = selectedFileObjects.filter((_, index) => index !== indexToRemove);
                    const updatedFilePreviews = filePreviews.filter((_, index) => index !== indexToRemove);

                    setSelectedFileObjects(updatedSelectedFiles);
                    setFilePreviews(updatedFilePreviews);

                    const dataTransfer = new DataTransfer();
                    updatedSelectedFiles.forEach(f => dataTransfer.items.add(f));
                    onChange(dataTransfer.files.length > 0 ? dataTransfer.files : null); // RHF field onChange
                    
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  };

                  return (
                    <FormItem>
                      <FormLabel>Adjuntar Imágenes (Opcional)</FormLabel>
                       <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectedFileObjects.length >= MAX_FILES || isLoading}
                      >
                        <Upload className="mr-2 h-4 w-4" /> 
                        Seleccionar Archivos ({selectedFileObjects.length}/{MAX_FILES})
                      </Button>
                      <FormControl>
                        <input
                          type="file"
                          ref={(e) => {
                            ref(e); // RHF's ref
                            fileInputRef.current = e; // Local ref
                          }}
                          name={name} // RHF's name
                          onBlur={onBlur} // RHF's onBlur
                          onChange={handleFileSelectionChangeInternal}
                          multiple
                          accept={ALLOWED_FILE_TYPES.join(',')}
                          className="hidden"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Sube hasta {MAX_FILES} imágenes (JPG, PNG, GIF, WEBP). Máx. {MAX_FILE_SIZE_MB}MB por archivo.
                      </FormDescription>
                      <FormMessage />
                      {filePreviews.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-sm font-medium text-muted-foreground">Archivos seleccionados:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {filePreviews.map((previewUrl, index) => (
                              <div key={previewUrl} className="relative group border rounded-md p-1">
                                <NextImage
                                  src={previewUrl}
                                  alt={`Vista previa ${index + 1}`}
                                  width={100}
                                  height={100}
                                  className="aspect-square object-cover rounded"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-75 group-hover:opacity-100"
                                  onClick={() => removeFileInternal(index)}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Eliminar archivo</span>
                                </Button>
                                <p className="text-xs text-muted-foreground truncate mt-1" title={selectedFileObjects[index]?.name}>
                                  {selectedFileObjects[index]?.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  );
                }}
              />

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
    
