import { init, App, getApps, credential } from "firebase-admin/app";

// This is the service account JSON object. In a production environment, you'd
// want to load this from a secure source or environment variables.
// For Project IDX, the IDX_FIREBASE_SERVICE_ACCOUNT_JSON variable is automatically
// provided, so we can use it directly.
const serviceAccountString = process.env.IDX_FIREBASE_SERVICE_ACCOUNT_JSON;

let adminApp: App;

// This pattern ensures that initialization only happens once.
try {
  if (getApps().length === 0) {
    if (!serviceAccountString) {
      throw new Error(
        "Firebase service account credentials are not set in the environment. Make sure IDX_FIREBASE_SERVICE_ACCOUNT_JSON is available."
      );
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    adminApp = init({
      credential: credential.cert(serviceAccount),
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (error: any) {
    console.error("Firebase Admin SDK initialization failed:", error);
    // We don't re-throw here to avoid crashing the server on build,
    // but the app will not function correctly without a successful initialization.
    // The functions that use it will fail at runtime.
}


export const getFirebaseAdminApp = (): App => {
    if (!adminApp) {
        // This will be the runtime error if initialization failed.
        throw new Error("Firebase Admin SDK has not been initialized. Check the server logs for initialization errors.");
    }
    return adminApp;
};
