/**
 * seed_test_accounts.ts
 * 
 * Creates test accounts in the Firebase Auth + Firestore Emulators for Quick Login.
 * Run with: npx ts-node seed_test_accounts.ts
 * 
 * Strategy: After createUser(), wait 3s for onUserCreated Cloud Function trigger to 
 * finish writing role:'member', then overwrite with the correct role via Firestore update.
 */

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'vexperthk-member-system' });
}

const db = admin.firestore();
const auth = admin.auth();

const testAccounts = [
  {
    email: 'admin@vexperthk.com',
    password: '123456',
    displayName: '系統管理員',
    role: 'admin' as const,
    status: 'active',
  },
  {
    email: 'test@vexperthk.com',
    password: '123456',
    displayName: '測試會員',
    role: 'member' as const,
    status: 'active',
  },
];

async function seedAccounts() {
  console.log('🌱 開始建立測試帳戶...\n');

  for (const account of testAccounts) {
    try {
      // 1. 嘗試刪除已存在的帳戶（避免重複建立錯誤）
      try {
        const existing = await auth.getUserByEmail(account.email);
        await auth.deleteUser(existing.uid);
        console.log(`  🗑  已刪除舊帳戶: ${account.email}`);
      } catch {
        // 帳戶不存在，無需刪除
      }

      // 2. 在 Auth 中建立帳戶（此操作會觸發 onUserCreated Cloud Function，預設寫入 role:'member'）
      const userRecord = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true,
      });

      console.log(`  ✅ Auth 帳戶已建立: ${account.email} (uid: ${userRecord.uid})`);

      // 3. 等待 3 秒讓 onUserCreated Cloud Function 完成執行（它會寫入 role:'member'）
      console.log(`  ⏳ 等待 Cloud Function 觸發器完成...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 4. 覆寫 Firestore 文件，設定正確的角色（覆蓋 Cloud Function 的預設 member 角色）
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: account.email,
        displayName: account.displayName,
        realName: account.displayName,
        role: account.role,
        status: account.status,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`  📄 Firestore 角色已覆寫: role = ${account.role}`);

      // 5. 設置 Custom Claims (role) - 覆寫 Cloud Function 設置的預設 claims
      await auth.setCustomUserClaims(userRecord.uid, { role: account.role });
      console.log(`  🔑 Custom Claims 已設定: role = ${account.role}`);
      console.log(`  ── 角色: ${account.role}, 狀態: ${account.status}\n`);

    } catch (err: any) {
      console.error(`  ❌ 建立帳戶失敗 (${account.email}):`, err.message);
    }
  }

  console.log('🚀 所有測試帳戶建立完成！');
  console.log('');
  console.log('可用的快速登入帳號：');
  console.log('  👑 管理員: admin@vexperthk.com / 123456');
  console.log('  👤 一般會員: test@vexperthk.com / 123456');
}

seedAccounts().catch(console.error);
