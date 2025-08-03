import { getAuth, onAuthStateChanged } from 'firebase/auth';

import * as React from 'react';

import { app } from './firebase';
import { getUserByEmail } from './firestore';
import type { User } from './types';

export const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser && firebaseUser.email) {
        const firestoreUser = await getUserByEmail(firebaseUser.email);
        setUser(firestoreUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
