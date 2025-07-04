// src/firebase/clientApp.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);


export { app, auth, firestore }; 

// IMPORTANT:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Go to Project settings > General tab.
// 3. Under "Your apps", click the Web icon (</>) to "Add an app" if you haven't already.
// 4. Register your app and copy the firebaseConfig object.
// 5. Create a .env.local file in the root of your project.
// 6. Add your Firebase config values to .env.local, prefixed with NEXT_PUBLIC_
//    Example:
//    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
//    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
//    ...and so on for all keys in firebaseConfig.
// 7. Ensure .env.local is in your .gitignore file to keep your credentials secure.
// 8. Enable Firestore in your Firebase project console (Build > Firestore Database > Create database - start in test mode for now).
// 9. Enable Firebase Storage in your Firebase project console (Build > Storage > Get started - set up rules).
