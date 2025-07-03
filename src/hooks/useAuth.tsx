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

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'default-admin-email@example.com'; 

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
          
          const isUserAdminByEmail = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            finalUser = {
              ...firebaseUser,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              // La verificación del email de admin tiene prioridad absoluta.
              role: isUserAdminByEmail ? 'admin' : userData.role || 'customer',
              isApproved: isUserAdminByEmail ? true : userData.isApproved,
            };
          } else {
            // El documento no existe, así que lo creamos si es necesario, o usamos datos base.
            finalUser = {
                ...firebaseUser,
                role: isUserAdminByEmail ? 'admin' : 'customer',
                isApproved: isUserAdminByEmail ? true : false,
            } as AppUser;
          }
          
          setUser(finalUser);
          setLoading(false);

        }, (error) => {
          console.error("Error listening to user document:", error);
          let errorUser: AppUser = firebaseUser as AppUser;
          if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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
        updatedAt: serverTimestamp(),
        tagline: null,
        aboutMe: null,
        skills: [],
        location: null,
        phone: null,
        photoURL: null,
      };

      // Add isApproved field only for roles that need it.
      if (finalRole === 'handyman' || finalRole === 'supplier') {
        userDocData.isApproved = false;
      } else if (finalRole === 'admin') {
        userDocData.isApproved = true;
      }
      // For 'customer', the field is simply not added.

      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, userDocData);
      
      const successMessage = finalRole === 'handyman' || finalRole === 'supplier'
        ? "Tu cuenta será revisada por un administrador."
        : "¡Bienvenido/a! Te has registrado con éxito.";

      toast({ title: "¡Cuenta Creada!", description: successMessage });
      
      const redirectPath = finalRole === 'admin' ? '/admin/overview'
                         : finalRole === 'handyman' ? '/dashboard/handyman'
                         : finalRole === 'supplier' ? '/dashboard/supplier'
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
    } finally {
        setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AppUser | null> => {
    setLoading(true);
    let finalUser: AppUser | null = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      const isUserAdminByEmail = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      let finalRole = 'customer'; // Default role

      if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          finalRole = userData.role || 'customer';
          finalUser = { ...firebaseUser, ...userData } as AppUser;
      } else {
          // This handles an edge case where a user exists in Auth but not in Firestore.
          // We create a default Firestore document for them.
          console.warn(`User ${firebaseUser.uid} exists in Auth but not in Firestore. Creating default document.`);
          finalRole = isUserAdminByEmail ? 'admin' : 'customer';
          const defaultDocData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: finalRole,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
          };
          await setDoc(userDocRef, defaultDocData, { merge: true });
          finalUser = { ...firebaseUser, ...defaultDocData } as AppUser;
      }
      
      // Override role if it's the admin email, ensuring it has precedence.
      if (isUserAdminByEmail) {
        finalRole = 'admin';
        finalUser!.role = 'admin';
        finalUser!.isApproved = true;
      }
      
      toast({ title: "¡Sesión Iniciada!", description: "¡Bienvenido/a de nuevo!" });
      
      const redirectPath = finalRole === 'admin' ? '/admin/overview'
                         : finalRole === 'handyman' ? '/dashboard/handyman'
                         : finalRole === 'supplier' ? '/dashboard/supplier'
                         : '/dashboard/customer';
      router.push(redirectPath);
      
      setUser(finalUser);
      return finalUser;

    } catch (error: any) {
        console.error("Error al iniciar sesión:", error);
        let errorMessage = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = "El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus credenciales.";
        }
        toast({ title: "Falló el Inicio de Sesión", description: errorMessage, variant: "destructive" });
        setUser(null);
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
