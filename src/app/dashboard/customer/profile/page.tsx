// src/app/dashboard/customer/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserCircle, ArrowLeft, Save, Upload, ImageIcon, Trash2 } from 'lucide-react';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, auth, storage } from '@/firebase/clientApp';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile, type User as FirebaseUser } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "El nombre completo es requerido.").max(50),
  photoURL: z.string().url("Debe ser una URL válida para la foto.").optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function CustomerProfilePage() {
  const { user, loading: authLoading, setUser: setAuthUser, deleteCurrentUserAccount } = useAuth();
  const typedUser = user as AppUser | null;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      photoURL: "",
    },
  });
  
  const currentPhotoUrl = form.watch('photoURL');

  useEffect(() => {
    if (typedUser?.uid) {
      setIsFetchingProfile(true);
      const fetchProfileData = async () => {
        try {
          const userDocRef = doc(firestore, "users", typedUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            form.reset({
              displayName: data.displayName || typedUser.displayName || "",
              photoURL: data.photoURL || typedUser.photoURL || "",
            });
          } else {
            form.reset({
                displayName: typedUser.displayName || "",
                photoURL: typedUser.photoURL || "",
            });
            toast({ title: "Perfil no encontrado en BD", description: "Completando con datos básicos. Guarda para crear tu perfil detallado si es necesario.", variant: "default" });
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          toast({ title: "Error al Cargar Perfil", description: "No se pudieron cargar tus datos.", variant: "destructive" });
        } finally {
          setIsFetchingProfile(false);
        }
      };
      fetchProfileData();
    } else if (!authLoading) {
        setIsFetchingProfile(false);
    }
  }, [typedUser, form, toast, authLoading]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Imagen muy grande", description: "Por favor, sube una imagen de menos de 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!typedUser?.uid || !auth.currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      let finalPhotoURL = data.photoURL || null;

      if (selectedFile) {
        toast({ title: "Subiendo imagen...", description: "Por favor espera." });
        const imageRef = storageRef(storage, `profile-pictures/${typedUser.uid}/${selectedFile.name}`);
        await uploadBytes(imageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(imageRef);
        form.setValue('photoURL', finalPhotoURL);
      }

      const userDocRef = doc(firestore, "users", typedUser.uid);
      
      const firestoreUpdateData: any = {
        displayName: data.displayName,
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp(),
      };

      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        firestoreUpdateData.role = typedUser.role || 'customer';
        firestoreUpdateData.email = typedUser.email;
        firestoreUpdateData.uid = typedUser.uid;
        firestoreUpdateData.createdAt = serverTimestamp();
      }

      await updateDoc(userDocRef, firestoreUpdateData, { merge: true });

      await updateFirebaseAuthProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: finalPhotoURL,
      });
      
      if (setAuthUser && auth.currentUser) {
        const updatedAuthUser: AppUser = {
          ...(auth.currentUser as FirebaseUser), 
          displayName: data.displayName,
          photoURL: finalPhotoURL,
          role: typedUser.role, 
        } as AppUser; 
        setAuthUser(updatedAuthUser);
      }
      
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({ title: "Perfil Actualizado", description: "Tu información de perfil ha sido guardada." });

    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error al Actualizar", description: error.message || "No se pudo guardar tu perfil.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteCurrentUserAccount();
    setIsDeleting(false);
  };

  if (authLoading || isFetchingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!typedUser) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Debes iniciar sesión para editar tu perfil.</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }
  
  const displayPhoto = previewUrl || currentPhotoUrl;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Editar Mi Perfil</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/customer">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Panel de Cliente
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle>Información de Perfil</CardTitle>
              <CardDescription>Actualiza tu nombre y foto de perfil.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormItem>
                <FormLabel>Foto de Perfil</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border">
                    {displayPhoto ? (
                      <Image src={displayPhoto} alt="Vista previa de perfil" layout="fill" objectFit="cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Cambiar Foto
                  </Button>
                </div>
               </FormItem>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl><Input placeholder="Ej: Ana Rodríguez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading || isFetchingProfile} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando Cambios...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones permanentes e irreversibles.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
              Eliminar tu cuenta borrará permanentemente toda tu información, incluyendo tu perfil, solicitudes e historial. Esta acción no se puede deshacer.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={authLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Mi Cuenta Permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es irreversible. Todos tus datos serán eliminados.
                  Para confirmar, haz clic en "Confirmar Eliminación".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || authLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
                  ) : (
                    <><Trash2 className="mr-2 h-4 w-4" />Confirmar Eliminación</>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

    </div>
  );
}
