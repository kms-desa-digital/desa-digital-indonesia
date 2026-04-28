import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

let adminApp: App;

type FirebaseAdminCredentials = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getPrivateKey() {
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!rawKey) return undefined;
  return rawKey.replace(/\\n/g, "\n");
}

function loadServiceAccount(): FirebaseAdminCredentials | undefined {
  const credentialsPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;
  if (credentialsPath) {
    try {
      const fileContent = readFileSync(credentialsPath, "utf8");
      return JSON.parse(fileContent) as FirebaseAdminCredentials;
    } catch (error) {
      console.error("Failed to load Firebase Admin credentials file:", error);
      return undefined;
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();
  if (!projectId || !clientEmail || !privateKey) {
    return undefined;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

function ensureAdminApp() {
  if (getApps().length) {
    adminApp = getApps()[0] as App;
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin credentials are not configured. Set FIREBASE_ADMIN_CREDENTIALS_PATH or FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });

  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  const app = ensureAdminApp();
  return getAuth(app);
}

export function getFirebaseAdminFirestore(): Firestore {
  const app = ensureAdminApp();
  return getFirestore(app);
}
