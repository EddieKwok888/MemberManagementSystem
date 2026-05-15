import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { logAdminAction } from '../audit/logger';
import { ensureAdmin, validateParams } from '../utils/validation';

/**
 * 獲取用戶的友好顯示名稱 (Name + Email)
 */
function getFriendlyName(userData: any, fallback: string): string {
  if (!userData) return fallback;
  const name = userData.displayName;
  const email = userData.email;
  if (name && email) return `${name} (${email})`;
  return name || email || fallback;
}

/**
 * 1. 創建會員
 */
export const createMember = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['email', 'password', 'displayName']);

  const { email, password, displayName } = data;

  try {
    // A. 在 Auth 中創建帳戶
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // B. 設置預設 Custom Claims (member)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'member' });

    // C. 在 Firestore 創建 Users 文檔
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'member',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // D. 記錄審計日誌
    await logAdminAction(
      context.auth!.uid, 
      'CREATE_MEMBER', 
      userRecord.uid, 
      { email, displayName, role: 'member', status: 'active' },
      context.auth!.token.email,
      getFriendlyName(context.auth!.token, context.auth!.token.email || context.auth!.uid),
      getFriendlyName({ displayName, email }, userRecord.uid)
    );

    return { uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error in createMember:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('unknown', error.message || '創建會員時發生未知錯誤');
  }
});

/**
 * 2. 切換會員狀態 (啟用/停用)
 */
export const toggleMemberStatus = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetUid', 'action']);

  const { targetUid, action } = data; // action: 'enable' | 'disable'
  const isDisabled = action === 'disable';

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  // 獲取目標姓名
  const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
  const targetName = getFriendlyName(targetDoc.data(), targetUid);

  // A. 在 Auth 中更新
  await admin.auth().updateUser(targetUid, { disabled: isDisabled });

  // B. 在 Firestore 更新狀態
  const newStatus = isDisabled ? 'disabled' : 'active';
  await admin.firestore().collection('users').doc(targetUid).update({
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // C. 記錄日誌
  await logAdminAction(
    context.auth!.uid, 
    isDisabled ? 'DISABLE_MEMBER' : 'ENABLE_MEMBER', 
    targetUid, 
    { action: action, newStatus: newStatus },
    context.auth!.token.email,
    adminName,
    targetName
  );

  return { success: true, status: newStatus };
});

/**
 * 3. 刪除會員
 */
export const deleteMember = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetUid']);

  const { targetUid } = data;

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  // 獲取目標姓名
  const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
  const targetName = getFriendlyName(targetDoc.data(), targetUid);

  // A. 從 Auth 刪除
  await admin.auth().deleteUser(targetUid);

  // B. 從 Firestore 刪除相關文檔
  await admin.firestore().collection('users').doc(targetUid).delete();
  await admin.firestore().collection('memberProfiles').doc(targetUid).delete();

  // C. 記錄日誌
  await logAdminAction(
    context.auth!.uid, 
    'DELETE_MEMBER', 
    targetUid, 
    { note: 'User was permanently deleted' },
    context.auth!.token.email,
    adminName,
    targetName
  );

  return { success: true };
});

/**
 * 4. 分配角色
 */
export const assignRole = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetUid', 'role']);

  const { targetUid, role } = data;
  
  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  // 獲取目標姓名
  const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
  const targetName = getFriendlyName(targetDoc.data(), targetUid);

  const allowedRoles = ['admin', 'staff', 'member'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', '不合法的角色名稱');
  }

  // A. 更新 Auth Claims
  await admin.auth().setCustomUserClaims(targetUid, { role });

  // B. 更新 Firestore
  await admin.firestore().collection('users').doc(targetUid).update({
    role: role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // C. 記錄日誌
  await logAdminAction(
    context.auth!.uid, 
    'ASSIGN_ROLE', 
    targetUid, 
    { newRole: role },
    context.auth!.token.email,
    adminName,
    targetName
  );

  return { success: true };
});

/**
 * 5. 重設密碼 (生成重置連結並返回，或直接修改)
 */
export const resetMemberPassword = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['email']);

  const { email } = data;

  try {
    // 生成密碼重置連結
    const link = await admin.auth().generatePasswordResetLink(email);
    
    // 獲取管理員姓名
    const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
    const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

    // 記錄日誌
    await logAdminAction(
      context.auth!.uid, 
      'RESET_PASSWORD_REQUEST', 
      email, 
      {},
      context.auth!.token.email,
      adminName,
      email // Target name is just email here
    );

    return { link };
  } catch (error: any) {
    throw new functions.https.HttpsError('not-found', '找不到該郵件對應的用戶');
  }
});

/**
 * 6. 快速登入 (Impersonate)
 * 允許管理員獲取特定使用者的 Custom Token，以便在前端登入其帳號
 */
export const impersonateUser = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetUid']);

  const { targetUid } = data;

  try {
    // 獲取管理員姓名
    const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
    const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

    // 獲取目標姓名
    const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
    const targetName = getFriendlyName(targetDoc.data(), targetUid);

    // 產生 Custom Token
    const customToken = await admin.auth().createCustomToken(targetUid);

    // 記錄審計日誌
    await logAdminAction(
      context.auth!.uid, 
      'IMPERSONATE_USER', 
      targetUid, 
      { note: 'Admin logged in as user via Quick Login' },
      context.auth!.token.email,
      adminName,
      targetName
    );

    return { customToken };
  } catch (error: any) {
    console.error("Error generating custom token:", error);
    throw new functions.https.HttpsError('internal', '無法產生登入憑證');
  }
});

/**
 * 7. 管理員更新會員資料
 */
export const updateMemberByAdmin = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetUid', 'email', 'displayName', 'role']);

  const { targetUid, email, displayName, role, phone, address } = data;

  // 驗證角色
  const allowedRoles = ['admin', 'staff', 'member'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', '不合法的角色名稱');
  }

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  // 獲取目標姓名
  const targetDoc = await admin.firestore().collection('users').doc(targetUid).get();
  const targetName = getFriendlyName(targetDoc.data(), targetUid);

  try {
    // A. 更新 Auth 中的資料 (Email & DisplayName)
    await admin.auth().updateUser(targetUid, {
      email,
      displayName
    });

    // B. 更新 Auth Claims (Role)
    await admin.auth().setCustomUserClaims(targetUid, { role });

    // C. 更新 Firestore 中的完整資料
    await admin.firestore().collection('users').doc(targetUid).update({
      email,
      displayName,
      role,
      phone: phone || null,
      address: address || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // D. 記錄日誌
    await logAdminAction(
      context.auth!.uid, 
      'UPDATE_MEMBER_PROFILE', 
      targetUid, 
      { email, displayName, role, phone, address },
      context.auth!.token.email,
      adminName,
      targetName
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error updating member:", error);
    throw new functions.https.HttpsError('internal', error.message || '更新會員資料時發生錯誤');
  }
});

/**
 * 8. 清理審計日誌
 * 刪除指定日期(含)之前的日誌，且日期必須大於3天前。
 */
export const deleteAuditLogs = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  validateParams(data, ['targetDateStr']); // e.g. "2024-05-10"

  const { targetDateStr } = data;
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(23, 59, 59, 999);

  if (isNaN(targetDate.getTime())) {
    throw new functions.https.HttpsError('invalid-argument', '無效的日期格式');
  }

  // 確保只能刪除 3 天前的資料
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  if (targetDate > threeDaysAgo) {
    throw new functions.https.HttpsError('failed-precondition', '基於安全考量，只能刪除大於 3 天前的日誌資料。');
  }

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  try {
    const snapshot = await admin.firestore()
      .collection('adminAuditLogs')
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(targetDate))
      .get();

    if (snapshot.empty) {
      return { success: true, count: 0, message: '沒有找到符合條件的日誌' };
    }

    // 批量刪除
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    // 記錄此次清理操作
    await logAdminAction(
      context.auth!.uid, 
      'CLEANUP_AUDIT_LOGS', 
      'SYSTEM', 
      { deletedCount: snapshot.size, targetDate: targetDateStr },
      context.auth!.token.email,
      adminName,
      'System Logs'
    );

    return { success: true, count: snapshot.size };
  } catch (error: any) {
    console.error("Error deleting audit logs:", error);
    throw new functions.https.HttpsError('internal', '清理日誌時發生錯誤');
  }
});

/**
 * 9. 更新系統設定 (System Settings)
 * 僅限管理員呼叫
 */
export const updateSystemSettings = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  // Debug logging
  console.log('updateSystemSettings called by UID:', context.auth?.uid);
  console.log('Payload received:', data);
  
  // 驗證輸入參數，只允許更新指定的鍵值
  const allowedKeys = ['maintenanceMode', 'adminAlertEmail', 'allowPublicRegistration', 'defaultMemberStatus'];
  const updateData: any = {};
  
  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', '沒有提供要更新的設定參數');
  }

  // 獲取管理員姓名
  const adminDoc = await admin.firestore().collection('users').doc(context.auth!.uid).get();
  const adminName = getFriendlyName(adminDoc.data(), context.auth!.token.email || context.auth!.uid);

  try {
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = context.auth!.uid;

    await admin.firestore().collection('systemSettings').doc('config').set(updateData, { merge: true });
    console.log('System settings updated successfully:', updateData);

    // 記錄此次操作
    await logAdminAction(
      context.auth!.uid, 
      'UPDATE_SYSTEM_SETTINGS', 
      'SYSTEM', 
      updateData,
      context.auth!.token.email,
      adminName,
      'System Settings'
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    throw new functions.https.HttpsError('internal', error.message || '更新系統設定時發生錯誤');
  }
});
