import { init, App, getApps, credential } from "firebase-admin/app";

// This function will be more robust to build-time environment variable issues.
function initializeAdminApp() {
    const apps = getApps();
    if (apps.length) return apps[0];

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        // Log a warning instead of throwing an error during build time.
        // The app will fail at runtime if the variable is still not set, which is expected.
        console.warn(
            "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Admin SDK will not be initialized."
        );
        return null;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        return init({
            credential: credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
        return null;
    }
}

let adminApp: App | null = null;

export const getFirebaseAdminApp = (): App => {
    if (adminApp) {
        return adminApp;
    }
    const app = initializeAdminApp();
    if (!app) {
        throw new Error("Firebase Admin SDK initialization failed.");
    }
    adminApp = app;
    return adminApp;
};
