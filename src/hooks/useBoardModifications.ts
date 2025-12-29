import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { db, onSnapshot } from '@/lib/firebase';
import { DenseModification } from '@/types';

export const useBoardModifications = (boardId: string | null) => {
  const [modifications, setModifications] = useState<DenseModification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId) {
      setModifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
    const q = query(
      modificationsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const modificationsData = snapshot.docs.map(
          (doc) => doc.data() as DenseModification
        );
        setModifications(modificationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to modifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return { modifications, loading };
};





