import { ApartmentShareApp } from '@/components/apartment-share-app';
import { getUsers, getCategories, getExpenses, getAnnouncements } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

async function getUserRole() {
    // This is a simplified way to get the user's role on the server.
    // In a real app, you would likely use a more secure method like custom claims
    // or a server-side session that includes the user's role.
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user-role');
    return userCookie?.value as 'admin' | 'user' | undefined;
}


export default async function DashboardPage() {
  // In a real application, this data would be fetched from a database.
  // We pass it to a client component to allow for interactive state management.
  const initialUsers = await getUsers();
  const initialCategories = await getCategories();
  const initialExpenses = await getExpenses();
  const role = await getUserRole() || 'user';
  const initialAnnouncements = await getAnnouncements(role);

  return <ApartmentShareApp 
            initialUsers={initialUsers} 
            initialCategories={initialCategories} 
            initialExpenses={initialExpenses}
            initialAnnouncements={initialAnnouncements} 
        />;
}
