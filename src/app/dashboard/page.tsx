import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';

import { shouldClearSession } from '@/lib/auth-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getCategories, getUserByEmail } from '@/lib/firestore';
import log from '@/lib/logger';

import { UnicornPropertiesApp } from '@/components/unicorn-properties-app';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const userRoleCookie = cookieStore.get('user-role')?.value;

  // Only log errors below, remove debug logs

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminApp = getFirebaseAdminApp();
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getUserByEmail(decodedToken.email || '');
    if (!user) {
      return null;
    }
    return user;
  } catch (error: unknown) {
    log.error('❌ Session verification failed:', error);
    if (shouldClearSession(error)) {
      const cookieStore = await cookies();
      cookieStore.delete('session');
      cookieStore.delete('user-role');
      return null;
    }
    if (process.env.NODE_ENV === 'development' && userRoleCookie) {
      return {
        id: 'dev-user',
        name: 'Development User',
        email: 'dev@example.com',
        role: userRoleCookie as 'admin' | 'user',
        apartment: 'dev-apartment',
      };
    }
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  // If server-side auth fails, let client-side handle it
  if (!user) {
    const { ProtectedRoute } = await import('@/components/protected-route');
    const { UnicornPropertiesApp } = await import('@/components/unicorn-properties-app');

    // Get basic data that doesn't require user context
    const initialCategories = await getCategories();

    // Client-side fallback
    return (
      <ProtectedRoute>
        <UnicornPropertiesApp initialCategories={initialCategories} />
      </ProtectedRoute>
    );
  }

  // Server-side auth successful - proceed normally
  const initialCategories = await getCategories();

  // Data fetching will now be handled client-side based on user's apartment
  // We pass empty arrays to avoid prop-drilling large initial datasets
  return <UnicornPropertiesApp initialCategories={initialCategories} />;
}
