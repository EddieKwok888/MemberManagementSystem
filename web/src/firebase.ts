import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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

console.log("=== Firebase Debug Info ===");
console.log("useEmulator:", import.meta.env.DEV ? import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false' : import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true');
console.log("VITE_FIREBASE_PROJECT_ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("VITE_USE_FIREBASE_EMULATOR:", import.meta.env.VITE_USE_FIREBASE_EMULATOR);
console.log("import.meta.env.DEV:", import.meta.env.DEV);
console.log("===========================");

// 在本地開發 (DEV) 模式下，除非在環境變量中明確設置 VITE_USE_FIREBASE_EMULATOR=false，否則預設強制啟用模擬器連線以確保安全。
const useEmulator = import.meta.env.DEV 
  ? import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false'
  : import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator) {
  // 使用同步導入確保模擬器連線在任何 auth 操作之前已完成
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  
  console.log("🚀 已連接到 Firebase 本地模擬器");
} else {
  console.log("☁️ 已連接到 Firebase 雲端環境");
}

export default app;
