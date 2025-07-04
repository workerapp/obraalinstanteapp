// src/app/dashboard/requests/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, Timestamp, collection, query, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/clientApp'; 
import { useAuth, type AppUser } from '@/hooks/useAuth';
import type { QuotationRequest } from '@/types/quotationRequest';
import type { RequestMessage } from '@/types/requestMessage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, AlertTriangle, ArrowLeft, User, Wrench, MapPin, Calendar, MessageSquare, Tag, FileText, DollarSign, Phone, Send, History, Paperclip, Image as ImageIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import Image from 'next/image';

const messageFormSchema = z.object({
  messageText: z.string().min(1, "El mensaje no puede estar vacío.").max(1000, "El mensaje no puede exceder los 1000 caracteres."),
});
type MessageFormData = z.infer<typeof messageFormSchema>;


const fetchRequestDetails = async (requestId: string | undefined, userId: string | undefined, userRole: string | undefined): Promise<QuotationRequest | null> => {
  if (!requestId || !userId) {
    throw new Error("ID de solicitud o ID de usuario no proporcionado.");
  }

  const requestDocRef = doc(firestore, "quotationRequests", requestId);
  const requestDocSnap = await getDoc(requestDocRef);

  if (!requestDocSnap.exists()) {
    return null; 
  }

  const requestData = requestDocSnap.data() as Omit<QuotationRequest, 'id'>;
  
  // Authorization logic
  const isOwner = requestData.userId === userId;
  const isAssigned = requestData.handymanId === userId;
  const isAdmin = userRole === 'admin';
  const isPublicRequest = !requestData.handymanId;
  const isProfessional = userRole === 'handyman' || userRole === 'supplier';
  
  const canView = isAdmin || isOwner || isAssigned || (isPublicRequest && isProfessional);

  if (!canView) {
    throw new Error("No tienes permiso para ver esta solicitud.");
  }

  return {
    id: requestDocSnap.id,
    ...requestData,
    requestedAt: requestData.requestedAt instanceof Timestamp ? requestData.requestedAt : Timestamp.now(),
    updatedAt: requestData.updatedAt instanceof Timestamp ? requestData.updatedAt : Timestamp.now(),
  } as QuotationRequest;
};

const fetchRequestMessages = async (requestId: string | undefined): Promise<RequestMessage[]> => {
  if (!requestId) return [];
  
  const messagesRef = collection(firestore, `quotationRequests/${requestId}/messages`);
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  const querySnapshot = await getDocs(q);
  const messages: RequestMessage[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    messages.push({ id: doc.id, ...data } as RequestMessage);
  });
  
  return messages;
};


export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const requestId = typeof params.id === 'string' ? params.id : undefined;
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  const imageInputRef = useRef<HTMLInputElement>(null);

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { messageText: "" },
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const { data: request, isLoading, error, isError } = useQuery<QuotationRequest | null, Error>({
    queryKey: ['quotationRequestDetails', requestId, typedUser?.uid],
    queryFn: () => fetchRequestDetails(requestId, typedUser?.uid, typedUser?.role),
    enabled: !!requestId && !!typedUser?.uid,
    retry: 1, 
  });
  
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery<RequestMessage[], Error>({
    queryKey: ['requestMessages', requestId],
    queryFn: () => fetchRequestMessages(requestId),
    enabled: !!requestId,
  });

  const onMessageSubmit = async (data: MessageFormData) => {
    if (!typedUser || !requestId) {
        toast({ title: "Error", description: "No se puede enviar el mensaje. Usuario o solicitud no identificados.", variant: "destructive"});
        return;
    }
    setIsSendingMessage(true);
    
    const newMessage: Partial<RequestMessage> = {
        text: data.messageText,
        senderId: typedUser.uid,
        senderName: typedUser.displayName || "Usuario Anónimo",
        senderRole: typedUser.role as 'customer' | 'handyman' | 'admin' | 'supplier' || 'customer',
        createdAt: serverTimestamp(),
    };
    
    try {
        const messagesRef = collection(firestore, `quotationRequests/${requestId}/messages`);
        await addDoc(messagesRef, newMessage);
        messageForm.reset();
        queryClient.invalidateQueries({ queryKey: ['requestMessages', requestId] });
    } catch (error: any) {
        console.error("Error al enviar mensaje:", error);
        toast({ title: "Error al Enviar", description: "No se pudo enviar tu mensaje.", variant: "destructive"});
    } finally {
        setIsSendingMessage(false);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        toast({ 
            title: "Imagen Demasiado Grande", 
            description: "Por favor, selecciona una imagen de menos de 500KB. Puedes usar una herramienta online para comprimirla.", 
            variant: "destructive",
            duration: 7000
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleImageSend = async () => {
    if (!selectedImage || !typedUser || !requestId) return;

    if (selectedImage.size > 500 * 1024) { // Re-check just in case
        toast({ title: "Imagen Demasiado Grande", description: "Por favor, selecciona una imagen de menos de 500KB.", variant: "destructive", duration: 7000 });
        return;
    }

    setIsSendingImage(true);
    toast({ title: "Procesando Imagen...", description: "Tu imagen se está adjuntando al chat." });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onload = async () => {
            const base64Image = reader.result as string;

            const newMessage: Partial<RequestMessage> = {
                imageUrl: base64Image,
                senderId: typedUser.uid,
                senderName: typedUser.displayName || "Usuario Anónimo",
                senderRole: typedUser.role as 'customer' | 'handyman' | 'admin' | 'supplier' || 'customer',
                createdAt: serverTimestamp(),
                text: `Imagen: ${selectedImage.name}`
            };

            const messagesRef = collection(firestore, `quotationRequests/${requestId}/messages`);
            await addDoc(messagesRef, newMessage);

            setSelectedImage(null);
            if (imageInputRef.current) imageInputRef.current.value = "";
            queryClient.invalidateQueries({ queryKey: ['requestMessages', requestId] });
            toast({ title: "Imagen Enviada", description: "La imagen se ha enviado correctamente." });
            setIsSendingImage(false);
        };
        reader.onerror = (error) => {
            console.error("Error al leer el archivo:", error);
            toast({ title: "Error al Procesar", description: "No se pudo procesar la imagen seleccionada.", variant: "destructive" });
            setIsSendingImage(false);
        };
    } catch (error: any) {
        console.error("Error al enviar imagen:", error);
        toast({ title: "Error al Enviar Imagen", description: error.message || "No se pudo enviar la imagen.", variant: "destructive" });
        setIsSendingImage(false);
    }
  };

  const getStatusColorClass = (status?: QuotationRequest['status']): string => {
    if (!status) return 'bg-gray-500 text-white';
    switch (status) {
     case 'Completada': return 'bg-green-600 text-white';
     case 'Programada': return 'bg-blue-500 text-white';
     case 'Enviada': return 'bg-yellow-500 text-black';
     case 'Revisando': return 'bg-orange-500 text-white';
     case 'Cotizada': return 'bg-purple-500 text-white';
     case 'Cancelada': return 'bg-red-600 text-white';
     default: return 'bg-gray-500 text-white';
   }
 };
 
  const getRoleBadgeClass = (role?: string) => {
    if (role === 'admin') return 'bg-destructive text-destructive-foreground';
    if (role === 'handyman') return 'bg-primary text-primary-foreground';
    if (role === 'supplier') return 'bg-accent text-accent-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  if (authLoading || (isLoading && !isError)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando detalles de la solicitud...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Cargar la Solicitud</AlertTitle>
          <AlertDescription>
            {error?.message.includes("No tienes permiso") 
              ? "No tienes permiso para ver los detalles de esta solicitud."
              : "No pudimos cargar los detalles de la solicitud. Es posible que no exista o haya ocurrido un error."}
            <br />
            <small>{error?.message}</small>
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Solicitud no Encontrada</AlertTitle>
            <AlertDescription>La solicitud que buscas no existe o no se pudo cargar.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline font-bold text-primary">Detalles de la Solicitud</h2>
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <FileText className="mr-3 h-8 w-8" /> {request.serviceName}
            </CardTitle>
            <Badge className={`text-lg px-4 py-1.5 ${getStatusColorClass(request.status)}`}>
              {request.status}
            </Badge>
          </div>
          <CardDescription>ID de Solicitud: {request.id}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
          
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><Wrench className="mr-2 text-accent h-5 w-5"/>Información del Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Servicio:</strong> {request.serviceName}</p>
              {request.handymanName && <p><strong>Operario Solicitado:</strong> {request.handymanName}</p>}
            </div>
            <p className="text-sm mt-2"><strong>Descripción del Problema:</strong></p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">{request.problemDescription}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><User className="mr-2 text-accent h-5 w-5"/>Información de Contacto y Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Nombre Contacto:</strong> {request.contactFullName}</p>
              <p><strong>Email Contacto:</strong> {request.contactEmail}</p>
              {typedUser?.role === 'admin' && request.contactPhone && <p className="flex items-center"><Phone className="mr-1.5 h-4 w-4 text-muted-foreground"/><strong>Teléfono:</strong> {request.contactPhone}</p>}
              <p className="flex items-center col-span-1 md:col-span-2"><MapPin className="mr-1.5 h-4 w-4 text-muted-foreground"/><strong>Dirección:</strong> {request.address}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center"><Calendar className="mr-2 text-accent h-5 w-5"/>Fechas y Estado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Fecha Solicitud:</strong> {request.requestedAt?.toDate ? format(request.requestedAt.toDate(), 'PPPp', { locale: es }) : 'N/A'}</p>
              <p><strong>Última Actualización:</strong> {request.updatedAt?.toDate ? format(request.updatedAt.toDate(), 'PPPp', { locale: es }) : 'N/A'}</p>
              {request.preferredDate && <p><strong>Fecha Preferida:</strong> {format(new Date(request.preferredDate), 'PPP', { locale: es })}</p>}
            </div>
          </div>
          
          {(request.status === 'Cotizada' || request.status === 'Programada' || request.status === 'Completada') && request.quotedAmount != null && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><DollarSign className="mr-2 text-accent h-5 w-5"/>Detalles de la Cotización</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong>Monto Cotizado:</strong> ${request.quotedAmount.toLocaleString('es-CO')} {request.quotedCurrency || 'COP'}</p>
                </div>
                {request.quotationDetails && (
                    <>
                     <p className="text-sm mt-2"><strong>Notas de la Cotización:</strong></p>
                     <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">{request.quotationDetails}</p>
                    </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Messaging Section */}
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center"><MessageSquare className="mr-3 h-6 w-6 text-primary"/> Historial de Mensajes</CardTitle>
            <CardDescription>Comunícate con el cliente o el operario aquí. Puedes adjuntar imágenes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto p-4 border rounded-md bg-muted/50">
             {messagesLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary"/></div>}
             
             {messagesError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error al Cargar Mensajes</AlertTitle>
                    <AlertDescription>No se pudo cargar el historial. Revisa tus permisos o la configuración de la base de datos.</AlertDescription>
                </Alert>
             )}

             {!messagesLoading && !messagesError && messages && messages.length > 0 ? (
                messages.map(message => (
                    <div key={message.id} className={`flex flex-col ${message.senderId === typedUser?.uid ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-md p-3 rounded-lg ${message.senderId === typedUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">{message.senderName}</span>
                                <Badge variant="outline" className={`text-xs h-5 ${getRoleBadgeClass(message.senderRole)}`}>{message.senderRole}</Badge>
                            </div>
                            {message.imageUrl ? (
                              <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                <Image src={message.imageUrl} alt={`Imagen de ${message.senderName}`} width={250} height={250} className="rounded-md object-cover max-w-full" />
                              </a>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            )}
                            <p className="text-xs opacity-70 mt-2 text-right">
                                {message.createdAt instanceof Timestamp ? format(message.createdAt.toDate(), 'Pp', { locale: es }) : 'Enviando...'}
                            </p>
                        </div>
                    </div>
                ))
             ) : (
                !messagesLoading && !messagesError && (
                    <p className="text-sm text-center text-muted-foreground py-4">No hay mensajes en esta solicitud. ¡Sé el primero en enviar uno!</p>
                )
             )}
          </div>
          
          <Separator/>
          
          {selectedImage && (
            <div className="p-3 border rounded-md bg-background flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="truncate">{selectedImage.name}</span>
              </div>
              <Button onClick={handleImageSend} size="sm" disabled={isSendingImage}>
                {isSendingImage ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                Enviar Imagen
              </Button>
            </div>
          )}

          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="space-y-3">
              <FormField
                control={messageForm.control}
                name="messageText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Enviar un nuevo mensaje</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Escribe tu mensaje..."
                        rows={3}
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                 <Button type="submit" disabled={isSendingMessage || isSendingImage}>
                  {isSendingMessage ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2 h-4 w-4"/>}
                  Enviar Mensaje
                </Button>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" />
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isSendingImage}>
                    <Paperclip className="mr-2 h-4 w-4"/> Adjuntar Imagen
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
