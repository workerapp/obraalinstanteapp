// src/app/dashboard/profile/page.tsx
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No redirigir hasta que el estado de autenticación esté resuelto.
    if (authLoading) {
      return;
    }

    if (!user) {
      // Si no hay usuario, redirigir a la página de inicio de sesión.
      router.replace('/sign-in');
      return;
    }

    // Determinar la ruta de redirección del perfil basada en el rol.
    let redirectPath = '/dashboard/customer/profile'; // Ruta por defecto para clientes.
    if (user.role === 'admin') {
      // El admin no tiene una página de perfil pública, lo llevamos a su panel.
      redirectPath = '/admin/overview';
    } else if (user.role === 'handyman') {
      redirectPath = '/dashboard/professional/profile';
    } else if (user.role === 'supplier') {
      redirectPath = '/dashboard/supplier/profile';
    }
    
    // Realizar la redirección.
    router.replace(redirectPath);

  }, [user, authLoading, router]);

  // Muestra un indicador de carga mientras se procesa la lógica.
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] space-y-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-muted-foreground">Cargando tu perfil...</p>
    </div>
  );
}
