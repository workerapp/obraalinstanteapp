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
// GUÍA DE CONFIGURACIÓN FINAL DE FIREBASE (¡IMPORTANTE!)
// =========================================================================
// Para que la aplicación funcione, necesitas conectar tu propio proyecto de Firebase.
// Sigue estos pasos:
//
// 1.  **Crea un proyecto en Firebase:**
//     - Ve a https://console.firebase.google.com/ y crea un nuevo proyecto.
//
// 2.  **Añade una aplicación web a tu proyecto:**
//     - Dentro de tu proyecto, ve a "Project settings" (el ícono de engranaje).
//     - En la pestaña "General", baja hasta "Your apps" (Tus apps).
//     - Haz clic en el ícono web `</>` para "Add an app" (Añadir una app).
//     - Dale un nombre a tu app y regístrala. Firebase te mostrará un objeto `firebaseConfig`.
//
// 3.  **Configura las variables de entorno:**
//     - En el explorador de archivos a la izquierda, busca o crea un archivo llamado `.env.local` en la raíz del proyecto.
//     - Copia las claves de tu `firebaseConfig` a ese archivo.
//     - **CRÍTICO:** Añade `NEXT_PUBLIC_` al inicio de cada nombre de clave.
//
//     - Ejemplo de cómo debe quedar tu archivo `.env.local`:
//       NEXT_PUBLIC_FIREBASE_API_KEY="TU_VALOR_DE_API_KEY"
//       NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="TU_VALOR_DE_AUTH_DOMAIN"
//       NEXT_PUBLIC_FIREBASE_PROJECT_ID="TU_VALOR_DE_PROJECT_ID"
//       NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="TU_VALOR_DE_STORAGE_BUCKET"
//       NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_VALOR_DE_MESSAGING_SENDER_ID"
//       NEXT_PUBLIC_FIREBASE_APP_ID="TU_VALOR_DE_APP_ID"
//
// 4.  **Habilita los servicios de Firebase en la consola:**
//     - **Authentication:** Ve a "Build" -> "Authentication" -> "Sign-in method". Habilita "Email/Password" y "Google".
//     - **Firestore:** Ve a "Build" -> "Firestore Database" -> "Create database". Empieza en **modo de prueba**.
//     - **Storage:** Ve a "Build" -> "Storage" -> "Get started". Sigue los pasos y usa la configuración por defecto.
//
// 5.  **¡Listo!** Con esto, tu app debería funcionar correctamente.
//
// **NOTA DE SEGURIDAD:** El "modo de prueba" de Firestore caduca en 30 días.
// Antes de que tu app sea usada por personas reales, DEBES configurar reglas de seguridad
// adecuadas para proteger los datos de tus usuarios.
// =========================================================================


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);


export { app, auth, firestore, storage };
