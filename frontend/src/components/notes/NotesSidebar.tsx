'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Star, 
  Archive, 
  Clock, 
  FileText,
  Filter,
  X,
  Hash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNotes, useNoteTags, type Note } from '@/hooks/useNotes';
import { toast } from 'sonner';

interface NotesSidebarProps {
  userId: string;
  selectedNoteId?: string;
  onNoteSelect?: (note: Note) => void;
  onNoteCreate?: () => void;
  onNoteEdit?: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => void;
  className?: string;
}

type FilterState = {
  showStarred: boolean;
  showArchived: boolean;
  selectedTags: string[];
};

export function NotesSidebar({
  userId,
  selectedNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteEdit,
  onNoteDelete,
  className
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    showStarred: false,
    showArchived: false,
    selectedTags: [],
  });

  const {
    notes,
    isLoading,
    isError,
    error,
    createNote,
    isCreating
  } = useNotes(userId, {
    includeArchived: filters.showArchived,
    onlyStarred: filters.showStarred,
    enableRealtime: true
  });

  const { tags } = useNoteTags(userId);

  // Filter notes based on search query and tags
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.content_text?.toLowerCase().includes(query)
      );
    }
    
    // Apply tag filter
    if (filters.selectedTags.length > 0) {
      // This would require a relationship between notes and tags
      // For now, we'll skip this filter
      // In a real implementation, you'd filter based on note_tags table
    }
    
    return filtered;
  }, [notes, searchQuery, filters.selectedTags]);

  // Group notes by recent activity
  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {
      'Recent': [],
      'This Week': [],
      'Older': []
    };

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredNotes.forEach(note => {
      const noteDate = new Date(note.updated_at);
      
      if (noteDate >= threeDaysAgo) {
        groups['Recent'].push(note);
      } else if (noteDate >= weekAgo) {
        groups['This Week'].push(note);
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

  const clearFilters = () => {
    setFilters({
      showStarred: false,
      showArchived: false,
      selectedTags: [],
    });
    setSearchQuery('');
  };

  const hasActiveFilters = 
    filters.showStarred || 
    filters.showArchived || 
    filters.selectedTags.length > 0 || 
    searchQuery;

  const formatContent = (content: any, contentText?: string) => {
    if (contentText) {
      return contentText.slice(0, 100) + (contentText.length > 100 ? '...' : '');
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
      return text.slice(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    return 'No content';
  };

  if (isError) {
    return (
      <div className={cn("flex flex-col h-full p-4", className)}>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-destructive text-sm mb-2">Failed to load notes</p>
            <p className="text-xs text-muted-foreground">{error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Notes</h2>
          <Button 
            onClick={handleCreateNote}
            disabled={isCreating}
            size="sm"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                    {[
                      filters.showStarred ? 1 : 0,
                      filters.showArchived ? 1 : 0,
                      filters.selectedTags.length
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Show</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.showStarred}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, showStarred: checked }))
                }
              >
                <Star className="h-3 w-3 mr-2" />
                Starred only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showArchived}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, showArchived: checked }))
                }
              >
                <Archive className="h-3 w-3 mr-2" />
                Include archived
              </DropdownMenuCheckboxItem>
              
              {tags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Tags</DropdownMenuLabel>
                  {tags.slice(0, 5).map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={filters.selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({
                          ...prev,
                          selectedTags: checked
                            ? [...prev.selectedTags, tag.id]
                            : prev.selectedTags.filter(id => id !== tag.id)
                        }))
                      }
                    >
                      <Hash className="h-3 w-3 mr-2" style={{ color: tag.color }} />
                      {tag.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2 p-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedNotes).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              No notes found
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchQuery || hasActiveFilters 
                ? 'Try adjusting your search or filters' 
                : 'Create your first note to get started'
              }
            </p>
            {!searchQuery && !hasActiveFilters && (
              <Button 
                onClick={handleCreateNote} 
                disabled={isCreating}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {Object.entries(groupedNotes).map(([timeGroup, groupNotes]) => (
              <div key={timeGroup} className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground px-2 py-1">
                  {timeGroup}
                </h4>
                <div className="space-y-1">
                  {groupNotes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "p-2 rounded-md cursor-pointer transition-colors text-xs",
                        "hover:bg-muted/50",
                        selectedNoteId === note.id && "bg-muted border border-border",
                        note.is_archived && "opacity-60"
                      )}
                      onClick={() => onNoteSelect?.(note)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium line-clamp-1 flex-1 text-xs">
                          {note.title || 'Untitled'}
                        </h5>
                        <div className="flex items-center gap-1 ml-1">
                          {note.is_starred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {note.is_archived && (
                            <Archive className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2 mb-2 text-xs leading-relaxed">
                        {formatContent(note.content, note.content_text)}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-2 w-2" />
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(note.updated_at), { 
                              addSuffix: true 
                            })}
                          </span>
                        </div>
                        {note.word_count > 0 && (
                          <span className="text-xs">
                            {note.word_count}w
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}