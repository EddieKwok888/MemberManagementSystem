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

async function createTestUser() {
  const email = 'test@vexperthk.com';
  const displayName = '測試會員';
  
  console.log(`🚀 開始創建/恢復測試會員帳號: ${email}...`);
  
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`✅ 找到現有帳號: ${email} (UID: ${userRecord.uid})`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: email,
        password: '123456',
        displayName: displayName,
        emailVerified: true
      });
      console.log(`✅ 成功創建帳號: ${email} (UID: ${userRecord.uid})`);
    } else {
      throw error;
    }
  }

  // 1. 設置 Auth Custom Claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'member' });

  // 2. 設置 Firestore 文檔
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email,
    displayName: displayName,
    realName: displayName,
    role: 'member',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`🎉 測試會員 ${email} 已成功創建並啟用！`);
}

createTestUser().catch(console.error);
