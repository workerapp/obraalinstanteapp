// src/components/auth/sign-in-form.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type FormData = z.infer<typeof formSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.94C34.311 4.931 29.414 2.5 24 2.5C11.31 2.5 2.5 11.31 2.5 24s8.81 21.5 21.5 21.5c11.191 0 20.229-8.497 21.319-19.534c.14-1.258.211-2.518.211-3.882c0-1.844-.159-3.626-.459-5.331Z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691c-1.332 2.625-2.079 5.549-2.079 8.618C4.227 26.26 5.026 29.02 6.306 31.489l-4.14-3.153C1.247 25.845.833 24.935.833 24s.414-1.845 1.333-3.336l4.14 3.027Z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.414 0 10.311-2.431 14.802-6.44l-4.141-3.153c-2.488 1.839-5.64 2.946-9.131 2.946c-5.22 0-9.651-3.344-11.303-7.962l-4.27 3.064C8.952 39.58 15.86 45.5 24 45.5Z"
      />
      <path
        fill="#1976D2"
        d="M44.045 20.083L43.611 20.083h-.002L43.611 20.083c-.09-.675-.192-1.336-.312-1.989l-5.696-4.41c-1.126 1.13-2.146 2.368-3.06 3.739l5.52 4.298C42.434 21.432 43.327 20.61 44.045 20.083Z"
      />
    </svg>
  );
}

export default function SignInForm() {
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await signIn(data.email, data.password);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={authLoading} className="w-full">
            {authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando Sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
        </div>
      </div>
      
      <Button variant="outline" type="button" className="w-full" onClick={signInWithGoogle} disabled={authLoading}>
        {authLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        Continuar con Google
      </Button>
    </div>
  );
}