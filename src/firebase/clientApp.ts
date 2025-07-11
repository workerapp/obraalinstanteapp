// src/firebase/clientApp.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// =========================================================================
// PASO FINAL ANTES DE PUBLICAR: CONFIGURACIÓN DE FIREBASE
// =========================================================================
// 1.  **Crea un proyecto en Firebase:** Ve a https://console.firebase.google.com/ y crea un nuevo proyecto.
// 2.  **Añade una aplicación web:**
//     - Dentro de tu proyecto, ve a "Project settings" (Configuración del proyecto) -> Pestaña "General".
//     - En la sección "Your apps" (Tus apps), haz clic en el ícono web (</>) para "Add an app" (Añadir una app).
//     - Registra tu app y Firebase te dará un objeto `firebaseConfig`.
// 3.  **Configura las variables de entorno:**
//     - En este directorio, busca un archivo llamado `.env.local`. Si no existe, créalo.
//     - Copia los valores de tu `firebaseConfig` a `.env.local`. **IMPORTANTE:** Añade el prefijo `NEXT_PUBLIC_` a cada clave.
//     - Ejemplo:
//       NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
//       NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-auth-domain"
//       ...y así sucesivamente para todas las claves.
// 4.  **Habilita los servicios de Firebase:**
//     - **Authentication:** En la consola de Firebase, ve a "Authentication" -> "Sign-in method" y habilita "Email/Password" y "Google".
//     - **Firestore:** Ve a "Firestore Database" -> "Create database". Empieza en **modo de prueba** por ahora.
//     - **Storage:** Ve a "Storage" -> "Get started". Sigue los pasos de configuración.
// 5.  **Reglas de Seguridad (¡CRÍTICO!):** Las reglas en modo de prueba expiran en 30 días. Antes de lanzar a usuarios reales, DEBES configurar reglas de seguridad adecuadas para Firestore y Storage para proteger los datos.
// =========================================================================


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);


export { app, auth, firestore, storage };
