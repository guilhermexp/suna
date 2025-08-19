/**
 * Configuration for Notes and Chat integration
 */

export const notesConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    endpoints: {
      notes: '/api/notes',
      chats: '/api/chats',
      messages: '/api/messages',
      users: '/api/users',
    }
  },
  
  socket: {
    url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000',
    options: {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }
  },

  editor: {
    // TipTap editor configuration
    placeholder: 'Comece a escrever sua nota...',
    autofocus: true,
    editable: true,
    maxLength: 50000,
    
    // Toolbar options
    toolbar: {
      bold: true,
      italic: true,
      underline: true,
      strike: true,
      code: true,
      heading: true,
      bulletList: true,
      orderedList: true,
      blockquote: true,
      codeBlock: true,
      horizontalRule: true,
      link: true,
      image: true,
      youtube: true,
      table: true,
      mention: true,
    },
    
    // Mention configuration for @ mentions in editor
    mentions: {
      HTMLAttributes: {
        class: 'mention',
      },
      renderLabel({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
      },
      suggestion: {
        char: '@',
        startOfLine: false,
        // You'll need to implement the suggestion items function
      }
    }
  },

  chat: {
    // Chat configuration
    maxMessageLength: 5000,
    typingIndicatorDelay: 1000,
    messageHistoryLimit: 100,
    
    // File upload settings
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/markdown',
      ],
    },
    
    // Real-time settings
    realtime: {
      enabled: true,
      pingInterval: 30000, // 30 seconds
      pongTimeout: 60000, // 60 seconds
    }
  },

  // Storage configuration
  storage: {
    // Local storage keys
    keys: {
      currentNote: 'current_note_id',
      notesCache: 'notes_cache',
      chatHistory: 'chat_history',
      userPreferences: 'user_preferences',
    },
    
    // Cache settings
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50, // Maximum number of cached items
    }
  },

  // UI Configuration
  ui: {
    // Theme
    theme: {
      default: 'light',
      options: ['light', 'dark', 'system'],
    },
    
    // Layout
    layout: {
      sidebarWidth: 320,
      sidebarCollapsible: true,
      chatPanelWidth: 400,
      chatPanelPosition: 'right', // 'right' | 'bottom' | 'floating'
    },
    
    // Animations
    animations: {
      enabled: true,
      duration: 200,
    }
  },

  // Feature flags
  features: {
    notes: true,
    chat: true,
    collaboration: false, // Real-time collaboration
    aiAssistant: true,
    voiceRecording: false,
    videoMessages: false,
    encryption: false,
    offline: true,
  }
};

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${notesConfig.api.baseUrl}${endpoint}`;
};

export const getSocketUrl = (): string => {
  return notesConfig.socket.url;
};

// Export type for TypeScript
export type NotesConfig = typeof notesConfig;