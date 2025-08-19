'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  tags: string[];
}

interface NotesListProps {
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

export default function NotesList({ 
  selectedNoteId, 
  onSelectNote, 
  onCreateNote,
  onDeleteNote 
}: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Fetch notes from API
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes');
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const response = await fetch(`/api/notes/${noteId}/star`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !note.is_starred })
      });

      if (response.ok) {
        setNotes(notes.map(n => 
          n.id === noteId 
            ? { ...n, is_starred: !n.is_starred }
            : n
        ));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setNotes(notes.filter(n => n.id !== noteId));
          onDeleteNote(noteId);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  // Filter notes based on search
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort notes: starred first, then by updated_at
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const extractPreview = (content: string) => {
    // Remove HTML/Markdown and get plain text preview
    const text = content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Minhas Notas
          </h2>
          <button
            onClick={onCreateNote}
            className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            title="Nova nota"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma nota encontrada</p>
            <p className="text-sm mt-2">Crie sua primeira nota para começar</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedNoteId === note.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {note.title || 'Sem título'}
                      </h3>
                      {note.is_starred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {extractPreview(note.content)}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(new Date(note.updated_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                      
                      {note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === note.id ? null : note.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {menuOpenId === note.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                        <button
                          onClick={(e) => toggleStar(note.id, e)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {note.is_starred ? (
                            <>
                              <StarOff className="w-4 h-4" />
                              Remover estrela
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" />
                              Adicionar estrela
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note.id);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        
                        <button
                          onClick={(e) => handleDelete(note.id, e)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}