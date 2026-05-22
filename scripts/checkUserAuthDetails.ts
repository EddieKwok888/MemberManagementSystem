import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`找不到 admin-key.json`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

async function checkUser() {
  const email = 'disable@vexperthk.com';
  const user = await auth.getUserByEmail(email);
  console.log(`=== Auth User Details for ${email} ===`);
  console.log(`UID: ${user.uid}`);
  console.log(`Disabled in Auth: ${user.disabled}`);
  console.log(`Email Verified: ${user.emailVerified}`);
  console.log(`Custom Claims: ${JSON.stringify(user.customClaims)}`);
}

checkUser().catch(console.error);
