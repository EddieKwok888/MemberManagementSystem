import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// 您的 Firebase 配置文件
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_REGION || 'us-central1');

// 控制是否使用模擬器
// 預設為 false，除非在 .env.local 中明確設置為 true
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (import.meta.env.DEV && useEmulator) {
  const { connectAuthEmulator } = await import("firebase/auth");
  const { connectFirestoreEmulator } = await import("firebase/firestore");
  const { connectFunctionsEmulator } = await import("firebase/functions");

  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  
  console.log("🚀 已連接到 Firebase 本地模擬器");
} else {
  console.log("☁️ 已連接到 Firebase 雲端環境");
}

export default app;

