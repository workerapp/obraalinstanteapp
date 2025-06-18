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
import NextImage from 'next/image'; // Renamed to avoid conflict
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, storage } from '@/firebase/clientApp'; // Import storage
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions

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
  attachments: z.custom<FileList>((val) => val instanceof FileList, "Se esperan archivos").optional(),
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      attachments: undefined,
    },
  });

  useEffect(() => {
    const { getValues, reset } = form;
    const currentFormValues = getValues();
    let newProblemDescription = currentFormValues.problemDescription || "";
    if (problemFromQuery && !serviceIdFromQuery) {
      newProblemDescription = decodeURIComponent(problemFromQuery);
    } else if (serviceIdFromQuery) {
      newProblemDescription = ""; // Clear if service is selected
    }
    reset({
      contactFullName: typedUser?.displayName || currentFormValues.contactFullName || "",
      contactEmail: typedUser?.email || currentFormValues.contactEmail || "",
      contactPhone: currentFormValues.contactPhone || "",
      address: currentFormValues.address || "",
      serviceId: serviceIdFromQuery || currentFormValues.serviceId || "",
      serviceName: serviceNameFromQuery || currentFormValues.serviceName || "",
      problemDescription: newProblemDescription,
      preferredDate: currentFormValues.preferredDate || "",
      handymanId: handymanIdFromQuery || currentFormValues.handymanId || "",
      handymanName: handymanNameFromQuery || currentFormValues.handymanName || "",
      attachments: currentFormValues.attachments,
    });
  }, [typedUser, serviceIdFromQuery, serviceNameFromQuery, handymanIdFromQuery, handymanNameFromQuery, problemFromQuery, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFilesArray = Array.from(files);
      const totalFiles = selectedFiles.length + newFilesArray.length;

      if (totalFiles > MAX_FILES) {
        toast({ title: "Límite de Archivos Excedido", description: `Puedes subir un máximo de ${MAX_FILES} archivos.`, variant: "destructive" });
        return;
      }

      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      newFilesArray.forEach(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({ title: "Archivo Demasiado Grande", description: `El archivo "${file.name}" excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
          return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast({ title: "Tipo de Archivo no Permitido", description: `El archivo "${file.name}" no es un tipo de imagen válido (JPG, PNG, GIF, WEBP).`, variant: "destructive" });
          return;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      const currentPreviews = [...prev];
      const removedPreview = currentPreviews.splice(index, 1)[0];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview); 
      }
      return currentPreviews;
    });
     if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
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

    if (serviceIdFromQuery && serviceNameFromQuery) {
      finalServiceId = serviceIdFromQuery;
      finalServiceName = serviceNameFromQuery;
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
    if (selectedFiles.length > 0) {
      toast({ title: "Subiendo Archivos...", description: `Preparando ${selectedFiles.length} archivo(s). Esto puede tomar un momento.` });
      try {
        for (const file of selectedFiles) {
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
      handymanId: data.handymanId || null,
      handymanName: data.handymanName || null,
      status: "Enviada" as const,
      attachmentUrls: attachmentUrls,
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(firestore, "quotationRequests"), quotationData);
      console.log("Solicitud de cotización guardada con ID: ", docRef.id);
      let descriptionToast = `Servicio: ${quotationData.serviceName}.`;
      if (data.handymanName) descriptionToast += ` Solicitud para ${data.handymanName}.`;
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
        problemDescription: (problemFromQuery && !serviceIdFromQuery) ? decodeURIComponent(problemFromQuery) : "",
        preferredDate: "",
        serviceId: serviceIdFromQuery || "", 
        serviceName: serviceNameFromQuery || "",
        handymanId: handymanIdFromQuery || "",
        handymanName: handymanNameFromQuery || "",
        attachments: undefined,
      });
      setSelectedFiles([]);
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
  
  const displayServiceName = serviceNameFromQuery ? decodeURIComponent(serviceNameFromQuery) : null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <FileText className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Solicitar una Cotización</CardTitle>
          <CardDescription>
            Completa el formulario para obtener una cotización. Puedes adjuntar imágenes para dar más detalles.
            {handymanNameFromQuery && ` Estás solicitando una cotización específicamente a ${decodeURIComponent(handymanNameFromQuery)}.`}
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
                <FormItem> <FormLabel>Servicio Requerido</FormLabel> <div className="flex items-center gap-2 p-3 rounded-md border bg-muted"> <Package className="h-5 w-5 text-muted-foreground" /> <span className="text-sm text-foreground">{displayServiceName || 'Servicio Específico'}</span> </div> <FormDescription> {handymanNameFromQuery ? `Solicitando cotización para ${displayServiceName} de ${decodeURIComponent(handymanNameFromQuery)}.` : `Solicitando cotización para ${displayServiceName}.`} </FormDescription> </FormItem>
              ) : problemFromQuery ? ( 
                 <FormItem> <FormLabel>Servicio Requerido</FormLabel> <div className="flex items-center gap-2 p-3 rounded-md border bg-muted"> <FileText className="h-5 w-5 text-muted-foreground" /> <span className="text-sm text-foreground">Consulta General (basada en tu descripción)</span> </div> <FormDescription>Tu problema descrito a la IA se usará como base para la cotización.</FormDescription> </FormItem>
              ) : ( 
                  <FormField control={form.control} name="serviceId" render={({ field }) => ( <FormItem> <FormLabel>Servicio Requerido</FormLabel> <Select onValueChange={(value) => { field.onChange(value); const selectedService = availableServices.find(s => s.id === value); form.setValue('serviceName', selectedService?.name || ''); }} value={field.value || ""} > <FormControl> <SelectTrigger> <SelectValue placeholder="Selecciona un servicio" /> </SelectTrigger> </FormControl> <SelectContent> {availableServices.map(service => ( <SelectItem key={service.id} value={service.id}> {service.name} </SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
              )}
              
              <FormField control={form.control} name="problemDescription" render={({ field }) => ( <FormItem> <FormLabel>Descripción del Problema</FormLabel> <FormControl> <Textarea placeholder="Describe el problema en detalle..." rows={5} className="resize-none" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
              
              <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => ( /* field is not directly used here for input type=file, but required by FormField */
                  <FormItem>
                    <FormLabel>Adjuntar Imágenes (Opcional)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={selectedFiles.length >= MAX_FILES || isLoading}>
                          <Upload className="mr-2 h-4 w-4" /> 
                          Seleccionar Archivos ({selectedFiles.length}/{MAX_FILES})
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          accept={ALLOWED_FILE_TYPES.join(',')}
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={isLoading}
                        />
                      </div>
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
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Eliminar archivo</span>
                        </Button>
                        <p className="text-xs text-muted-foreground truncate mt-1" title={selectedFiles[index]?.name}>
                          {selectedFiles[index]?.name}
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
