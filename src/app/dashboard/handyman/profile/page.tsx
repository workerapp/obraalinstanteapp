
// src/app/dashboard/handyman/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserCircle, ArrowLeft, Save } from 'lucide-react';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "El nombre completo es requerido.").max(50),
  tagline: z.string().max(100, "El lema no debe exceder los 100 caracteres.").optional().or(z.literal('')),
  location: z.string().max(100, "La ubicación no debe exceder los 100 caracteres.").optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[0-9\s-()]*$/, "Número de teléfono inválido.").max(20).optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')), // Comma-separated or one per line
  photoURL: z.string().url("Debe ser una URL válida para la foto.").optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function HandymanProfilePage() {
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth(); // Assuming setUser is available from useAuth to update context
  const typedUser = user as AppUser | null;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      location: "",
      phone: "",
      skills: "",
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
              tagline: data.tagline || "",
              location: data.location || "",
              phone: data.phone || "",
              skills: Array.isArray(data.skills) ? data.skills.join('\n') : (data.skills || ""),
              photoURL: data.photoURL || typedUser.photoURL || "",
            });
          } else {
             // Pre-fill with auth data if no Firestore doc yet for these fields
            form.reset({
                displayName: typedUser.displayName || "",
                tagline: "",
                location: "",
                phone: "",
                skills: "",
                photoURL: typedUser.photoURL || "",
            });
            toast({ title: "Perfil no encontrado en BD", description: "Completando con datos básicos. Guarda para crear tu perfil detallado.", variant: "default" });
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
        setIsFetchingProfile(false); // Not logged in or still loading auth
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
      const skillsArray = data.skills ? data.skills.split('\n').map(s => s.trim()).filter(s => s) : [];
      
      const firestoreUpdateData: any = {
        displayName: data.displayName,
        tagline: data.tagline || null,
        location: data.location || null,
        phone: data.phone || null,
        skills: skillsArray,
        photoURL: data.photoURL || null,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, firestoreUpdateData);

      // Update Firebase Auth profile (only displayName and photoURL can be updated here)
      await updateFirebaseAuthProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
      
      // Optimistically update local auth state if setUser is available in useAuth
      // This provides immediate feedback in the UI (e.g., navbar)
      if (setAuthUser && auth.currentUser) {
        const updatedAuthUser: AppUser = {
          ...auth.currentUser, // Spread the existing FirebaseUser properties
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: typedUser.role, // Preserve role
        };
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
  
  if (typedUser.role !== 'handyman') {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Esta sección es solo para operarios.</p>
        <Button variant="outline" asChild className="mt-4">
            <Link href="/dashboard/customer"><ArrowLeft size={16} className="mr-2" />Volver al Panel de Cliente</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Editar Mi Perfil de Operario</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/handyman">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle>Información de Perfil</CardTitle>
              <CardDescription>Mantén tus datos actualizados para que los clientes puedan encontrarte.</CardDescription>
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
                    <FormLabel>Nombre Completo / Nombre de Empresa</FormLabel>
                    <FormControl><Input placeholder="Ej: Juan Pérez Soluciones" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lema o Frase Corta (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: Soluciones rápidas y confiables" {...field} /></FormControl>
                    <FormDescription>Un lema breve que te describa.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación (Ciudad, Barrio - Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: Bogotá, Chapinero" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Teléfono de Contacto (Opcional)</FormLabel>
                    <FormControl><Input type="tel" placeholder="Ej: +57 3001234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habilidades Principales (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Plomería General&#10;Electricidad Básica&#10;Pintura de Interiores" rows={4} {...field} /></FormControl>
                    <FormDescription>Lista tus habilidades principales, una por línea.</FormDescription>
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
                    <FormDescription>Pega un enlace a una imagen tuya o de tu logo alojada públicamente.</FormDescription>
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
