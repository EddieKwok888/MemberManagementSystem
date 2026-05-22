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

async function listUsers() {
  console.log("🔍 獲取雲端 Auth 中的所有用戶...");
  const authResult = await auth.listUsers();
  console.log(`Auth 中共有 ${authResult.users.length} 個用戶:`);
  for (const u of authResult.users) {
    console.log(`- Email: ${u.email}, UID: ${u.uid}, Claims:`, u.customClaims);
  }

  console.log("\n🔍 獲取雲端 Firestore 中的所有用戶文檔...");
  const usersSnap = await db.collection('users').get();
  console.log(`Firestore 'users' 集合中共有 ${usersSnap.size} 個文檔:`);
  usersSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}, Email: ${doc.data().email}, Role: ${doc.data().role}, Status: ${doc.data().status}`);
  });
}

listUsers().catch(console.error);
