import * as admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'vexperthk-member-system' });
}

import { updateSystemSettings } from './admin/handlers';

async function test() {
  const mockContext = {
    auth: {
      uid: 'test-admin-uid',
      token: {
        role: 'admin',
        email: 'admin@example.com'
      }
    }
  } as any;

  // Create mock admin user in firestore
  await admin.firestore().collection('users').doc('test-admin-uid').set({
    uid: 'test-admin-uid',
    role: 'admin',
    displayName: 'Mock Admin'
  });

  try {
    const result = await (updateSystemSettings as any).run({
      maintenanceMode: false,
      adminAlertEmail: 'admin@example.com',
      allowPublicRegistration: true,
      defaultMemberStatus: 'pending'
    }, mockContext);
    console.log('Test passed! Result:', result);
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

test().catch(console.error);
