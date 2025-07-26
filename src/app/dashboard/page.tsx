
import { ApartmentShareApp } from '@/components/apartment-share-app';
import { getUsers, getCategories, getExpenses, getAnnouncements } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getAuthenticatedUser() {
    const cookieStore = cookies();
    const userRoleCookie = cookieStore.get('user-role');
    
    // In a real production app, you'd likely have a more robust session check,
    // possibly verifying a session token with a backend.
    // For this app, the presence of the 'user-role' cookie serves as our
    // indicator of an authenticated session on the server.
    if (!userRoleCookie) {
        return null;
    }
    return {
        role: userRoleCookie.value as 'admin' | 'user'
    };
}


export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  // In a real application, this data would be fetched from a database.
  // We pass it to a client component to allow for interactive state management.
  const initialUsers = await getUsers();
  const initialCategories = await getCategories();
  const initialExpenses = await getExpenses();
  const initialAnnouncements = await getAnnouncements(user.role);

  return <ApartmentShareApp 
            initialUsers={initialUsers} 
            initialCategories={initialCategories} 
            initialExpenses={initialExpenses}
            initialAnnouncements={initialAnnouncements} 
        />;
}
