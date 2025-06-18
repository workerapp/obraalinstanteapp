
// src/hooks/useAuth.tsx
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface AppUser extends FirebaseUser {
  role?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName: string, role: string) => Promise<AppUser | null>;
  signIn: (email: string, pass: string) => Promise<AppUser | null>;
  signOutUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>; // Expose setUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define el correo del administrador aquí.
const ADMIN_EMAIL = 'workeraplicationservices@gmail.com'; 

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            ...firebaseUser,
            displayName: userData.displayName || firebaseUser.displayName,
            photoURL: userData.photoURL || firebaseUser.photoURL,
            role: userData.role,
          });
        } else {
          setUser(firebaseUser as AppUser); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, fullName: string, role: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: fullName });

      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        role: email === ADMIN_EMAIL ? 'admin' : role, // Asignar rol 'admin' si el email coincide
        createdAt: serverTimestamp(),
        tagline: null,
        aboutMe: null, // Initialize aboutMe field
        skills: [],
        location: null,
        phone: null,
        photoURL: null,
      });
      
      console.log('Usuario registrado y datos guardados en Firestore:', userCredential.user.uid, 'Nombre:', fullName, 'Rol:', email === ADMIN_EMAIL ? 'admin' : role);
      toast({ title: "¡Cuenta Creada!", description: "¡Bienvenido/a! Te has registrado con éxito." });
      
      const appUser: AppUser = {
        ...userCredential.user,
        displayName: fullName,
        photoURL: userCredential.user.photoURL,
        role: email === ADMIN_EMAIL ? 'admin' : role,
      };
      setUser(appUser);
      
      if (email === ADMIN_EMAIL) {
        router.push('/admin/overview');
      } else {
        router.push(role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer'); 
      }
      return appUser;
    } catch (error: any) {
      console.error("Error al registrarse:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({ 
          title: "Falló el Registro", 
          description: "Este correo electrónico ya está en uso. Por favor, intenta con otro o inicia sesión si ya tienes una cuenta.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Falló el Registro", 
          description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.", 
          variant: "destructive" 
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userRole = 'customer'; // default role
      let userDisplayName = firebaseUser.displayName;
      let userPhotoURL = firebaseUser.photoURL;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userRole = userData.role || 'customer';
        userDisplayName = userData.displayName || firebaseUser.displayName;
        userPhotoURL = userData.photoURL || firebaseUser.photoURL;
      }
      
      const appUser: AppUser = {
        ...firebaseUser,
        displayName: userDisplayName,
        photoURL: userPhotoURL,
        role: email === ADMIN_EMAIL ? 'admin' : userRole, // Prioritize admin role by email
      };
      setUser(appUser); // Update context user
      
      toast({ title: "¡Sesión Iniciada!", description: "¡Bienvenido/a de nuevo!" });
      
      if (appUser.email === ADMIN_EMAIL) {
        router.push('/admin/overview');
      } else {
        router.push(appUser.role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer');
      }
      return appUser;
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      toast({ title: "Falló el Inicio de Sesión", description: error.message || "Credenciales inválidas. Por favor, inténtalo de nuevo.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      setUser(null);
      router.push('/'); 
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Falló el Cierre de Sesión", description: error.message || "Por favor, inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const value = { user, loading, signUp, signIn, signOutUser, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

