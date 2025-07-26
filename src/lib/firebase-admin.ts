import * as dotenv from 'dotenv';
import { init, App, getApps, credential } from "firebase-admin/app";

// Load environment variables from .env file
dotenv.config();

function initializeAdminApp(): App {
    const apps = getApps();
    if (apps.length) return apps[0];

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Admin SDK initialization failed."
        );
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        return init({
            credential: credential.cert(serviceAccount),
        });
    } catch (error: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
        throw new Error("Could not initialize Firebase Admin SDK. Service account JSON is invalid.");
    }
}

// This pattern ensures that initialization only happens once.
const adminApp = initializeAdminApp();

export const getFirebaseAdminApp = (): App => {
    return adminApp;
};
