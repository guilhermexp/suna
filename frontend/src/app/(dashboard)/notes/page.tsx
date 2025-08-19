'use client';

import { Suspense } from 'react';
import { NotesContainer } from '@/components/notes/NotesContainer';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

function NotesPageContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to access notes</p>
      </div>
    );
  }

  return (
    <NotesContainer
      userId={userId}
      className="h-full flex-1"
      showSidebar={true}
    />
  );
}

export default function NotesPage() {
  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <NotesPageContent />
      </Suspense>
    </div>
  );
}