'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';

/**
 * Hook to get the count of notes for a user
 */
export function useNotesCount(userId: string | null) {
  const supabase = useSupabase();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const fetchNotesCount = async () => {
      try {
        setIsLoading(true);
        const { count: notesCount, error } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .eq('is_archived', false); // Only count non-archived, non-deleted notes

        if (error) {
          console.error('Error fetching notes count:', error);
          setCount(0);
        } else {
          setCount(notesCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notes count:', error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotesCount();

    // Set up realtime subscription for count updates
    const subscription = supabase
      .channel(`notes_count_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch count when notes change
          fetchNotesCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase]);

  return {
    count,
    isLoading,
  };
}