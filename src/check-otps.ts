import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('passwordResets').get();
  console.log('Total OTPs:', snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

check().catch(console.error);
