
// src/app/dashboard/customer/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserCircle, ArrowLeft, Save } from 'lucide-react';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, auth } from '@/firebase/clientApp';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile, type User as FirebaseUser } from 'firebase/auth'; // Import FirebaseUser type
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "El nombre completo es requerido.").max(50),
  photoURL: z.string().url("Debe ser una URL válida para la foto.").optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function CustomerProfilePage() {
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth();
  const typedUser = user as AppUser | null;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      photoURL: "",
    },
  });

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

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!typedUser?.uid || !auth.currentUser) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(firestore, "users", typedUser.uid);
      
      const firestoreUpdateData: any = {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        updatedAt: serverTimestamp(),
      };
      // Ensure role is preserved if the document already exists or set if it's a new profile for some reason
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        firestoreUpdateData.role = typedUser.role || 'customer'; // Default to customer if role not in typedUser
        firestoreUpdateData.email = typedUser.email;
        firestoreUpdateData.uid = typedUser.uid;
        firestoreUpdateData.createdAt = serverTimestamp();
      }


      await updateDoc(userDocRef, firestoreUpdateData);

      await updateFirebaseAuthProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });
      
      if (setAuthUser && auth.currentUser) {
        const updatedAuthUser: AppUser = {
          ...(auth.currentUser as FirebaseUser), 
          displayName: data.displayName,
          photoURL: data.photoURL || null,
          role: typedUser.role, 
        } as AppUser; 
        setAuthUser(updatedAuthUser);
      }

      toast({ title: "Perfil Actualizado", description: "Tu información de perfil ha sido guardada." });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error al Actualizar", description: error.message || "No se pudo guardar tu perfil.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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
              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de tu Foto de Perfil (Opcional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://ejemplo.com/imagen.png" {...field} /></FormControl>
                    <FormDescription>Pega un enlace a una imagen tuya alojada públicamente.</FormDescription>
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
    </div>
  );
}

