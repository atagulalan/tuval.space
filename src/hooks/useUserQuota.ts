import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { db, onSnapshot } from '@/lib/firebase';
import { User } from '@/types';

export const useUserQuota = (userId: string | null) => {
  const [quota, setQuota] = useState<number>(0);

  useEffect(() => {
    if (!userId) {
      setQuota(0);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as User;
          setQuota(userData.pixelQuota);
        }
      },
      (error) => {
        console.error('Error listening to user quota:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return quota;
};








