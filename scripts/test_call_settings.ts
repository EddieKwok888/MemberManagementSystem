import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`找不到 admin-key.json`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

// 獲取 API Key，優先從環境變量讀取，其次從 web/.env.local 讀取
function getApiKey(): string {
  if (process.env.VITE_FIREBASE_API_KEY) {
    return process.env.VITE_FIREBASE_API_KEY;
  }
  
  const envPath = path.resolve(__dirname, '../web/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_FIREBASE_API_KEY\s*=\s*(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  console.error("❌ 錯誤：未在環境變量或 web/.env.local 中找到 VITE_FIREBASE_API_KEY");
  process.exit(1);
}

async function testCall() {
  const email = 'eddie@vexperthk.com';
  console.log(`🔑 正在為 ${email} 產生 Custom Token...`);
  
  const user = await auth.getUserByEmail(email);
  const customToken = await auth.createCustomToken(user.uid, { role: 'admin' });
  
  console.log(`🔄 正在向 Google Identity Toolkit 交換 ID Token...`);
  const apiKey = getApiKey();
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
  
  const response = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  
  const tokenData = await response.json();
  if (!tokenData.idToken) {
    console.error("❌ 無法獲取 ID Token:", tokenData);
    return;
  }
  
  const idToken = tokenData.idToken;
  console.log(`🌐 正在調用線上 Cloud Function updateSystemSettings...`);
  
  const functionUrl = `https://us-central1-vexperthk-member-system.cloudfunctions.net/updateSystemSettings`;
  
  const callResponse = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        maintenanceMode: false,
        adminAlertEmail: 'admin@vexperthk.com',
        allowPublicRegistration: true,
        defaultMemberStatus: 'active'
      }
    })
  });
  
  const textResult = await callResponse.text();
  console.log(`\n📬 函數回應狀態碼: ${callResponse.status}`);
  console.log(`📬 函數回應內容:`, textResult);
}

testCall().catch(console.error);
