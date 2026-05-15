import * as fs from 'fs';
import * as path from 'path';

/**
 * 使用 REST API 導出數據 (繞過 gRPC Protocol Error)
 */

const PROJECT_ID = 'vexperthk-member-system';
const EMULATOR_HOST = '127.0.0.1:8080';

const COLLECTIONS = ['users', 'memberProfiles', 'adminAuditLogs', 'roles', 'permissions', 'systemSettings'];

async function exportFirestore() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `../backups/backup-${timestamp}`);

  if (!fs.existsSync(path.join(__dirname, '../backups'))) {
    fs.mkdirSync(path.join(__dirname, '../backups'));
  }
  fs.mkdirSync(backupDir);

  console.log(`🚀 正在透過 REST API 導出數據到 ${backupDir}...`);

  for (const colName of COLLECTIONS) {
    console.log(`正在導出 Collection: ${colName}...`);
    
    try {
      const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${colName}`;
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer owner' }
      });

      if (!response.ok) {
        console.error(`  ❌ 導出 ${colName} 失敗: ${response.statusText}`);
        continue;
      }

      const result: any = await response.json();
      const documents = result.documents || [];

      const data = documents.map((doc: any) => {
        const id = doc.name.split('/').pop();
        const fields = doc.fields || {};
        
        // 簡單解析 REST 格式回原始 JSON
        const obj: any = { id };
        for (const key in fields) {
          const field = fields[key];
          if ('stringValue' in field) obj[key] = field.stringValue;
          else if ('booleanValue' in field) obj[key] = field.booleanValue;
          else if ('doubleValue' in field) obj[key] = Number(field.doubleValue);
          else if ('integerValue' in field) obj[key] = Number(field.integerValue);
          else if ('timestampValue' in field) obj[key] = { seconds: Math.floor(new Date(field.timestampValue).getTime() / 1000) };
          else obj[key] = field;
        }
        return obj;
      });

      fs.writeFileSync(path.join(backupDir, `${colName}.json`), JSON.stringify(data, null, 2));
      console.log(`✅ ${colName} 導出成功 (${data.length} 筆資料)`);
    } catch (err: any) {
      console.error(`  ❌ 導出 ${colName} 時發生錯誤:`, err.message);
    }
  }

  console.log(`\n✨ 數據導出完成！備份資料夾：${backupDir}`);
}

exportFirestore().catch(console.error);
