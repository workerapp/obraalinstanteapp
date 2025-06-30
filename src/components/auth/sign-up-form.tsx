// src/components/auth/sign-up-form.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  role: z.enum(["customer", "handyman", "supplier"], { required_error: "Por favor, selecciona un rol." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"], 
});

type FormData = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const { signUp, loading: authLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "customer",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await signUp(data.email, data.password, data.fullName, data.role);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo / Nombre de Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez o Ferretería El Tornillo Feliz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Registrarse como:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="customer" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Cliente (Buscando servicios o productos)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="handyman" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Operario (Ofreciendo servicios)
                    </FormLabel>
                  </FormItem>
                   <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="supplier" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Proveedor (Ofreciendo productos/materiales)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={authLoading} className="w-full">
          {authLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando Cuenta...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </Button>
      </form>
    </Form>
  );
}
