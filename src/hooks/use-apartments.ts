import { useEffect, useState } from 'react';

import { subscribeToApartments } from '@/lib/firestore';
import type { Apartment } from '@/lib/types';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToApartments(setApartments);
    return () => unsubscribe();
  }, []);

  return { apartments };
}
