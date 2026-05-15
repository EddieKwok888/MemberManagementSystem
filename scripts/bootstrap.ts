import * as admin from 'firebase-admin';

// 初始化 Firebase Admin (確保您已設置 GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 預定義的權限
 */
const permissions = [
  { id: 'view_members', description: '查看會員基本資料' },
  { id: 'manage_members', description: '管理所有會員資料 (增刪改)' },
  { id: 'view_audit_logs', description: '查看管理員審計日誌' },
  { id: 'manage_system', description: '修改系統全域設置' },
];

/**
 * 預定義的角色及其權限映射
 */
const roles = [
  {
    id: 'admin',
    name: '系統管理員',
    permissions: ['view_members', 'manage_members', 'view_audit_logs', 'manage_system'],
  },
  {
    id: 'staff',
    name: '普通員工',
    permissions: ['view_members'],
  },
  {
    id: 'member',
    name: '一般會員',
    permissions: [],
  },
];

async function bootstrap() {
  console.log('開始初始化角色與權限數據...');

  // 1. 寫入權限
  const permBatch = db.batch();
  permissions.forEach((p) => {
    const ref = db.collection('permissions').doc(p.id);
    permBatch.set(ref, p);
  });
  await permBatch.commit();
  console.log('✅ 權限數據已寫入');

  // 2. 寫入角色
  const roleBatch = db.batch();
  roles.forEach((r) => {
    const ref = db.collection('roles').doc(r.id);
    roleBatch.set(ref, r);
  });
  await roleBatch.commit();
  console.log('✅ 角色數據已寫入');

  // 3. 初始化系統設置
  await db.collection('systemSettings').doc('global').set({
    maintenanceMode: false,
    minAppVersion: '1.0.0',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ 系統設置已初始化');

  console.log('🚀 所有初始化數據已準備就緒！');
}

bootstrap().catch(console.error);
