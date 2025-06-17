
// src/hooks/useAuth.tsx
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
            photoURL: userData.photoURL || firebaseUser.photoURL, // Ensure photoURL is also loaded
            role: userData.role,
          });
        } else {
          // If no Firestore doc, use Firebase Auth data directly (might happen during signUp before Firestore doc is fully set)
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

      // Initial Firestore document for the user
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        role: role,
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        // Initialize other profile fields as null or empty as appropriate for handymen
        tagline: null,
        skills: [],
        location: null,
        phone: null,
        photoURL: null, // Initially no photoURL from Firestore
      });
      
      console.log('Usuario registrado y datos guardados en Firestore:', userCredential.user.uid, 'Nombre:', fullName, 'Rol:', role);
      toast({ title: "¡Cuenta Creada!", description: "¡Bienvenido/a! Te has registrado con éxito." });
      
      const appUser: AppUser = {
        ...userCredential.user,
        displayName: fullName, // From Firebase Auth profile update
        photoURL: userCredential.user.photoURL, // From Firebase Auth profile (likely null initially)
        role: role,
      };
      setUser(appUser); // Update context state
      router.push(role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer'); 
      return appUser;
    } catch (error: any) {
      console.error("Error al registrarse:", error);
      toast({ title: "Falló el Registro", description: error.message || "Por favor, inténtalo de nuevo.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle fetching Firestore data and setting the user state
      toast({ title: "¡Sesión Iniciada!", description: "¡Bienvenido/a de nuevo!" });
      
      // We still need to determine role for redirection immediately after sign-in
      // as onAuthStateChanged might take a moment
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let role = 'customer'; 
      if (userDocSnap.exists()) {
        role = userDocSnap.data().role || 'customer';
      }
      
      router.push(role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer');
      // The user state will be updated by onAuthStateChanged listener
      return userCredential.user as AppUser; // Cast for return type, actual full AppUser from context
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
  
  const value = { user, loading, signUp, signIn, signOutUser, setUser }; // Add setUser to context

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

