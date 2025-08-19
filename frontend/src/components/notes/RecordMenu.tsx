'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mic, ArrowUpFromLine, FileAudio } from 'lucide-react';

interface RecordMenuProps {
  onRecord: () => void;
  onCaptureAudio: () => void;
  onUpload: () => void;
  children: React.ReactNode;
}

export function RecordMenu({ onRecord, onCaptureAudio, onUpload, children }: RecordMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[170px] text-sm rounded-xl px-1 py-1.5 z-50 bg-white dark:bg-gray-850 dark:text-white shadow-lg font-primary" sideOffset={8} side="bottom" align="start">
        <DropdownMenuItem onClick={() => { onRecord(); setOpen(false); }} className="flex rounded-md py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Mic className="size-4 mr-2" strokeWidth={2} />
          <span>Record</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { onCaptureAudio(); setOpen(false); }} className="flex rounded-md py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <FileAudio className="size-4 mr-2" strokeWidth={2} />
          <span>Capture Audio</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { onUpload(); setOpen(false); }} className="flex rounded-md py-1.5 px-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <ArrowUpFromLine className="size-4 mr-2" strokeWidth={2} />
          <span>Upload Audio</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
