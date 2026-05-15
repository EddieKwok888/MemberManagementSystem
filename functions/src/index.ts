import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { logAdminAction } from './audit/logger';

admin.initializeApp();

/**
 * 身份驗證觸發器: 當新用戶註冊時，同步創建 Firestore 用戶文檔
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  
  // 預設角色為 member
  const defaultRole = 'member';

  await admin.firestore().collection('users').doc(uid).set({
    uid,
    email,
    displayName: displayName || '',
    role: defaultRole,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 設置初始 Custom Claims
  await admin.auth().setCustomUserClaims(uid, { role: defaultRole });
  
  console.log(`User ${uid} created with default role: ${defaultRole}`);
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

  // 3. 記錄審計日誌 (使用模組化工具)
  await logAdminAction(
    context.auth.uid,
    'UPDATE_ROLE',
    targetUid,
    { newRole }
  );

  return { success: true, message: `角色已更新為 ${newRole}` };
});

// 匯入其他模組
export * from './members/handlers';
export * from './admin/handlers';


