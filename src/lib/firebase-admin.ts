import { init, App, getApps, credential } from "firebase-admin/app";

const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set."
  );
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

const apps = getApps();

export const getFirebaseAdminApp = (): App => {
  if (apps.length) return apps[0];
  return init({
    credential: credential.cert(serviceAccount),
  });
};
