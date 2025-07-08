
// src/app/admin/product-categories/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { PlusCircle, ListChecks, ArrowLeft, Loader2, Trash2, Layers } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ProductCategory } from '@/types/productCategory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryFormSchema = z.object({
  name: z.string().min(3, "El nombre de la categoría debe tener al menos 3 caracteres.").max(100),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;


async function fetchProductCategories(): Promise<ProductCategory[]> {
  const categoriesRef = collection(firestore, "productCategories");
  const q = query(categoriesRef, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const categories: ProductCategory[] = [];
  querySnapshot.forEach((doc) => {
    categories.push({ id: doc.id, ...doc.data() } as ProductCategory);
  });
  return categories;
}

export default function AdminProductCategoriesPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (authLoading || user?.role !== 'admin') return;
    setIsLoadingCategories(true);
    fetchProductCategories()
      .then(setCategories)
      .catch(err => {
        console.error("Error fetching product categories:", err);
        toast({ title: "Error al Cargar Categorías", description: err.message, variant: "destructive" });
      })
      .finally(() => setIsLoadingCategories(false));
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (!isDialogOpen) { 
      setEditingCategoryId(null); 
      form.reset({ name: "" });
    }
  }, [isDialogOpen, form]);

  const handleEdit = (category: ProductCategory) => {
    setEditingCategoryId(category.id!);
    form.reset({ name: category.name });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingCategoryId(null); 
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const categoryData: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: Timestamp; createdAt?: Timestamp } = {
        name: data.name,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (editingCategoryId) {
        await updateDoc(doc(firestore, "productCategories", editingCategoryId), categoryData);
        toast({ title: "Categoría Actualizada", description: `La categoría "${data.name}" ha sido actualizada.` });
      } else {
        categoryData.createdAt = serverTimestamp() as Timestamp;
        await addDoc(collection(firestore, "productCategories"), categoryData);
        toast({ title: "Categoría Añadida", description: `La categoría "${data.name}" ha sido creada.` });
      }
      
      fetchProductCategories().then(setCategories);
      setIsDialogOpen(false); 
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirmDialog = (categoryId: string) => {
    setCategoryToDeleteId(categoryId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, "productCategories", categoryToDeleteId));
      toast({ title: "Categoría Eliminada" });
      setCategories(prev => prev.filter(c => c.id !== categoryToDeleteId));
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestionar Categorías de Productos</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/overview"><ArrowLeft size={16} className="mr-2" />Volver al Panel de Admin</Link>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleNew}>
            <PlusCircle size={18} className="mr-2" /> Añadir Nueva Categoría
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategoryId ? "Editar Categoría" : "Añadir Nueva Categoría"}</DialogTitle>
            <DialogDescription>Define una categoría para los productos de la plataforma.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre de la Categoría</FormLabel><FormControl><Input placeholder="Ej: Ferretería General" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </form>
          </Form>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCategoryId ? "Guardar Cambios" : "Guardar Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará la categoría.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="text-primary" /> Categorías de Productos de la Plataforma</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar las categorías que los proveedores usarán.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoadingCategories && categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <Card key={category.id} className="bg-background flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">Añadida: {category.createdAt ? format((category.createdAt as any).toDate(), "PP", { locale: es }) : 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(category.id!)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingCategories && <div className="text-center py-10"><ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">No has añadido ninguna categoría de productos.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
