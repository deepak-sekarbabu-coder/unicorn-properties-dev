import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';

import { getAuthErrorMessage, shouldClearSession } from '@/lib/auth-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getAnnouncements, getCategories, getUserByEmail } from '@/lib/firestore';

import { UnicornPropertiesApp } from '@/components/unicorn-properties-app';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const userRoleCookie = cookieStore.get('user-role')?.value;

  console.log('=== Authentication Debug ===');
  console.log('Session cookie exists:', !!sessionCookie);
  console.log('User role cookie:', userRoleCookie);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  if (!sessionCookie) {
    console.log('No session cookie found, returning null');
    return null;
  }

  console.log('Session cookie length:', sessionCookie.length);
  console.log('Session cookie starts with:', sessionCookie.substring(0, 20));

  try {
    const adminApp = getFirebaseAdminApp();
    console.log('✅ Admin app initialized successfully');

    console.log('🔍 Attempting ID token verification');
    const decodedToken = await getAuth(adminApp).verifyIdToken(sessionCookie);
    console.log('✅ ID token verified successfully, UID:', decodedToken.uid);

    // Get user by email since Firebase UID != Firestore document ID
    const user = await getUserByEmail(decodedToken.email || '');
    console.log('User from Firestore:', user ? 'Found' : 'Not found');
    if (!user) {
      console.log('❌ User not found in Firestore for email:', decodedToken.email);
      return null;
    }

    return user;
  } catch (error: unknown) {
    console.error('❌ Session verification failed:');
    console.error('Error type:', typeof error);
    console.error(
      'Error constructor:',
      (error as { constructor?: { name?: string } })?.constructor?.name
    );
    console.error('Error message:', (error as { message?: string })?.message);
    console.error('Error code:', (error as { code?: string })?.code);
    console.error('Full error:', error);

    // Check if we should clear the session based on the error type
    if (shouldClearSession(error)) {
      console.log('🧹 Clearing invalid session cookies due to:', getAuthErrorMessage(error));
      const cookieStore = await cookies();
      cookieStore.delete('session');
      cookieStore.delete('user-role');
      return null;
    }

    // Production fallback: For Netlify deployments, session cookies might fail
    // In this case, we'll let the client-side auth handle verification
    console.warn('🔄 Session verification failed - will rely on client-side auth');

    // Development fallback: if we have a user-role cookie, create a basic user object
    if (process.env.NODE_ENV === 'development' && userRoleCookie) {
      console.warn('🔄 Using development fallback for user authentication');
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
    console.log('🔄 Server-side auth failed - using client-side protection');
    const { ProtectedRoute } = await import('@/components/protected-route');
    const { UnicornPropertiesApp } = await import('@/components/unicorn-properties-app');

    // Get basic data that doesn't require user context
    const initialCategories = await getCategories();

    return (
      <ProtectedRoute>
        <UnicornPropertiesApp initialCategories={initialCategories} initialAnnouncements={[]} />
      </ProtectedRoute>
    );
  }

  // Server-side auth successful - proceed normally
  const initialCategories = await getCategories();
  const initialAnnouncements = await getAnnouncements(user.role === 'admin' ? 'admin' : 'user');

  // Data fetching will now be handled client-side based on user's apartment
  // We pass empty arrays to avoid prop-drilling large initial datasets
  return (
    <UnicornPropertiesApp
      initialCategories={initialCategories}
      initialAnnouncements={initialAnnouncements}
    />
  );
}
