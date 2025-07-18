import { ApartmentShareApp } from '@/components/apartment-share-app';
import { users, categories, expenses } from '@/lib/data';

export default function Home() {
  // In a real application, this data would be fetched from a database.
  // We pass it to a client component to allow for interactive state management.
  return <ApartmentShareApp initialUsers={users} initialCategories={categories} initialExpenses={expenses} />;
}
