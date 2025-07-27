import { useEffect, useState } from 'react';

import { getApartments } from '@/lib/firestore';
import type { Apartment } from '@/lib/types';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    const fetchApartments = async () => {
      const data = await getApartments();
      setApartments(data);
    };
    fetchApartments();
  }, []);

  return { apartments };
}
