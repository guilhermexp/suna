'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { type Note } from '@/hooks/useNotes';
import { toast } from 'sonner';

interface NotesContainerProps {
  userId: string;
  initialNoteId?: string;
  className?: string;
  showSidebar?: boolean;
  onBack?: () => void;
}

type ViewState = 'list' | 'editor' | 'split';

export function NotesContainer({
  userId,
  initialNoteId,
  className,
  showSidebar = true,
  onBack
}: NotesContainerProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId || null);
  const [viewState, setViewState] = useState<ViewState>(
    initialNoteId ? 'editor' : 'list'
  );
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-adjust view state based on screen size
  React.useEffect(() => {
    if (isMobile) {
      // Mobile: switch between list and editor
      if (selectedNoteId) {
        setViewState('editor');
      } else {
        setViewState('list');
      }
    } else {
      // Desktop: show list or editor based on selection
      if (selectedNoteId) {
        setViewState('editor');
      } else {
        setViewState('list');
      }
    }
  }, [selectedNoteId, isMobile]);

  const handleNoteSelect = useCallback((note: Note) => {
    setSelectedNoteId(note.id);
    if (isMobile) {
      setViewState('editor');
    }
  }, [isMobile]);

  const handleNoteCreate = useCallback(() => {
    toast.success('Note created successfully');
  }, []);

  const handleNoteEdit = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    setViewState('editor');
  }, []);

  const handleNoteDelete = useCallback((noteId: string) => {
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setViewState('list');
    }
  }, [selectedNoteId]);

  const handleBackToList = useCallback(() => {
    setSelectedNoteId(null);
    setViewState('list');
  }, []);

  const handleEditorBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      handleBackToList();
    }
  }, [onBack, handleBackToList]);

  const handleNoteSave = useCallback((note: Note) => {
    // Handle note save - could trigger UI updates, analytics, etc.
    console.log('Note saved:', note.id);
  }, []);

  const renderContent = () => {
    switch (viewState) {
      case 'list':
        return (
          <NotesList
            userId={userId}
            onNoteSelect={handleNoteSelect}
            onNoteCreate={handleNoteCreate}
            onNoteEdit={handleNoteEdit}
            onNoteDelete={handleNoteDelete}
            selectedNoteId={selectedNoteId || undefined}
            className="h-full"
          />
        );

      case 'editor':
        return selectedNoteId ? (
          <NoteEditor
            noteId={selectedNoteId}
            userId={userId}
            onBack={handleEditorBack}
            onSave={handleNoteSave}
            onDelete={handleNoteDelete}
            className="h-full"
            enableRealtime={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No note selected</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Mobile header */}
      {isMobile && viewState === 'editor' && (
        <div className="p-4 border-b border-border/40 md:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold">Edit Note</h1>
          </div>
        </div>
      )}

      {/* Main content - removido o Card wrapper que estava adicionando espaço */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}