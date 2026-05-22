import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { logAdminAction } from './audit/logger';

admin.initializeApp();

/**
 * 身份驗證觸發器: 當新用戶註冊時，同步創建 Firestore 用戶文檔
 */
export const onUserCreated = functions.region('us-central1').auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  
  // 預設角色為 member
  const defaultRole = 'member';

  // 讀取系統設定的預設會員狀態
  let defaultStatus = 'pending';
  try {
    const settingsSnap = await admin.firestore().collection('systemSettings').doc('config').get();
    if (settingsSnap.exists) {
      defaultStatus = settingsSnap.data()?.defaultMemberStatus || 'pending';
    }
  } catch (err) {
    console.error('讀取系統預設會員狀態失敗，採用預設值 pending:', err);
  }

  await admin.firestore().collection('users').doc(uid).set({
    uid,
    email,
    displayName: displayName || '',
    realName: displayName || '',
    role: defaultRole,
    status: defaultStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // 設置初始 Custom Claims
  await admin.auth().setCustomUserClaims(uid, { role: defaultRole });
  
  // 記錄註冊審計日誌
  try {
    await logAdminAction(
      'SYSTEM',
      'USER_REGISTER',
      uid,
      { email, displayName: displayName || '', role: defaultRole, status: defaultStatus },
      'system@vexperthk.com',
      'System Trigger',
      displayName || email || uid
    );
  } catch (logErr) {
    console.error('註冊審計日誌寫入失敗:', logErr);
  }

  console.log(`User ${uid} created with default role: ${defaultRole} and status: ${defaultStatus}`);
});

/**
 * 修改用戶角色 (僅限管理員)
 */
export const updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      '只有管理員可以修改角色'
    );
  }

  const { targetUid, newRole } = data;
  const validRoles = ['admin', 'staff', 'member'];

  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', '無效的角色');
  }

  // 1. 更新 Custom Claims
  await admin.auth().setCustomUserClaims(targetUid, { role: newRole });

  // 2. 更新 Firestore
  await admin.firestore().collection('users').doc(targetUid).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const adminData = adminDoc.data();
  const adminName = adminData?.displayName || context.auth.token.email || context.auth.uid;

  // 獲取目標姓名
  const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
  const targetData = targetDoc.data();
  const targetName = targetData?.displayName || targetUid;

  // 3. 記錄審計日誌 (使用模組化工具)
  await logAdminAction(
    context.auth.uid,
    'UPDATE_ROLE',
    targetUid,
    { newRole },
    context.auth.token.email,
    adminName,
    targetName
  );

  return { success: true, message: `角色已更新為 ${newRole}` };
});

// 匯入其他模組
export * from './members/handlers';
export * from './admin/handlers';


