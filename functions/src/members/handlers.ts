import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { logAdminAction } from '../audit/logger';

/**
 * 獲取會員完整資料 (管理員/員工權限)
 */
export const getMemberProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '請先登入');
  }

  const { uid } = data;
  const isAdminOrStaff = ['admin', 'staff'].includes(context.auth.token.role);
  const isOwner = context.auth.uid === uid;

  if (!isAdminOrStaff && !isOwner) {
    throw new functions.https.HttpsError('permission-denied', '權限不足');
  }

  const profileDoc = await admin.firestore().collection('memberProfiles').doc(uid).get();

  if (!profileDoc.exists) {
    throw new functions.https.HttpsError('not-found', '找不到該會員檔案');
  }

  const profileData = profileDoc.data();

  // 如果是員工 (Staff) 且不是本人，過濾掉某些極其敏感的欄位
  if (context.auth.token.role === 'staff' && !isOwner) {
    delete profileData?.internalNotes;
  }

  return profileData;
});

/**
 * 更新會員資料
 */
export const updateMemberProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '請先登入');
  }

  const { uid, updates } = data;
  const isAdmin = context.auth.token.role === 'admin';
  const isOwner = context.auth.uid === uid;

  if (!isAdmin && !isOwner) {
    throw new functions.https.HttpsError('permission-denied', '無權修改');
  }

  // 防止非管理員修改敏感欄位 (如等級、積分)
  if (!isAdmin) {
    delete updates.membershipTier;
    delete updates.points;
  }

  await admin.firestore().collection('memberProfiles').doc(uid).set(updates, { merge: true });

  // 如果是管理員修改，記錄審計日誌
  if (isAdmin && !isOwner) {
    await logAdminAction(
      context.auth.uid, 
      'UPDATE_MEMBER_PROFILE', 
      uid, 
      updates,
      context.auth.token.email
    );
  }

  return { success: true };
});

/**
 * 列出所有會員 (分頁)
 */
export const listMembers = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['admin', 'staff'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', '權限不足');
  }

  const { pageSize = 20, lastVisibleId } = data;
  let query = admin.firestore().collection('users')
    .where('role', '==', 'member')
    .orderBy('createdAt', 'desc')
    .limit(pageSize);

  if (lastVisibleId) {
    const lastDoc = await admin.firestore().collection('users').doc(lastVisibleId).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();
  const members = snapshot.docs.map(doc => doc.data());

  return {
    members,
    lastVisibleId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
  };
});

