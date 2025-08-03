import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getUserByEmail } from '@/lib/firestore';

async function verifySessionCookie(sessionCookie: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    return await getAuth(adminApp).verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session cookie from request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and get user
    let decodedToken;
    try {
      decodedToken = await verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserByEmail(decodedToken.email!);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const { title, message, expiresAt, priority = 'medium' } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Get admin Firestore instance
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all apartments to include in the announcement
    const usersSnapshot = await adminDb.collection('users').get();
    const apartments = new Set<string>();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.apartment) {
        apartments.add(userData.apartment);
      }
    });

    const apartmentsList = Array.from(apartments);
    console.log('Found apartments:', apartmentsList);

    if (apartmentsList.length === 0) {
      return NextResponse.json(
        { error: 'No apartments found to send announcements to' },
        { status: 400 }
      );
    }

    // Create a single announcement notification with all apartments in toApartmentId array
    const notificationData: {
      type: string;
      title: string;
      message: string;
      toApartmentId: string[];
      createdBy: string;
      priority: string;
      isRead: { [key: string]: boolean };
      createdAt: string;
      expiresAt: string | null;
      isActive: boolean;
    } = {
      type: 'announcement',
      title,
      message,
      toApartmentId: apartmentsList, // Array of all apartment IDs
      createdBy: user.id,
      priority,
      isRead: {}, // Object to track read status per apartment
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      isActive: true,
    };

    // Initialize isRead object with all apartments set to false
    apartmentsList.forEach(apartmentId => {
      notificationData.isRead[apartmentId] = false;
    });

    console.log('Creating single announcement notification:', notificationData);
    const notificationResult = await adminDb.collection('notifications').add(notificationData);
    console.log('Created announcement notification:', notificationResult.id);

    return NextResponse.json({
      success: true,
      notificationId: notificationResult.id,
      apartmentsNotified: apartmentsList,
      totalApartments: apartmentsList.length,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
