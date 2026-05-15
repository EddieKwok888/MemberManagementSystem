import * as admin from 'firebase-admin';

/**
 * 集中化審計日誌記錄器
 */
export async function logAdminAction(
  adminUid: string,
  action: string,
  targetId: string,
  details: any,
  adminEmail?: string,
  adminName?: string,
  targetName?: string
) {
  const auditLog = {
    adminUid,
    adminEmail: adminEmail || 'unknown',
    adminName: adminName || adminEmail || adminUid,
    action,
    targetId,
    targetName: targetName || 'System/Unknown',
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      source: 'cloud-functions',
      version: '1.1'
    }
  };

  try {
    await admin.firestore().collection('adminAuditLogs').add(auditLog);
    console.log(`[AuditLog] ${adminName || adminUid} performed ${action} on ${targetName || targetId}`);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}
