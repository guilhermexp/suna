'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Mic, MousePointer2, Upload } from 'lucide-react';

interface RecordMenuProps {
  onRecord: () => void;
  onCaptureAudio: () => void;
  onUpload: () => void;
  children?: React.ReactNode;
}

export function RecordMenu({
  onRecord,
  onCaptureAudio,
  onUpload,
  children
}: RecordMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-lg"
            variant="default"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuItem onClick={onRecord}>
          <Mic className="mr-2 h-4 w-4" />
          Record
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCaptureAudio}>
          <MousePointer2 className="mr-2 h-4 w-4" />
          Capture Audio
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Audio
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}