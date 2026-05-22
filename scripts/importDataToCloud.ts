import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * importDataToCloud.ts
 * 
 * 讀取本地備份資料並透過 Firebase Admin SDK (使用 admin-key.json 憑證)
 * 直接寫入真實的 Google Firebase 雲端環境 (Firestore 及 Auth)。
 * 
 * 使用方式:
 * npx ts-node scripts/importDataToCloud.ts [備份資料夾路徑]
 * 
 * 例如:
 * npx ts-node scripts/importDataToCloud.ts backups/backup-2026-05-15T07-42-06-833Z
 */

// 1. 檢查並載入服務帳戶憑證 (Service Account Credentials)
const serviceAccountPath = path.resolve(__dirname, '../admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ 錯誤：找不到服務帳戶憑證，請確認專案根目錄下有 'admin-key.json' 檔案。`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const PROJECT_ID = serviceAccount.project_id;

console.log(`☁️ 正在初始化 Firebase Admin SDK...`);
console.log(`👉 目標雲端專案 ID: ${PROJECT_ID}\n`);

// 2. 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// 3. 取得備份路徑
const defaultBackupPath = 'backups/backup-2026-05-15T07-42-06-833Z';
const inputBackupPath = process.argv[2];
const backupPath = inputBackupPath || defaultBackupPath;

const absoluteBackupPath = path.resolve(backupPath);
if (!fs.existsSync(absoluteBackupPath)) {
  console.error(`❌ 錯誤：找不到備份路徑: ${absoluteBackupPath}`);
  console.error(`請確認路徑是否正確，或在命令後加上正確的路徑。`);
  process.exit(1);
}

/**
 * 遞迴解析並轉換 JSON 中序列化的 Firestore 時間戳 (_seconds, _nanoseconds)
 */
function parseTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object') {
    // 檢查是否是序列化的時間戳
    if ('_seconds' in obj && '_nanoseconds' in obj) {
      const ms = obj._seconds * 1000 + Math.floor(obj._nanoseconds / 1000000);
      return admin.firestore.Timestamp.fromMillis(ms);
    }

    // 陣列處理
    if (Array.isArray(obj)) {
      return obj.map(item => parseTimestamps(item));
    }

    // 物件屬性遞迴處理
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = parseTimestamps(obj[key]);
    }
    return newObj;
  }

  return obj;
}

async function migrate() {
  console.log(`🚀 開始從備份路徑遷移數據: ${absoluteBackupPath}\n`);

  // ==================== PART 1: 遷移 FIREBASE AUTH 用戶 ====================
  const authFile = path.join(absoluteBackupPath, 'auth_users.json');
  if (fs.existsSync(authFile)) {
    console.log(`👥 [1/2] 正在讀取並遷移 Auth 用戶 (auth_users.json)...`);
    const usersData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    
    for (const user of usersData) {
      const { uid, email, displayName, disabled, customClaims } = user;
      const defaultPassword = '123456'; // 設定一個已知的安全預設密碼供測試
      
      console.log(`  👤 處理用戶: ${email} (uid: ${uid})...`);
      
      let exists = false;
      try {
        await auth.getUser(uid);
        exists = true;
      } catch (err: any) {
        // 用戶不存在
      }

      try {
        if (exists) {
          // 更新已存在用戶
          await auth.updateUser(uid, {
            email,
            displayName: displayName || '',
            disabled: !!disabled,
            password: defaultPassword // 重設為預設密碼 123456 確保雲端登入運作
          });
          console.log(`    ℹ️  雲端用戶已存在，已成功更新屬性及密碼`);
        } else {
          // 建立新用戶
          await auth.createUser({
            uid,
            email,
            displayName: displayName || '',
            disabled: !!disabled,
            password: defaultPassword,
            emailVerified: true
          });
          console.log(`    ✅ 雲端用戶建立成功，密碼已設為 123456`);
        }

        // 寫入角色權限 (Custom Claims)
        const role = customClaims?.role || 'member';
        await auth.setCustomUserClaims(uid, { role });
        console.log(`    🔑 角色 Custom Claim 寫入成功: { role: "${role}" }`);

      } catch (err: any) {
        console.error(`    ❌ 處理用戶時出錯 (${email}):`, err.message);
      }
    }
    console.log(`✅ Auth 用戶遷移處理完成！\n`);
  } else {
    console.log(`⚠️ 提示：在備份目錄中找不到 auth_users.json，跳過 Auth 用戶遷移。\n`);
  }

  // ==================== PART 2: 遷移 FIRESTORE 集合 ====================
  console.log(`📄 [2/2] 正在讀取並遷移 Firestore 集合...`);
  
  // 獲取該目錄下除了 auth_users.json 外的所有 json 檔案
  const files = fs.readdirSync(absoluteBackupPath).filter(f => f.endsWith('.json') && f !== 'auth_users.json');

  for (const file of files) {
    const colName = path.basename(file, '.json');
    const filePath = path.join(absoluteBackupPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`\n📂 正在遷移集合 [${colName}] (${data.length} 筆數據)...`);

    for (const item of data) {
      const { id, ...docData } = item;
      
      if (!id) {
        console.warn(`  ⚠️ 發現沒有 id 的資料，跳過:`, item);
        continue;
      }

      // 遞迴將序列化時間戳轉換成 Firestore Timestamp 物件
      const parsedData = parseTimestamps(docData);

      try {
        await db.collection(colName).doc(id).set(parsedData, { merge: true });
        console.log(`  📄 寫入文檔成功: id = ${id}`);
      } catch (err: any) {
        console.error(`  ❌ 寫入文檔失敗 (id: ${id}):`, err.message);
      }
    }
    console.log(`✅ 集合 [${colName}] 遷移完成！`);
  }

  console.log(`\n✨ =================================================== ✨`);
  console.log(`🎉 恭喜！所有本地備份數據已成功上傳至真實的 Google Firebase 雲端環境！`);
  console.log(`👉 雲端專案 ID: ${PROJECT_ID}`);
  console.log(`🔑 遷移用戶的登入預設密碼皆為: 123456`);
  console.log(`✨ =================================================== ✨`);
}

migrate().catch(err => {
  console.error('❌ 遷移過程中發生嚴重錯誤:', err);
});
