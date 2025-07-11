// src/hooks/useAuth.tsx
"use client";

import React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, deleteUser } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface AppUser extends FirebaseUser {
  role?: string;
  isApproved?: boolean; // Estado de aprobación para profesionales
  subscriptionStatus?: 'free' | 'premium';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName: string, role: string) => Promise<AppUser | null>;
  signIn: (email: string, pass: string) => Promise<AppUser | null>;
  signInWithGoogle: () => Promise<AppUser | null>;
  signOutUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  deleteCurrentUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lista de UIDs de administradores autorizados. Más seguro que por email.
// Para añadir un admin: 1. Crear una cuenta normal. 2. Obtener su UID. 3. Añadirlo aquí y redesplegar.
const ADMIN_UIDS = ['Ge7aYGTeHKfIAue6lLZRs7bXZsk2'];

function AuthProviderInternal({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
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
          
          const isUserAdminByUid = ADMIN_UIDS.includes(firebaseUser.uid);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            finalUser = {
              ...firebaseUser,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              // La verificación del UID de admin tiene prioridad absoluta.
              role: isUserAdminByUid ? 'admin' : userData.role || 'customer',
              isApproved: isUserAdminByUid ? true : userData.isApproved,
              subscriptionStatus: userData.subscriptionStatus,
            };
          } else {
            // El documento no existe, creamos un estado temporal. Se creará en BD si es necesario.
            finalUser = {
                ...firebaseUser,
                role: isUserAdminByUid ? 'admin' : 'customer',
                isApproved: isUserAdminByUid ? true : false,
            } as AppUser;
          }
          
          setUser(finalUser);
          setLoading(false);

        }, (error) => {
          console.error("Error listening to user document:", error);
          let errorUser: AppUser = firebaseUser as AppUser;
          if (ADMIN_UIDS.includes(firebaseUser.uid)) {
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

  const getRedirectPath = (role?: string) => {
    if (redirect) return redirect;
    if (role === 'admin') return '/admin/overview';
    if (role === 'professional') return '/dashboard/professional';
    if (role === 'supplier') return '/dashboard/supplier';
    return '/dashboard/customer';
  };

  const signUp = async (email: string, pass: string, fullName: string, role: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      // Un admin no puede ser creado desde el formulario de registro. 
      // Debe ser una cuenta existente cuyo UID se añade a la lista ADMIN_UIDS.
      if (role === 'admin') {
          throw new Error("El rol de administrador no se puede asignar al registrarse.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: fullName });

      const finalRole = role; // No hay verificación de admin aquí
      
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

      if (finalRole === 'professional' || finalRole === 'supplier') {
        userDocData.isApproved = false;
        if (finalRole === 'supplier') {
          userDocData.subscriptionStatus = 'free';
        }
      }

      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, userDocData);
      
      const successMessage = finalRole === 'professional' || finalRole === 'supplier'
        ? "Tu cuenta será revisada por un administrador."
        : "¡Bienvenido/a! Te has registrado con éxito.";

      toast({ title: "¡Cuenta Creada!", description: successMessage });
      
      router.push(getRedirectPath(finalRole));

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
      
      const isUserAdminByUid = ADMIN_UIDS.includes(firebaseUser.uid);
      let finalRole = 'customer';

      if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          finalRole = userData.role || 'customer';
          finalUser = { ...firebaseUser, ...userData } as AppUser;
      } else {
          console.warn(`User ${firebaseUser.uid} exists in Auth but not in Firestore. Using default role.`);
          finalUser = { ...firebaseUser, role: 'customer', isApproved: false } as AppUser;
      }
      
      if (isUserAdminByUid) {
        finalRole = 'admin';
        finalUser!.role = 'admin';
        finalUser!.isApproved = true;
      }
      
      toast({ title: "¡Sesión Iniciada!", description: "¡Bienvenido/a de nuevo!" });
      
      router.push(getRedirectPath(finalRole));
      
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

  const signInWithGoogle = async (): Promise<AppUser | null> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const userDocRef = doc(firestore, "users", googleUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let finalUser: AppUser;
      const isUserAdminByUid = ADMIN_UIDS.includes(googleUser.uid);
      let finalRole = 'customer';

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        finalRole = userData.role || 'customer';
        await updateDoc(userDocRef, {
            displayName: googleUser.displayName || userData.displayName,
            photoURL: googleUser.photoURL || userData.photoURL,
            updatedAt: serverTimestamp(),
        });
        finalUser = { ...googleUser, ...userData } as AppUser;
        toast({ title: "Sesión Iniciada", description: `¡Bienvenido/a de nuevo, ${googleUser.displayName}!` });
      } else {
        finalRole = 'customer'; // New Google users are always customers initially
        const newUserDocData: any = {
            uid: googleUser.uid,
            email: googleUser.email,
            displayName: googleUser.displayName,
            photoURL: googleUser.photoURL,
            role: finalRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserDocData);
        finalUser = { ...googleUser, ...newUserDocData } as AppUser;
        toast({ title: "¡Cuenta Creada!", description: `¡Bienvenido/a, ${googleUser.displayName}!` });
      }

      if (isUserAdminByUid) {
        finalRole = 'admin';
        finalUser.role = 'admin';
        finalUser.isApproved = true;
      }
      
      router.push(getRedirectPath(finalRole));
      
      setUser(finalUser);
      return finalUser;

    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Google sign-in popup closed by user.');
      } else {
        console.error("Error al iniciar sesión con Google:", error);
        toast({ title: "Error con Google", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
      }
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

  const deleteCurrentUserAccount = async () => {
    if (!auth.currentUser) {
        toast({ title: "No Autenticado", description: "No hay un usuario para eliminar.", variant: "destructive" });
        return;
    }

    setLoading(true);
    const userToDelete = auth.currentUser;

    try {
        // Step 1: Delete Firestore document. This is crucial to do first.
        const userDocRef = doc(firestore, "users", userToDelete.uid);
        await deleteDoc(userDocRef);

        // Step 2: Delete the user from Firebase Auth.
        await deleteUser(userToDelete);
        
        toast({ title: "Cuenta Eliminada", description: "Tu cuenta y tus datos han sido eliminados permanentemente." });
        router.push('/'); // Redirect to home after successful deletion
    
    } catch (error: any) {
        console.error("Error al eliminar la cuenta:", error);
        let description = "Ocurrió un error inesperado al intentar eliminar tu cuenta.";
        if (error.code === 'auth/requires-recent-login') {
            description = "Esta acción es sensible y requiere un inicio de sesión reciente. Por favor, cierra sesión, vuelve a iniciarla e inténtalo de nuevo.";
        }
        toast({ title: "Error al Eliminar", description, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };
  
  const value = { user, loading, signUp, signIn, signInWithGoogle, signOutUser, setUser, deleteCurrentUserAccount };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: PropsWithChildren) {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <AuthProviderInternal>{children}</AuthProviderInternal>
        </React.Suspense>
    )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
