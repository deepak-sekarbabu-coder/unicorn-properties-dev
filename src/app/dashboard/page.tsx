import { getCategories } from '@/lib/firestore';

import { UnicornPropertiesApp } from '@/components/unicorn-properties-app';

export default async function DashboardPage() {
  // This page is now reached only after successful server-side authentication and redirection from the root page.
  // Client-side authentication (via AuthProvider and ProtectedRoute) will handle subsequent session validity.
  const initialCategories = await getCategories();

  return <UnicornPropertiesApp initialCategories={initialCategories} />;
}