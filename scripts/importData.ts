import * as fs from 'fs';
import * as path from 'path';

/**
 * 使用 REST API 導入數據 (繞過 gRPC Protocol Error)
 */

const PROJECT_ID = 'vexperthk-member-system';
const EMULATOR_HOST = '127.0.0.1:8080';

async function importFirestore() {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('請提供備份資料夾路徑！');
    process.exit(1);
  }

  const absolutePath = path.resolve(backupPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`路徑不存在: ${absolutePath}`);
    process.exit(1);
  }

  // 過濾出 JSON 檔案
  const files = fs.readdirSync(absolutePath).filter(f => f.endsWith('.json') && !f.startsWith('auth_users'));

  console.log(`🚀 正在透過 REST API 從 ${absolutePath} 導入數據...`);

  for (const file of files) {
    const colName = path.basename(file, '.json');
    const filePath = path.join(absolutePath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`正在導入 Collection: ${colName} (${data.length} 筆資料)...`);

    for (const item of data) {
      const { id, ...docData } = item;
      
      // 將資料轉換為 Firestore REST API 格式
      const restData = {
        fields: Object.keys(docData).reduce((acc: any, key) => {
          const val = docData[key];
          if (val === null || val === undefined) acc[key] = { nullValue: null };
          else if (typeof val === 'string') acc[key] = { stringValue: val };
          else if (typeof val === 'boolean') acc[key] = { booleanValue: val };
          else if (typeof val === 'number') acc[key] = { doubleValue: val };
          else if (Array.isArray(val)) {
            acc[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
          }
          else if (val && val.seconds) acc[key] = { timestampValue: new Date(val.seconds * 1000).toISOString() };
          else acc[key] = { stringValue: typeof val === 'object' ? JSON.stringify(val) : String(val) };
          return acc;
        }, {})
      };

      try {
        const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${colName}/${id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer owner' 
          },
          body: JSON.stringify(restData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`  ❌ 失敗 (${id}): ${response.statusText}`, errorText);
        }
      } catch (err: any) {
        console.error(`  ❌ 網路錯誤 (${id}):`, err.message);
      }
    }
    console.log(`✅ ${colName} 導入完成`);
  }

  console.log('\n✨ 所有數據已匯入成功！');
}

importFirestore().catch(console.error);
