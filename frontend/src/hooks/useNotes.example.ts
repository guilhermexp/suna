/**
 * Examples of how to use the Notes hooks
 * 
 * This file demonstrates the various ways to use the Supabase Notes hooks
 * for managing notes, tags, messages, and preferences with TypeScript.
 */

import { 
  useNotes, 
  useNoteTags, 
  useNoteMessages, 
  useNoteSearch, 
  useNotePreferences,
  useSingleNote,
  type Note,
  type Tag,
  type NoteMessage,
} from './useNotes';
import { useAuth } from './useSupabase';

// Example React component using the notes hooks
export function NotesExample() {
  // Get current user
  const { getUser } = useAuth();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    getUser().then(({ data }) => setUser(data.user));
  }, [getUser]);

  // 1. Basic Notes Management
  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    toggleStar,
    toggleArchive,
    isCreating,
    isUpdating,
  } = useNotes(user?.id, {
    limit: 20,
    orderBy: 'updated_at',
    ascending: false,
    includeArchived: false,
    enableRealtime: true,
  });

  // 2. Tags Management
  const {
    tags,
    createTag,
    addTagToNote,
    removeTagFromNote,
    isManagingNoteTags,
  } = useNoteTags(user?.id);

  // 3. Search Functionality
  const {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    clearSearch,
  } = useNoteSearch(user?.id);

  // 4. User Preferences
  const {
    preferences,
    updatePreferences,
    isUpdating: isUpdatingPreferences,
  } = useNotePreferences(user?.id);

  // Example: Create a new note
  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'My New Note',
        content: { type: 'doc', content: [] }, // TipTap JSON format
        content_text: 'This is a new note',
      });
      console.log('Note created:', newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Example: Update a note
  const handleUpdateNote = async (noteId: string, changes: Partial<Note>) => {
    try {
      const updatedNote = await updateNote({ noteId, data: changes });
      console.log('Note updated:', updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Example: Create and add a tag to a note
  const handleAddTagToNote = async (noteId: string, tagName: string) => {
    try {
      // First create the tag
      const newTag = await createTag({
        name: tagName,
        color: '#3b82f6', // Blue color
      });

      // Then add it to the note
      await addTagToNote({ noteId, tagId: newTag.id });
      console.log('Tag added to note');
    } catch (error) {
      console.error('Failed to add tag to note:', error);
    }
  };

  // Example: Search notes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Example: Update user preferences
  const handleUpdatePreferences = async () => {
    try {
      await updatePreferences({
        editor_font_size: 14,
        editor_theme: 'dark',
        auto_save: true,
        auto_save_interval: 30000, // 30 seconds
      });
      console.log('Preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="p-4">
      <h1>Notes Dashboard</h1>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {isSearching && <p>Searching...</p>}
        {searchResults.length > 0 && (
          <div className="mt-2">
            <p>Found {searchResults.length} results</p>
          </div>
        )}
      </div>

      {/* Create Note Button */}
      <button
        onClick={handleCreateNote}
        disabled={isCreating}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isCreating ? 'Creating...' : 'Create Note'}
      </button>

      {/* Notes List */}
      {isLoading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note.id} className="p-4 border rounded">
              <h3 className="font-bold">{note.title || 'Untitled'}</h3>
              <p className="text-gray-600">{note.content_text}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => toggleStar({ noteId: note.id, isStarred: !note.is_starred })}
                  className={`px-2 py-1 rounded ${note.is_starred ? 'bg-yellow-200' : 'bg-gray-200'}`}
                >
                  {note.is_starred ? '⭐' : '☆'}
                </button>
                <button
                  onClick={() => toggleArchive({ noteId: note.id, isArchived: !note.is_archived })}
                  className={`px-2 py-1 rounded ${note.is_archived ? 'bg-gray-400' : 'bg-gray-200'}`}
                >
                  {note.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="px-2 py-1 bg-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 rounded text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.icon} {tag.name} ({tag.usage_count})
            </span>
          ))}
        </div>
      </div>

      {/* Preferences */}
      {preferences && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Font Size: {preferences.editor_font_size}px</label>
            </div>
            <div>
              <label>Theme: {preferences.editor_theme}</label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.auto_save}
                  onChange={(e) =>
                    updatePreferences({ auto_save: e.target.checked })
                  }
                />
                Auto Save
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Example: Using a single note with messages (chat)
export function NoteWithChatExample({ noteId }: { noteId: string }) {
  const {
    note,
    updateNote,
    isLoading: isLoadingNote,
  } = useSingleNote(noteId);

  const {
    messages,
    sendMessage,
    updateMessage,
    deleteMessage,
    isSending,
    isLoading: isLoadingMessages,
  } = useNoteMessages(noteId, {
    enableRealtime: true,
  });

  const [messageText, setMessageText] = React.useState('');

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await sendMessage({
        content: messageText,
        contentType: 'text',
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoadingNote) {
    return <div>Loading note...</div>;
  }

  if (!note) {
    return <div>Note not found</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Note Editor */}
      <div className="flex-1 p-4">
        <input
          type="text"
          value={note.title || ''}
          onChange={(e) => updateNote({ title: e.target.value })}
          className="w-full text-2xl font-bold border-none outline-none mb-4"
          placeholder="Note title..."
        />
        <div className="prose max-w-none">
          {/* Here you would integrate with your TipTap editor */}
          <textarea
            value={note.content_text || ''}
            onChange={(e) => updateNote({ content_text: e.target.value })}
            className="w-full h-96 p-4 border rounded"
            placeholder="Start writing..."
          />
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-bold">Chat</h3>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingMessages ? (
            <div>Loading messages...</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="p-2 bg-gray-100 rounded"
              >
                <p>{message.content}</p>
                <small className="text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !messageText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}