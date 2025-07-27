// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.
'use client';

import { useAuth } from '@/context/auth-context';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

// This page will handle redirection based on auth status.
// In a real app, this logic would likely be in middleware.

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading state is settled
    if (!loading) {
      // If there is a user, go to the dashboard
      if (user) {
        router.replace('/dashboard');
      } else {
        // If there is no user, go to the login page
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading skeleton while we determine the auth status
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
