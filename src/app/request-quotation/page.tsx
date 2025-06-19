
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
      contactFullName: typedUser?.displayName || "",
      contactEmail: typedUser?.email || "",
      contactPhone: "",
      address: "",
      serviceId: serviceIdFromQuery || "",
      serviceName: serviceNameFromQuery || "",
      problemDescription: (problemFromQuery && !serviceIdFromQuery) ? decodeURIComponent(problemFromQuery) : "",
      preferredDate: "",
      handymanId: handymanIdFromQuery || "",
      handymanName: handymanNameFromQuery || "",
      attachments: null,
    },
  });

 useEffect(() => {
    const { getValues, reset, setValue } = form;
    const currentFormValues = getValues();
    let newProblemDescription = currentFormValues.problemDescription || "";
    if (problemFromQuery && !serviceIdFromQuery) {
      newProblemDescription = decodeURIComponent(problemFromQuery);
    } else if (serviceIdFromQuery) {
      // Preserve existing description if a service is pre-selected,
      // unless problemFromQuery is also present (then AI problem takes precedence)
      newProblemDescription = (problemFromQuery && serviceIdFromQuery) 
                              ? decodeURIComponent(problemFromQuery) 
                              : (currentFormValues.problemDescription || "");
    }


    reset({
      ...currentFormValues,
      contactFullName: typedUser?.displayName || currentFormValues.contactFullName || "",
      contactEmail: typedUser?.email || currentFormValues.contactEmail || "",
      serviceId: serviceIdFromQuery || currentFormValues.serviceId || "",
      serviceName: serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : (currentFormValues.serviceName || ""),
      problemDescription: newProblemDescription,
      handymanId: handymanIdFromQuery || currentFormValues.handymanId || "",
      handymanName: handymanNameFromQuery ? decodeURIComponent(handymanNameFromQuery) : (currentFormValues.handymanName || ""),
    });
    
    // Re-evaluate attachments if they were already in form state
    const currentAttachments = getValues("attachments");
    if (currentAttachments && currentAttachments.length > 0) {
        const filesArray = Array.from(currentAttachments);
        setSelectedFileObjects(filesArray);
        // Revoke old previews before creating new ones
        filePreviews.forEach(URL.revokeObjectURL);
        const newPreviews = filesArray.map(file => URL.createObjectURL(file));
        setFilePreviews(newPreviews);
    } else {
        // Ensure previews are cleared if attachments are reset or initially null
        filePreviews.forEach(URL.revokeObjectURL);
        setSelectedFileObjects([]);
        setFilePreviews([]);
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedUser, serviceIdFromQuery, serviceNameFromQuery, handymanIdFromQuery, handymanNameFromQuery, problemFromQuery, form.reset, form.getValues]);


  const handleFileSelectionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    rhfNativeOnChangeCallback: (value: FileList | null) => void 
  ) => {
    const newFilesFromInput = event.target.files;
    if (!newFilesFromInput || newFilesFromInput.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (selectedFileObjects.length === 0) {
        rhfNativeOnChangeCallback(null);
      }
      return;
    }

    let combinedFiles = [...selectedFileObjects];
    const newPreviewsToAdd: string[] = [];

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
        newPreviewsToAdd.push(URL.createObjectURL(file));
      }
    });
    
    if (combinedFiles.length > MAX_FILES) {
        toast({ title: "Límite de Archivos Excedido", description: `Puedes subir un máximo de ${MAX_FILES} archivos. Algunos no se añadieron.`, variant: "destructive" });
        combinedFiles = combinedFiles.slice(0, MAX_FILES);
        // Clean up previews for files that were sliced off
        const slicedFileNames = combinedFiles.map(f => f.name);
        newPreviewsToAdd.forEach(previewUrl => {
          const associatedFile = newFilesFromInput ? Array.from(newFilesFromInput).find(nf => URL.createObjectURL(nf) === previewUrl) : null;
          if (associatedFile && !slicedFileNames.includes(associatedFile.name)) {
            URL.revokeObjectURL(previewUrl);
          }
        });
    } 
    
    setFilePreviews(prev => {
        // Revoke old previews that are no longer in combinedFiles
        prev.forEach(oldPreviewUrl => {
            const isStillSelected = combinedFiles.some(cf => {
                try { return URL.createObjectURL(cf) === oldPreviewUrl; } catch (e) { return false; }
            });
            if (!isStillSelected && !newPreviewsToAdd.includes(oldPreviewUrl)) {
                URL.revokeObjectURL(oldPreviewUrl);
            }
        });
        // Create new previews only for the files actually in combinedFiles now
        return combinedFiles.map(f => {
           const existingPreview = selectedFileObjects.findIndex(sf => sf.name === f.name && sf.size === f.size && sf.lastModified === f.lastModified);
           if(existingPreview !== -1 && prev[existingPreview]){
             return prev[existingPreview];
           }
           const newPreview = newPreviewsToAdd.find(np => {
             const fileForNewPreview = newFilesFromInput ? Array.from(newFilesFromInput).find(nfi => URL.createObjectURL(nfi) === np) : null;
             return fileForNewPreview?.name === f.name && fileForNewPreview?.size === f.size && fileForNewPreview?.lastModified === f.lastModified;
           });
           return newPreview || URL.createObjectURL(f); // Fallback, should ideally find new or existing
        });
    });


    setSelectedFileObjects(combinedFiles);

    const dataTransfer = new DataTransfer();
    combinedFiles.forEach(f => dataTransfer.items.add(f));
    rhfNativeOnChangeCallback(dataTransfer.files.length > 0 ? dataTransfer.files : null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (
    indexToRemove: number,
    rhfNativeOnChangeCallback: (value: FileList | null) => void 
  ) => {
    if (filePreviews[indexToRemove]) {
      URL.revokeObjectURL(filePreviews[indexToRemove]);
    }

    const updatedSelectedFiles = selectedFileObjects.filter((_, index) => index !== indexToRemove);
    const updatedFilePreviews = filePreviews.filter((_, index) => index !== indexToRemove);

    setSelectedFileObjects(updatedSelectedFiles);
    setFilePreviews(updatedFilePreviews);

    const dataTransfer = new DataTransfer();
    updatedSelectedFiles.forEach(f => dataTransfer.items.add(f));
    rhfNativeOnChangeCallback(dataTransfer.files.length > 0 ? dataTransfer.files : null);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  

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
        problemDescription: "", // Clear problem description after successful submission
        preferredDate: "",
        serviceId: "", // Clear selected service
        serviceName: "",
        handymanId: "", // Clear handyman if any was set by form not query
        handymanName: "",
        attachments: null,
      });
      // Also reset query param related defaults if they were used
        if (serviceIdFromQuery) form.setValue('serviceId', '');
        if (serviceNameFromQuery) form.setValue('serviceName', '');
        if (handymanIdFromQuery) form.setValue('handymanId', '');
        if (handymanNameFromQuery) form.setValue('handymanName', '');
        if (problemFromQuery) form.setValue('problemDescription', '');


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
    // Cleanup object URLs on component unmount
    return () => {
      filePreviews.forEach(URL.revokeObjectURL);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount and unmount

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
                render={({ field: { ref, name, onBlur, onChange: rhfOnChangeCallback } }) => (
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
                        ref={(e) => { // Combine refs
                          ref(e); // RHF's ref
                          fileInputRef.current = e; // Local ref for programmatic click
                        }}
                        name={name} // RHF's name
                        onBlur={onBlur} // RHF's onBlur
                        onChange={(e) => handleFileSelectionChange(e, rhfOnChangeCallback)} // Custom handler calling RHF's onChange
                        multiple
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        className="hidden" // Keep it hidden, triggered by the button
                        disabled={isLoading}
                        // DO NOT pass field.value here
                      />
                    </FormControl>
                    <FormDescription>
                      Sube hasta {MAX_FILES} imágenes (JPG, PNG, GIF, WEBP). Máx. {MAX_FILE_SIZE_MB}MB por archivo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {filePreviews.length > 0 && (
                <div className="space-y-2">
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
                          onClick={() => {
                            const attachmentsField = form.control._fields.attachments;
                            if (attachmentsField && attachmentsField._f && attachmentsField._f.onChange) {
                                removeFile(index, attachmentsField._f.onChange as (value: FileList | null) => void);
                            } else {
                                console.warn("RHF onChange for attachments not found directly for removeFile, check field registration.");
                                // As a fallback, try to get it from the current render scope (if `removeFile` was defined there)
                                // This part is tricky if `removeFile` is outside the render prop scope.
                                // The solution is to ensure removeFile uses the rhfOnChangeCallback passed if it's from `render`
                                // For this fix, assuming form.control._fields access is the current attempt:
                                const fieldFromRender = form.getFieldState("attachments"); // getFieldState doesn't give onChange
                                // The logic below is now part of the 'render' prop directly for rhfOnChangeCallback
                                 const fieldDef = form.control._fields.attachments;
                                 if (fieldDef?._f.onChange) {
                                   removeFile(index, fieldDef._f.onChange as (value: FileList | null) => void);
                                 }
                            }
                          }}
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

    