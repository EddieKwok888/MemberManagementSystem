import * as admin from 'firebase-admin';

// Initialize admin SDK connecting to Firestore and Auth emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
  projectId: 'vexperthk-member-system',
});

const db = admin.firestore();
const auth = admin.auth();

async function runTest() {
  const email = `test_user_${Date.now()}@example.com`;
  const password = 'password123';
  const displayName = '測試註冊用戶';
  const uid = `test_uid_${Date.now()}`;

  console.log(`Creating user in Auth: ${uid} (${email})...`);

  // 1. Simulate Auth onCreate trigger by creating a user in Auth
  const userRecord = await auth.createUser({
    uid,
    email,
    password,
    displayName,
  });

  console.log('User created in Auth. Waiting 2 seconds for Cloud Function trigger to run...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. Read the Firestore document to see if Cloud Function successfully created it and merged it
  console.log('Reading user document from Firestore...');
  const userDocRef = db.collection('users').doc(uid);
  const docSnap = await userDocRef.get();

  if (!docSnap.exists) {
    console.error('❌ Error: User document was not created by the Cloud Function!');
    process.exit(1);
  }

  const data = docSnap.data()!;
  console.log('Firestore user document content:', data);

  // Validate fields
  const isValid = 
    data.uid === uid &&
    data.email === email &&
    data.displayName === displayName &&
    data.realName === displayName &&
    data.role === 'member' &&
    data.status === 'active' &&
    data.createdAt !== undefined;

  if (isValid) {
    console.log('✅ Success: User document was created successfully with all required fields (including realName)!');
  } else {
    console.error('❌ Error: User document has invalid or missing fields.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
