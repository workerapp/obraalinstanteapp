// src/hooks/useAuth.tsx
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp'; // Using auth and firestore instance from clientApp
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface AppUser extends FirebaseUser {
  role?: string;
  // displayName is already part of FirebaseUser, but we ensure it's populated from Firestore if needed
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName: string, role: string) => Promise<AppUser | null>;
  signIn: (email: string, pass: string) => Promise<AppUser | null>;
  signOutUser: () => Promise<void>;
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
            displayName: userData.displayName || firebaseUser.displayName, // Prioritize Firestore data
            role: userData.role,
          });
        } else {
          // User exists in Auth but not in Firestore (e.g., imported users, or if Firestore write failed during signup)
          // We could create a Firestore entry here if needed, or just use Auth data
          setUser(firebaseUser); 
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
      
      // Update Firebase Auth profile (optional, but good practice)
      await updateProfile(userCredential.user, { displayName: fullName });

      // Save additional user info (including role) to Firestore
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        role: role,
        createdAt: new Date().toISOString(), // Good practice to store creation date
      });
      
      console.log('User signed up and data stored in Firestore:', userCredential.user.uid, 'Name:', fullName, 'Role:', role);
      toast({ title: "Account Created!", description: "Welcome! You have successfully signed up." });
      
      const appUser: AppUser = {
        ...userCredential.user,
        displayName: fullName,
        role: role,
      };
      setUser(appUser);
      router.push(role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer'); 
      return appUser;
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: "Sign Up Failed", description: error.message || "Please try again.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AppUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // User data including role will be fetched by onAuthStateChanged listener
      toast({ title: "Signed In!", description: "Welcome back!" });
      
      // We need to fetch role to redirect correctly immediately after sign-in
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let role = 'customer'; // Default role
      let displayName = userCredential.user.displayName;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        role = userData.role || role;
        displayName = userData.displayName || displayName;
      }
      
      const appUser: AppUser = {
        ...userCredential.user,
        displayName: displayName,
        role: role,
      };
      setUser(appUser); 
      router.push(role === 'handyman' ? '/dashboard/handyman' : '/dashboard/customer');
      return appUser;
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: "Sign In Failed", description: error.message || "Invalid credentials. Please try again.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      setUser(null);
      router.push('/'); 
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const value = { user, loading, signUp, signIn, signOutUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
