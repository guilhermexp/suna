'use client';

import React from 'react';
import { NotesContainer } from './NotesContainer';

/**
 * Example usage of the Notes system
 * This shows how to integrate the notes components into your app
 */

interface NotesPageProps {
  userId: string;
  noteId?: string;
}

export function NotesPage({ userId, noteId }: NotesPageProps) {
  const handleBack = () => {
    // Navigate back to previous page
    // This could be using Next.js router, React Router, etc.
    console.log('Navigating back...');
  };

  return (
    <div className="h-screen w-full">
      <NotesContainer
        userId={userId}
        initialNoteId={noteId}
        showSidebar={true}
        onBack={handleBack}
        className="h-full"
      />
    </div>
  );
}

/**
 * Example usage in a Next.js page
 */
export function NotesPageExample() {
  // In a real app, you'd get the userId from your auth system
  const userId = 'user-123';
  
  return (
    <div className="min-h-screen bg-background">
      <NotesPage userId={userId} />
    </div>
  );
}

/**
 * Example usage for editing a specific note
 */
export function EditNotePageExample({ noteId }: { noteId: string }) {
  const userId = 'user-123';
  
  return (
    <div className="min-h-screen bg-background">
      <NotesPage userId={userId} noteId={noteId} />
    </div>
  );
}

/**
 * Example integration with authentication
 */
export function AuthenticatedNotesPage() {
  // Example using a hypothetical auth hook
  // const { user, isLoading } = useAuth();
  
  // Placeholder for demonstration
  const user = { id: 'user-123' };
  const isLoading = false;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-muted-foreground">You need to be logged in to access notes.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NotesPage userId={user.id} />
    </div>
  );
}

export default NotesPageExample;