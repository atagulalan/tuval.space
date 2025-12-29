import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { db, onSnapshot } from '@/lib/firebase';
import { Board } from '@/types';

export const useBoard = (boardId: string | null) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId) {
      setBoard(null);
      setLoading(false);
      return;
    }

    const boardRef = doc(db, 'boards', boardId);
    const unsubscribe = onSnapshot(
      boardRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBoard(snapshot.data() as Board);
        } else {
          setBoard(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to board:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return { board, loading };
};








