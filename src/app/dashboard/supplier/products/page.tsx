// src/app/dashboard/supplier/products/page.tsx
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
import { PlusCircle, Package, ArrowLeft, Loader2, Trash2, Upload, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AppUser } from '@/hooks/useAuth';
import { firestore, storage } from '@/firebase/clientApp';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product } from '@/types/product';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import type { ProductCategory } from '@/types/productCategory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const productFormSchema = z.object({
  name: z.string().min(3, "El nombre del producto debe tener al menos 3 caracteres.").max(100),
  category: z.string().min(1, "La categoría es requerida."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000),
  price: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number({invalid_type_error: "El precio debe ser un número."}).positive({ message: "El precio debe ser positivo." })
  ),
  unit: z.string().min(1, "La unidad es requerida (ej: bulto, galón, unidad).").max(30),
  isActive: z.boolean().default(true),
  dataAiHint: z.string().max(50, "La pista de IA no debe exceder 50 caracteres.").optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productFormSchema>;

async function fetchSupplierProducts(supplierUid: string): Promise<Product[]> {
  if (!supplierUid) return [];
  const productsRef = collection(firestore, "supplierProducts");
  const q = query(productsRef, where("supplierUid", "==", supplierUid), orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const products: Product[] = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  return products;
}

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

export default function SupplierProductsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as AppUser | null;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: platformCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['productCategories'],
    queryFn: fetchPlatformProductCategories
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "", category: "", description: "", price: undefined, unit: "", isActive: true, dataAiHint: "",
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (typedUser?.uid && typedUser.role === 'supplier') {
      setIsLoadingProducts(true);
      fetchSupplierProducts(typedUser.uid)
        .then(setProducts)
        .catch(err => {
          console.error("Error fetching supplier products:", err);
          toast({ title: "Error al Cargar Productos", description: err.message, variant: "destructive" });
        })
        .finally(() => setIsLoadingProducts(false));
    } else {
      setIsLoadingProducts(false);
    }
  }, [typedUser, authLoading, toast]);

  useEffect(() => {
    if (!isDialogOpen) { 
      setEditingProductId(null); 
      setSelectedFile(null);
      setPreviewUrl(null);
      form.reset({
        name: "", category: "", description: "", price: undefined, unit: "", isActive: true, dataAiHint: ""
      });
    }
  }, [isDialogOpen, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id!);
    form.reset({
      name: product.name, category: product.category, description: product.description, price: product.price,
      unit: product.unit, isActive: product.isActive, dataAiHint: product.dataAiHint || "",
    });
    setPreviewUrl(product.imageUrl || null);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };
  
  const handleNewProductClick = () => {
    setEditingProductId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset({
      name: "", category: "", description: "", price: undefined, unit: "", isActive: true, dataAiHint: ""
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!typedUser?.uid) return;
    setIsSubmitting(true);
    try {
      const existingProduct = editingProductId ? products.find(p => p.id === editingProductId) : null;
      let finalImageUrl: string | null = existingProduct?.imageUrl || null;

      if (selectedFile) {
        toast({ title: "Subiendo imagen..." });
        const imagePath = `supplier-products/${typedUser.uid}/${editingProductId || Date.now()}/${selectedFile.name}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, selectedFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }
      
      const productDataForFirestore: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: Timestamp; createdAt?: Timestamp } = {
        supplierUid: typedUser.uid,
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        unit: data.unit,
        currency: "COP",
        isActive: data.isActive,
        imageUrl: finalImageUrl,
        dataAiHint: data.dataAiHint || null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (editingProductId) {
        const productDocRef = doc(firestore, "supplierProducts", editingProductId);
        await updateDoc(productDocRef, productDataForFirestore);
        toast({ title: "Producto Actualizado", description: `El producto "${data.name}" ha sido actualizado.` });
      } else {
        productDataForFirestore.createdAt = serverTimestamp() as Timestamp;
        await addDoc(collection(firestore, "supplierProducts"), productDataForFirestore);
        toast({ title: "Producto Añadido", description: `El producto "${data.name}" ha sido creado.` });
      }
      
      fetchSupplierProducts(typedUser.uid).then(setProducts);
      setIsDialogOpen(false); 
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirmDialog = (productId: string) => {
    setProductToDeleteId(productId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDeleteId) return;
    setIsDeletingProduct(true);
    try {
      await deleteDoc(doc(firestore, "supplierProducts", productToDeleteId));
      toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado." });
      setProducts(prev => prev.filter(p => p.id !== productToDeleteId));
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingProduct(false);
    }
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!typedUser || typedUser.role !== 'supplier') {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Esta sección es solo para proveedores.</p>
        <Button asChild className="mt-4"><Link href="/">Volver al Inicio</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestionar Mi Catálogo de Productos</h1>
        <Button variant="outline" asChild><Link href="/dashboard/supplier"><ArrowLeft size={16} className="mr-2" />Volver al Panel</Link></Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild><Button onClick={handleNewProductClick}><PlusCircle size={18} className="mr-2" /> Añadir Nuevo Producto</Button></DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>{editingProductId ? "Editar Producto" : "Añadir Nuevo Producto"}</DialogTitle><DialogDescription>Completa los detalles del producto.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-160px)] pr-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-1">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Producto</FormLabel><FormControl><Input placeholder="Ej: Cemento Gris Argos 50kg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría del Producto</FormLabel> <FormControl><Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories}> <SelectTrigger> <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Selecciona una categoría"} /> </SelectTrigger> <SelectContent> {platformCategories?.map((cat) => ( <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem> ))} </SelectContent> </Select></FormControl> <FormDescription>Selecciona la categoría que mejor describa este producto.</FormDescription> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Describe el producto, sus usos, marca, etc." rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (COP)</FormLabel><FormControl><Input type="number" placeholder="Ej: 28000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unidad</FormLabel><FormControl><Input placeholder="Ej: bulto, galón, unidad" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormItem>
                  <FormLabel>Imagen del Producto</FormLabel>
                  <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted border">
                      {previewUrl ? (
                          <Image src={previewUrl} alt="Vista previa" layout="fill" objectFit="cover" />
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
                <FormField control={form.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Pista para IA (placeholders)</FormLabel><FormControl><Input placeholder="Ej: 'bulto cemento'" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Producto Activo</FormLabel><FormDescription>Visible para los clientes.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar Producto"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteProduct} disabled={isDeletingProduct} className="bg-destructive hover:bg-destructive/90">{isDeletingProduct ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : <><Trash2 className="mr-2 h-4 w-4" /> Confirmar</>}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-primary" /> Mi Catálogo</CardTitle><CardDescription>Gestiona los productos que ofreces.</CardDescription></CardHeader>
        <CardContent>
          {isLoadingProducts && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoadingProducts && products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id} className={`bg-background ${!product.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-lg">{product.name}</CardTitle><CardDescription>{product.category}</CardDescription></div><span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{product.isActive ? 'Activo' : 'Inactivo'}</span></div></CardHeader>
                  <CardContent className="flex gap-4">
                    {product.imageUrl && <div className="hidden sm:block relative h-24 w-24 shrink-0 overflow-hidden rounded-md border"><Image src={product.imageUrl} alt={`Imagen de ${product.name}`} layout="fill" objectFit="cover" data-ai-hint={product.dataAiHint || "producto construccion"} /></div>}
                    <div className="flex-grow">
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      <p className="font-semibold">${(product.price || 0).toLocaleString('es-CO')} / {product.unit}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(product.id!)} disabled={!product.id}><Trash2 className="mr-1.5 h-4 w-4" />Eliminar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            !isLoadingProducts && <div className="text-center py-10"><Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-lg">No has añadido ningún producto.</p><p className="text-sm text-muted-foreground">Haz clic en "Añadir Nuevo Producto" para empezar a construir tu catálogo.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
