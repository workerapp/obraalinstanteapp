// src/hooks/useAuth.tsx
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, type PropsWithChildren } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/firebase/clientApp'; // Using auth instance from clientApp
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName?: string, role?: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, fullName?: string, role?: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // TODO: Here you would typically save fullName and role to Firestore associated with userCredential.user.uid
      console.log('User signed up:', userCredential.user.uid, 'Name:', fullName, 'Role:', role);
      toast({ title: "Account Created!", description: "Welcome! You have successfully signed up." });
      setUser(userCredential.user);
      // Redirect or perform other actions as needed
      router.push('/dashboard'); 
      return userCredential.user;
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({ title: "Sign Up Failed", description: error.message || "Please try again.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed In!", description: "Welcome back!" });
      setUser(userCredential.user);
      // Redirect or perform other actions as needed
      router.push('/dashboard');
      return userCredential.user;
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
      router.push('/'); // Redirect to home page after sign out
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
