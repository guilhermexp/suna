'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  Star, 
  Clock, 
  FileText,
  Archive,
  Trash2,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNotes, useNoteTags, type Note } from '@/hooks/useNotes';
import { toast } from 'sonner';

interface NotesListProps {
  userId: string;
  viewMode?: 'grid' | 'list';
  onNoteSelect?: (note: Note) => void;
  onNoteCreate?: () => void;
  onNoteEdit?: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => void;
  selectedNoteId?: string;
  className?: string;
}

export function NotesList({
  userId,
  viewMode = 'grid',
  onNoteSelect,
  onNoteCreate,
  onNoteEdit,
  onNoteDelete,
  selectedNoteId,
  className
}: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [showArchived, setShowArchived] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);

  const {
    notes,
    isLoading,
    isError,
    error,
    createNote,
    toggleStar,
    toggleArchive,
    deleteNote,
    isCreating,
    isDeleting,
    isTogglingStatus
  } = useNotes(userId, {
    includeArchived: showArchived,
    onlyStarred,
    enableRealtime: true
  });

  const { tags } = useNoteTags(userId);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note => 
      note.title?.toLowerCase().includes(query) ||
      note.content_text?.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  // Group notes by time period
  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    filteredNotes.forEach(note => {
      const noteDate = new Date(note.updated_at);
      
      if (noteDate >= today) {
        groups['Today'].push(note);
      } else if (noteDate >= yesterday) {
        groups['Yesterday'].push(note);
      } else if (noteDate >= weekAgo) {
        groups['This Week'].push(note);
      } else if (noteDate >= monthAgo) {
        groups['This Month'].push(note);
      } else {
        groups['Older'].push(note);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredNotes]);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled',
        content: { type: 'doc', content: [] },
        content_text: '',
        is_starred: false,
        is_archived: false,
        word_count: 0,
        reading_time: 0
      });
      
      if (newNote && onNoteEdit) {
        onNoteEdit(newNote.id);
      }
      
      if (onNoteCreate) {
        onNoteCreate();
      }
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleToggleStar = async (noteId: string, isStarred: boolean) => {
    try {
      await toggleStar({ noteId, isStarred: !isStarred });
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleToggleArchive = async (noteId: string, isArchived: boolean) => {
    try {
      await toggleArchive({ noteId, isArchived: !isArchived });
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success('Note deleted successfully');
      
      if (onNoteDelete) {
        onNoteDelete(noteId);
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatContent = (content: any, contentText?: string) => {
    if (contentText) {
      return contentText.slice(0, 200) + (contentText.length > 200 ? '...' : '');
    }
    
    if (content && typeof content === 'object') {
      // Extract text from TipTap JSON
      const extractText = (node: any): string => {
        if (node.type === 'text') {
          return node.text || '';
        }
        if (node.content) {
          return node.content.map(extractText).join('');
        }
        return '';
      };
      
      const text = extractText(content);
      return text.slice(0, 200) + (text.length > 200 ? '...' : '');
    }
    
    return 'No content';
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load notes</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {/* Header - ALWAYS SHOWN */}
      <div className="px-6 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Notes</h1>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={currentViewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={onlyStarred ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnlyStarred(!onlyStarred)}
          >
            <Star className="h-4 w-4 mr-2" />
            Starred
          </Button>
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-auto",
        currentViewMode === 'list' ? "p-3" : "p-6"
      )}>
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-3" />
                <div className={cn(
                  "grid gap-4",
                  currentViewMode === 'grid' 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                )}>
                  {Array.from({ length: currentViewMode === 'grid' ? 6 : 3 }).map((_, j) => (
                    <Card key={j}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedNotes).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first note to get started'}
            </p>
          </div>
        ) : currentViewMode === 'list' ? (
          // List mode - compact view
          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "p-3 cursor-pointer hover:bg-accent/50 transition-colors border-b",
                  selectedNoteId === note.id && "bg-accent"
                )}
                onClick={() => onNoteSelect?.(note)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm line-clamp-1 flex-1">
                    {note.title || 'Untitled'}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 hover:opacity-100 focus:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(note.id, note.is_starred);
                      }}>
                        <Star className="h-3 w-3 mr-2" />
                        {note.is_starred ? 'Unstar' : 'Star'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArchive(note.id, note.is_archived);
                      }}>
                        <Archive className="h-3 w-3 mr-2" />
                        {note.is_archived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                  {note.content_text || 'No content'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {note.is_starred && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                  <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid mode - cards view
          <div className="space-y-6">
            {Object.entries(groupedNotes).map(([timeGroup, groupNotes]) => (
              <div key={timeGroup}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {timeGroup}
                </h3>
                <div className={cn(
                  "grid gap-4",
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}>
                  {groupNotes.map((note) => (
                    <Card 
                      key={note.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        "h-[120px] overflow-hidden",
                        selectedNoteId === note.id && "ring-2 ring-primary",
                        note.is_archived && "opacity-60"
                      )}
                      onClick={() => onNoteSelect?.(note)}
                    >
                      <div className="p-3 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold line-clamp-1 flex-1">
                            {note.title || 'Untitled'}
                          </h4>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {note.is_starred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {note.is_archived && (
                              <Archive className="h-3 w-3 text-muted-foreground" />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onNoteEdit?.(note.id);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(note.id, note.is_starred);
                                }}>
                                  <Star className="h-4 w-4 mr-2" />
                                  {note.is_starred ? 'Unstar' : 'Star'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleArchive(note.id, note.is_archived);
                                }}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  {note.is_archived ? 'Unarchive' : 'Archive'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNote(note.id);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-3 flex-1 overflow-hidden">
                          {formatContent(note.content, note.content_text)}
                        </p>
                        
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-auto pt-2">
                          <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                          <span>Por {note.author_name || 'Unknown'}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <Button
        onClick={handleCreateNote}
        disabled={isCreating}
        size="icon"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg transition-all hover:scale-105 z-40"
        variant="default"
      >
        <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );
}