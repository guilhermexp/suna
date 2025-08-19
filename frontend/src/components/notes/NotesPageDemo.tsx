'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NotesContainer, NotesList, NoteEditor, NotesSidebar } from './index';

/**
 * Demo page showing all notes components in action
 * This is for development and testing purposes
 */
export function NotesPageDemo() {
  const demoUserId = 'demo-user-123';
  const demoNoteId = 'demo-note-456';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Notes System Demo</h1>
          <p className="text-muted-foreground text-lg">
            Complete notes system with TipTap editor, real-time collaboration, and responsive design
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">TipTap</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="secondary">Supabase</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
          </div>
        </div>

        <Separator />

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Rich Editor</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              TipTap editor with formatting, tables, images, and code blocks
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Real-time Sync</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Auto-save, live collaboration, and instant updates
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Responsive Design</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Adaptive layout for mobile, tablet, and desktop
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Full-Featured</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Search, filters, tags, export, sharing, and more
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs defaultValue="full-app" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="full-app">Full App</TabsTrigger>
            <TabsTrigger value="notes-list">Notes List</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
          </TabsList>

          {/* Full Application */}
          <TabsContent value="full-app" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Notes Application</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Full-featured notes app with sidebar, editor, and responsive layout
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <NotesContainer
                    userId={demoUserId}
                    showSidebar={true}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes List */}
          <TabsContent value="notes-list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes List Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grid and list views with search, filters, and note management
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <NotesList
                    userId={demoUserId}
                    viewMode="grid"
                    onNoteSelect={(note) => console.log('Selected:', note)}
                    onNoteCreate={() => console.log('Create new note')}
                    onNoteEdit={(id) => console.log('Edit note:', id)}
                    onNoteDelete={(id) => console.log('Delete note:', id)}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor */}
          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Note Editor Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rich text editor with TipTap, auto-save, and collaboration
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <NoteEditor
                    noteId={demoNoteId}
                    userId={demoUserId}
                    enableRealtime={true}
                    onBack={() => console.log('Back to list')}
                    onSave={(note) => console.log('Note saved:', note)}
                    onDelete={(id) => console.log('Note deleted:', id)}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sidebar */}
          <TabsContent value="sidebar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes Sidebar Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compact sidebar for quick navigation and note management
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] w-80 border rounded-lg overflow-hidden">
                  <NotesSidebar
                    userId={demoUserId}
                    selectedNoteId={demoNoteId}
                    onNoteSelect={(note) => console.log('Selected:', note)}
                    onNoteCreate={() => console.log('Create new note')}
                    onNoteEdit={(id) => console.log('Edit note:', id)}
                    onNoteDelete={(id) => console.log('Delete note:', id)}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Import Components</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { NotesContainer } from '@/components/notes';`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Use in Your App</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`function NotesPage({ userId }) {
  return (
    <NotesContainer
      userId={userId}
      showSidebar={true}
      onBack={() => router.back()}
    />
  );
}`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Required Dependencies</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`npm install @tiptap/react @tiptap/starter-kit \\
  @tiptap/extension-placeholder @tiptap/extension-character-count \\
  @tiptap/extension-typography @tiptap/extension-link \\
  @tiptap/extension-image @tiptap/extension-task-list \\
  @tiptap/extension-task-item @tiptap/extension-table \\
  @tiptap/extension-table-row @tiptap/extension-table-cell \\
  @tiptap/extension-table-header @tiptap/extension-code-block-lowlight \\
  @tiptap/extension-text-align @tiptap/extension-underline \\
  lowlight date-fns sonner`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Built with React, TypeScript, TipTap, and shadcn/ui</p>
          <p>Ready for production use with Supabase backend</p>
        </div>
      </div>
    </div>
  );
}

export default NotesPageDemo;