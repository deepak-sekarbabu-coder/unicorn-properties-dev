import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is the service account JSON object. In a production environment, you'd
// want to load this from a secure source or environment variables.
// Check for both IDX and standard environment variables
const serviceAccountString =
  process.env.IDX_FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminApp: App;

// This pattern ensures that initialization only happens once.
try {
  if (getApps().length === 0) {
    let serviceAccount;

    // Try individual environment variables first (more secure)
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
      };
    } else if (serviceAccountString) {
      // Fallback to JSON string
      serviceAccount = JSON.parse(serviceAccountString);
    } else {
      throw new Error(
        'Firebase service account credentials are not set in the environment. ' +
          'Either set individual variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) ' +
          'or set FIREBASE_SERVICE_ACCOUNT_JSON with the complete JSON.'
      );
    }

    // Ensure private_key has correct newline characters.
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        '\n'
      );
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (error: any) {
  console.error('Firebase Admin SDK initialization failed:', error);
  // We don't re-throw here to avoid crashing the server on build,
  // but the app will not function correctly without a successful initialization.
  // The functions that use it will fail at runtime.
}

export const getFirebaseAdminApp = (): App => {
  if (!adminApp) {
    // This will be the runtime error if initialization failed.
    throw new Error(
      'Firebase Admin SDK has not been initialized. Check the server logs for initialization errors.'
    );
  }

  // Additional check to ensure the app is properly configured
  try {
    // This will throw if the app is not properly initialized
    const auth = getAuth(adminApp);
    console.log('Firebase Admin Auth service is available');
  } catch (error) {
    console.error('Firebase Admin Auth service is not available:', error);
    throw new Error('Firebase Admin Auth service is not properly configured');
  }

  return adminApp;
};
