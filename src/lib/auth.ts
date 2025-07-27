import { User as FirebaseUser, getAuth, onAuthStateChanged } from 'firebase/auth';

import * as React from 'react';

import { app } from './firebase';

export const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
