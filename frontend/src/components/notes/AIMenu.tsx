'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle } from 'lucide-react';

interface AIMenuProps {
  onEnhance: () => void;
  onChat: () => void;
  children?: React.ReactNode;
}

export function AIMenu({
  onEnhance,
  onChat,
  children
}: AIMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-lg"
            variant="default"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-48">
        <DropdownMenuItem onClick={onEnhance}>
          <Sparkles className="mr-2 h-4 w-4" />
          Enhance
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChat}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}