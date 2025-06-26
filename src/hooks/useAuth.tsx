
// src/hooks/useAuth.tsx
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface AppUser extends FirebaseUser {
  role?: string;
  isApproved?: boolean; // Estado de aprobación para operarios
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName: string, role: string) => Promise<AppUser | null>;
  signIn: (email: string, pass: string) => Promise<AppUser | null>;
  signOutUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'workeraplicationservices@gmail.com'; 

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeFromUserDoc: (() => void) | null = null;

    const unsubscribeFromAuthState = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeFromUserDoc) {
        unsubscribeFromUserDoc();
        unsubscribeFromUserDoc = null;
      }

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        unsubscribeFromUserDoc = onSnapshot(userDocRef, (userDocSnap) => {
          let finalUser: AppUser;

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            finalUser = {
              ...firebaseUser,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              role: userData.role,
              isApproved: userData.isApproved,
            };
          } else {
            // Document doesn't exist yet, use base Firebase user
            finalUser = firebaseUser as AppUser;
          }

          // **ROBUSTNESS FIX**: If user has no role but matches the admin email, grant admin role.
          // This acts as a failsafe if the Firestore doc is slow to create or has issues.
          if (!finalUser.role && finalUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            finalUser.role = 'admin';
            finalUser.isApproved = true;
          }
          
          setUser(finalUser);
          setLoading(false);

        }, (error) => {
          console.error("Error listening to user document:", error);
          // On error, still apply the admin failsafe
          let errorUser: AppUser = firebaseUser as AppUser;
          if (errorUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            errorUser.role = 'admin';
            errorUser.isApproved = true;
          }
          setUser(errorUser);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuthState();
      if (unsubscribeFromUserDoc) {
        unsubscribeFromUserDoc();
      }
    };
  }, []);

  const signUp = async (email: string, pass: string, fullName: string, role: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: fullName });

      const isUserAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const finalRole = isUserAdmin ? 'admin' : role;
      
      const userDocData: any = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        role: finalRole,
        createdAt: serverTimestamp(),
        tagline: null,
        aboutMe: null,
        skills: [],
        location: null,
        phone: null,
        photoURL: null,
        isApproved: finalRole === 'handyman' ? false : (finalRole === 'admin' ? true : undefined),
      };

      if (userDocData.isApproved === undefined) {
        delete userDocData.isApproved;
      }

      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, userDocData);
      
      const successMessage = finalRole === 'handyman' 
        ? "Tu cuenta será revisada por un administrador."
        : "¡Bienvenido/a! Te has registrado con éxito.";

      toast({ title: "¡Cuenta Creada!", description: successMessage });
      
      const redirectPath = finalRole === 'admin' ? '/admin/overview'
                         : finalRole === 'handyman' ? '/dashboard/handyman'
                         : '/dashboard/customer';
      router.push(redirectPath);

      const userDoc = await getDoc(userDocRef);
      return { ...userCredential.user, ...userDoc.data() } as AppUser;

    } catch (error: any) {
      console.error("Error al registrarse:", error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? "Este correo electrónico ya está en uso. Por favor, intenta con otro o inicia sesión."
        : error.message || "Ocurrió un error inesperado.";
      toast({ title: "Falló el Registro", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const signIn = async (email: string, pass: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userRole = 'customer';
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userRole = userData.role || 'customer';
      }
      
      const finalRole = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : userRole;
      
      toast({ title: "¡Sesión Iniciada!", description: "¡Bienvenido/a de nuevo!" });
      
      const redirectPath = finalRole === 'admin' ? '/admin/overview'
                         : finalRole === 'handyman' ? '/dashboard/handyman'
                         : '/dashboard/customer';
      router.push(redirectPath);
      
      const userDoc = await getDoc(userDocRef);
      return { ...firebaseUser, ...userDoc.data() } as AppUser;

    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      toast({ title: "Falló el Inicio de Sesión", description: "Credenciales inválidas o error inesperado.", variant: "destructive" });
      setUser(null);
      setLoading(false);
      return null;
    } 
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Falló el Cierre de Sesión", description: error.message || "Por favor, inténtalo de nuevo.", variant: "destructive" });
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
