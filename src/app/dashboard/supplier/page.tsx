// src/app/dashboard/supplier/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Package, Settings, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useAuth, type AppUser } from '@/hooks/useAuth';

export default function SupplierDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const typedUser = user as AppUser | null;

    if (authLoading) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (!typedUser && !authLoading) {
        return <div className="text-center py-10"><h1 className="text-2xl font-bold">Acceso Denegado</h1><p className="text-muted-foreground">Debes iniciar sesión como proveedor para ver este panel.</p><Button asChild className="mt-4"><Link href="/sign-in">Iniciar Sesión</Link></Button></div>;
    }
    
    if (typedUser && typedUser.role !== 'supplier' && !authLoading) {
        return <div className="text-center py-10"><h1 className="text-2xl font-bold">Acceso Denegado</h1><p className="text-muted-foreground">Esta sección es solo para proveedores.</p><Button asChild className="mt-4"><Link href="/dashboard/customer">Ir al Panel de Cliente</Link></Button></div>;
    }

    if (typedUser && typedUser.role === 'supplier' && typedUser.isApproved !== true) {
        return (
            <div className="max-w-2xl mx-auto py-10 text-center">
                <Card className="shadow-lg">
                    <CardHeader>
                        <UserCog className="mx-auto h-12 w-12 text-primary mb-4" />
                        <CardTitle className="text-2xl font-headline">Cuenta de Proveedor en Revisión</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground">
                            Gracias por registrarte como proveedor. Tu perfil está siendo revisado por nuestro equipo.
                        </p>
                        <p className="text-muted-foreground">
                            Recibirás una notificación por correo electrónico una vez que tu cuenta sea aprobada. Mientras tanto, puedes ir completando tu perfil público.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full" disabled>
                            <Link href="/dashboard/supplier/profile">Completar Mi Perfil (Próximamente)</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-background rounded-lg shadow-md">
                <Package className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-4xl font-headline font-bold text-primary mb-2">Panel de Proveedor</h1>
                <p className="text-lg text-foreground/80 max-w-xl mx-auto">Gestiona tus productos, cotizaciones y perfil de empresa.</p>
            </section>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="text-accent"/>Mis Productos</CardTitle>
                        <CardDescription>Gestiona el catálogo de productos que ofreces.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Añade nuevos productos, actualiza precios y gestiona tu inventario.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full" disabled>
                            <Link href="/dashboard/supplier/products">Gestionar Productos (Próximamente)</Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings className="text-muted-foreground"/>Perfil y Configuración</CardTitle>
                        <CardDescription>Actualiza el perfil público de tu empresa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Mantén tu información actualizada para los clientes.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full" disabled>
                            <Link href="/dashboard/supplier/profile">Editar Perfil (Próximamente)</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
