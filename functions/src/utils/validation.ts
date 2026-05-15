import * as functions from 'firebase-functions';

/**
 * 檢查當前調用者是否具有 Admin 角色
 * @param context 函數調用上下文
 * @throws HttpsError 如果權限不足
 */
export async function ensureAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '請先登入');
  }

  // 1. 優先檢查 Custom Claims
  if (context.auth.token.role === 'admin') {
    return;
  }

  // 2. 備案：檢查 Firestore
  const admin = await import('firebase-admin');
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  
  if (userDoc.exists && userDoc.data()?.role === 'admin') {
    return;
  }

  throw new functions.https.HttpsError('permission-denied', '僅限管理員執行此操作');
}

/**
 * 驗證輸入參數是否符合預期
 * @param data 輸入數據
 * @param requiredFields 必填欄位列表
 */
export function validateParams(data: any, requiredFields: string[]) {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new functions.https.HttpsError('invalid-argument', `缺失必填參數: ${field}`);
    }
  }
}
