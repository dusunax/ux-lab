import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env is not set');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

const app = initAdmin();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
