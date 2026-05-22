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

const securityRules = admin.securityRules();

async function deploy() {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    console.error("找不到 firestore.rules 檔案！");
    process.exit(1);
  }

  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
  console.log("☁️ 讀取本地 firestore.rules 成功...");
  
  console.log("🚀 正在通過 Admin SDK 發布 Firestore 安全規則到雲端專案...");
  try {
    const ruleset = await securityRules.releaseFirestoreRulesetFromSource(rulesContent);
    console.log("🎉 Firestore 安全規則已成功發布到雲端！Ruleset Name:", ruleset.name);
  } catch (err: any) {
    console.error("❌ 發布安全規則出錯:", err.message);
  }
}

deploy().catch(console.error);
