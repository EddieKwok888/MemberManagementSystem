import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`找不到 admin-key.json`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function diagnose() {
  const email = 'admin@vexperthk.com';
  console.log(`🔍 正在診斷雲端專案中用戶: ${email} 的權限狀態...`);

  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`\n👥 1. Auth 帳戶資訊:`);
    console.log(`   - UID: ${userRecord.uid}`);
    console.log(`   - Email: ${userRecord.email}`);
    console.log(`   - DisplayName: ${userRecord.displayName}`);
    console.log(`   - Disabled: ${userRecord.disabled}`);
    console.log(`   - Custom Claims:`, userRecord.customClaims);

    console.log(`\n📄 2. Firestore 用戶文檔資訊:`);
    const docRef = db.collection('users').doc(userRecord.uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      console.log(`   - 文檔存在！`);
      console.log(`   - 內容:`, docSnap.data());
    } else {
      console.log(`   - ❌ 錯誤：在 Firestore 的 'users' 集合中找不到該 UID (${userRecord.uid}) 的文檔！`);
    }
  } catch (err: any) {
    console.error(`❌ 診斷出錯:`, err.message);
  }
}

diagnose().catch(console.error);
