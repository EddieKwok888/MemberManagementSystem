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

const adminEmails = [
  { email: 'admin@vexperthk.com', displayName: 'Admin' },
  { email: 'eddie@vexperthk.com', displayName: 'Eddie Kwok' },
  { email: 'aieddie0310@gmail.com', displayName: 'Eddie AI' }
];

async function setupAdmins() {
  console.log("🚀 開始設置雲端管理員帳號...");

  for (const adminUser of adminEmails) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminUser.email);
      console.log(`✅ 找到現有帳號: ${adminUser.email} (UID: ${userRecord.uid})`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`➕ 帳號不存在，正在創建: ${adminUser.email}`);
        userRecord = await auth.createUser({
          email: adminUser.email,
          password: '123456',
          displayName: adminUser.displayName,
          emailVerified: true
        });
        console.log(`✅ 成功創建帳號: ${adminUser.email} (UID: ${userRecord.uid})`);
      } else {
        throw error;
      }
    }

    // 1. 設置 Auth Custom Claims
    console.log(`   - 正在設置 Auth Custom Claims: { role: 'admin' }...`);
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // 2. 設置 Firestore 文檔
    console.log(`   - 正在設置 Firestore 文檔 'users/${userRecord.uid}'...`);
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminUser.email,
      displayName: adminUser.displayName,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`🎉 ${adminUser.email} 已成功設置為管理員！\n`);
  }

  console.log("✨ 所有管理員帳號設置完畢！");
}

setupAdmins().catch(console.error);
