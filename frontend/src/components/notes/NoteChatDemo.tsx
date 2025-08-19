'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Users, 
  Zap,
  CheckCircle,
  Eye,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { NoteEditor } from './NoteEditor';

interface NoteChatDemoProps {
  className?: string;
}

export function NoteChatDemo({ className }: NoteChatDemoProps) {
  const [selectedDemo, setSelectedDemo] = useState<'overview' | 'editor'>('overview');
  
  // Mock data for demonstration
  const mockNoteId = 'demo-note-123';
  const mockUserId = 'demo-user-456';

  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Instant messaging with live updates via Supabase Realtime',
      status: 'implemented'
    },
    {
      icon: Users,
      title: 'Presence System',
      description: 'See who\'s online and actively viewing the note',
      status: 'implemented'
    },
    {
      icon: Zap,
      title: 'Typing Indicators',
      description: 'Live typing indicators with auto-cleanup',
      status: 'implemented'
    },
    {
      icon: CheckCircle,
      title: 'Message Reactions',
      description: 'React to messages with emojis',
      status: 'implemented'
    },
    {
      icon: Eye,
      title: 'Read Receipts',
      description: 'Track message read status',
      status: 'implemented'
    },
    {
      icon: UserPlus,
      title: 'Message Mentions',
      description: 'Mention users with @ syntax',
      status: 'planned'
    }
  ];

  const stats = [
    { label: 'Messages', value: '1,234', change: '+12%' },
    { label: 'Active Users', value: '45', change: '+8%' },
    { label: 'Response Time', value: '<100ms', change: 'stable' },
    { label: 'Uptime', value: '99.9%', change: '+0.1%' }
  ];

  return (
    <div className={className}>
      {selectedDemo === 'overview' ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <MessageCircle className="h-4 w-4" />
              Note Chat System
            </div>
            <h1 className="text-3xl font-bold">Collaborative Note Chat</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real-time chat system integrated with notes, featuring presence awareness, 
              typing indicators, message reactions, and seamless Supabase integration.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-green-600">{stat.change}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={feature.status === 'implemented' ? 'default' : 'secondary'}
                          >
                            {feature.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Architecture Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>
                Built on modern technologies for real-time collaboration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Frontend</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>React + TypeScript</div>
                    <div>Shadcn/ui Components</div>
                    <div>TanStack Query</div>
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Backend</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Supabase Database</div>
                    <div>Realtime Subscriptions</div>
                    <div>Presence System</div>
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Features</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Message Reactions</div>
                    <div>Typing Indicators</div>
                    <div>Read Receipts</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Actions */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setSelectedDemo('editor')}
              className="flex items-center gap-2"
            >
              Try Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              View Documentation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Demo Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Live Chat Demo</h2>
              <p className="text-muted-foreground">
                Interactive demonstration of the note chat system
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedDemo('overview')}
            >
              Back to Overview
            </Button>
          </div>

          <Separator />

          {/* Demo Warning */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">Demo Mode</div>
                  <div className="text-sm text-muted-foreground">
                    This is a demonstration with mock data. In production, this would connect to your Supabase database.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Editor Demo */}
          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <NoteEditor
              noteId={mockNoteId}
              userId={mockUserId}
              enableChat={true}
              defaultChatVisible={true}
              enableRealtime={false} // Disabled for demo
              className="h-full"
            />
          </div>

          {/* Demo Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">1</Badge>
                  <div>
                    <div className="font-medium">Chat Toggle</div>
                    <div className="text-sm text-muted-foreground">
                      Click the message icon in the header to show/hide the chat panel
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">2</Badge>
                  <div>
                    <div className="font-medium">Send Messages</div>
                    <div className="text-sm text-muted-foreground">
                      Type in the chat input and press Enter to send messages
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">3</Badge>
                  <div>
                    <div className="font-medium">Message Reactions</div>
                    <div className="text-sm text-muted-foreground">
                      Hover over messages and click the smile icon to add reactions
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">4</Badge>
                  <div>
                    <div className="font-medium">Reply to Messages</div>
                    <div className="text-sm text-muted-foreground">
                      Click the reply icon to respond to specific messages
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}