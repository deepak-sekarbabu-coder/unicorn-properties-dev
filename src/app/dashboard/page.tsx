import { ApartmentShareApp } from '@/components/apartment-share-app';
import { getUsers, getCategories, getExpenses } from '@/lib/firestore';

export default async function DashboardPage() {
  // In a real application, this data would be fetched from a database.
  // We pass it to a client component to allow for interactive state management.
  const initialUsers = await getUsers();
  const initialCategories = await getCategories();
  const initialExpenses = await getExpenses();

  return <ApartmentShareApp initialUsers={initialUsers} initialCategories={initialCategories} initialExpenses={initialExpenses} />;
}
