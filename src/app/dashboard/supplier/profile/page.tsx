// src/app/dashboard/supplier/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserCircle, ArrowLeft, Save, Upload, ImageIcon } from 'lucide-react';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, auth, storage } from '@/firebase/clientApp';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile, type User as FirebaseUser } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ProductCategory } from '@/types/productCategory';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

// Schema for the supplier profile form
const profileFormSchema = z.object({
  displayName: z.string().min(2, "El nombre de la empresa es requerido.").max(100),
  tagline: z.string().max(100, "El lema no debe exceder los 100 caracteres.").optional().or(z.literal('')),
  aboutMe: z.string().max(1000, "La descripción 'Sobre la Empresa' no debe exceder los 1000 caracteres.").optional().or(z.literal('')),
  location: z.string().max(100, "La ubicación no debe exceder los 100 caracteres.").optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[0-9\s-()]*$/, "Número de teléfono inválido.").max(20).optional().or(z.literal('')),
  skills: z.array(z.string()).default([]), // Represents categories
  photoURL: z.string().url("Debe ser una URL válida para el logo.").optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

async function fetchPlatformProductCategories(): Promise<ProductCategory[]> {
  const categoriesRef = collection(firestore, "productCategories");
  const q = query(categoriesRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  const categories: ProductCategory[] = [];
  querySnapshot.forEach((doc) => {
    categories.push({ id: doc.id, ...doc.data() } as ProductCategory);
  });
  return categories;
}

export default function SupplierProfilePage() {
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth(); 
  const typedUser = user as AppUser | null;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: platformCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['productCategories'],
    queryFn: fetchPlatformProductCategories
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      aboutMe: "",
      location: "",
      phone: "",
      skills: [], // Represents categories
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
              tagline: data.tagline || "",
              aboutMe: data.aboutMe || "",
              location: data.location || "",
              phone: data.phone || "",
              skills: data.skills || [],
              photoURL: data.photoURL || typedUser.photoURL || "",
            });
          } else {
             form.reset({
                displayName: typedUser.displayName || "",
                photoURL: typedUser.photoURL || "",
             });
            toast({ title: "Perfil no encontrado en BD", description: "Completa tus datos. Se creará un perfil detallado al guardar.", variant: "default" });
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
        tagline: data.tagline || null,
        aboutMe: data.aboutMe || null,
        location: data.location || null,
        phone: data.phone || null,
        skills: data.skills || [], // Saving as an array for querying
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp(),
      };

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
      toast({ title: "Perfil Actualizado", description: "La información de tu empresa ha sido guardada." });

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

  if (!typedUser || typedUser.role !== 'supplier') {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Esta sección es solo para proveedores.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/customer">Volver al Panel de Cliente</Link>
        </Button>
      </div>
    );
  }
  
  const displayPhoto = previewUrl || currentPhotoUrl;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Editar Perfil de Proveedor</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/supplier">
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
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Mantén tus datos actualizados para que los clientes puedan encontrarte y confiar en tu negocio.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel>Logo de la Empresa</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border">
                    {displayPhoto ? (
                      <Image src={displayPhoto} alt="Vista previa del logo" layout="fill" objectFit="cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Cambiar Logo
                  </Button>
                </div>
              </FormItem>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl><Input placeholder="Ej: Ferretería El Tornillo Feliz" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="Ej: Materiales de calidad para tu construcción" {...field} /></FormControl>
                    <FormDescription>Un lema breve que describa tu negocio.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aboutMe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre la Empresa (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe tu empresa, especialidades, historia, etc. (máx. 1000 caracteres)" 
                        rows={5} 
                        {...field} 
                      />
                    </FormControl>
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
                render={() => (
                  <FormItem>
                    <FormLabel>Categorías de Productos Ofrecidas</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-md">
                      {isLoadingCategories && <p>Cargando categorías...</p>}
                      {platformCategories?.map((category) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="skills"
                          render={({ field }) => {
                            return (
                              <FormItem key={category.id} className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.name)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValue, category.name])
                                        : field.onChange(currentValue.filter((value) => value !== category.name));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">{category.name}</FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription>Selecciona las categorías principales de productos que ofreces.</FormDescription>
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
