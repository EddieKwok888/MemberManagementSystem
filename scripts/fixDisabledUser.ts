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

async function fixDisabledUser() {
  const email = 'disable@vexperthk.com';
  const displayName = '停用測試會員';
  
  console.log(`🚀 開始修復停用測試會員帳號: ${email}...`);
  
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`✅ 找到現有 Auth 帳號: ${email} (UID: ${userRecord.uid})`);
    
    // 更新 Auth 帳號：確保其為啟用狀態 (disabled: false)，以便能成功通過 Auth 登入，並確保密碼為 123456
    await auth.updateUser(userRecord.uid, {
      disabled: false,
      password: '123456'
    });
    console.log(`✅ 已將 Auth 中的該用戶設定為「啟用」狀態，並重設密碼為 123456`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: email,
        password: '123456',
        displayName: displayName,
        emailVerified: true,
        disabled: false // Auth 層級必須是啟用的，才能完成 signIn
      });
      console.log(`✅ Auth 中無此帳號，已成功創建: ${email} (UID: ${userRecord.uid})`);
    } else {
      throw error;
    }
  }

  // 1. 設置 Auth Custom Claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'member' });
  console.log(`🔑 寫入 Custom Claim 成功: { role: 'member' }`);

  // 2. 設置 Firestore 文檔的狀態為 'disabled'
  // 這會讓該用戶在成功通過 Auth 登入後，在前端 ProtectiveRoute 被判斷為已停用，進而顯示停用畫面
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email,
    displayName: displayName,
    realName: displayName,
    role: 'member',
    status: 'disabled', // Firestore 狀態設定為停用
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`🎉 停用測試會員 ${email} 已成功修復！`);
  console.log(`👉 Auth 層級：已啟用 (允許登入，密碼 123456)`);
  console.log(`👉 Firestore 層級：已停用 (status: 'disabled'，會觸發前端停用畫面)`);
}

fixDisabledUser().catch(console.error);
