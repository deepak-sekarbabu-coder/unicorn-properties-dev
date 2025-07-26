
import { ApartmentShareApp } from '@/components/apartment-share-app';
import { getCategories, getAnnouncements, getUser, getUsers, getExpenses } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from 'firebase-admin';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

async function getAuthenticatedUser() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        getFirebaseAdminApp(); // Initialize admin app if not already
        const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
        const user = await getUser(decodedClaims.uid);
        if (!user) return null;
        
        return user;
    } catch (error) {
        console.error("Session verification failed:", error);
        return null;
    }
}


export default async function DashboardPage() {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect('/login');
    }

    const initialCategories = await getCategories();
    const initialAnnouncements = await getAnnouncements(user.role || 'tenant');

    // Data fetching will now be handled client-side based on user's apartment
    // We pass empty arrays to avoid prop-drilling large initial datasets
    const initialUsers = [];
    const initialExpenses = [];
    

    return <ApartmentShareApp
        initialUsers={initialUsers}
        initialCategories={initialCategories}
        initialExpenses={initialExpenses}
        initialAnnouncements={initialAnnouncements}
    />;
}
