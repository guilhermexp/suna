'use client';

import React, { useState } from 'react';
import { FileAudio, File, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FileItemProps {
  className?: string;
  colorClassName?: string;
  url?: string | null;
  dismissible?: boolean;
  modal?: boolean;
  loading?: boolean;
  item?: any;
  edit?: boolean;
  small?: boolean;
  name: string;
  type: string;
  size?: number;
  onDismiss?: () => void;
  onClick?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function decodeString(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

export function FileItem({
  className = 'w-60',
  colorClassName = 'bg-card/50 backdrop-blur-sm border border-border/50',
  url = null,
  dismissible = false,
  modal = false,
  loading = false,
  item = null,
  edit = false,
  small = false,
  name,
  type,
  size,
  onDismiss,
  onClick
}: FileItemProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (item?.file?.data?.content || modal) {
      setShowModal(!showModal);
    } else {
      if (url) {
        if (type === 'file') {
          window.open(`${url}/content`, '_blank')?.focus();
        } else {
          window.open(`${url}`, '_blank')?.focus();
        }
      }
    }
    onClick?.();
  };

  const content = (
    <>
      {!small && (
        <div className="p-3 bg-accent/20 text-accent-foreground rounded-xl">
          {!loading ? (
            <File className="h-5 w-5" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
      )}

      {!small ? (
        <div className="flex flex-col justify-center -space-y-0.5 px-2.5 w-full">
          <div className="dark:text-gray-100 text-sm font-medium line-clamp-1 mb-1">
            {decodeString(name)}
          </div>

          <div className="flex justify-between text-xs line-clamp-1 text-gray-500">
            {type === 'file' && 'File'}
            {type === 'doc' && 'Document'}
            {type === 'collection' && 'Collection'}
            {type === 'audio' && 'Audio'}
            {!['file', 'doc', 'collection', 'audio'].includes(type) && (
              <span className="capitalize line-clamp-1">{type}</span>
            )}
            {size && (
              <span className="capitalize">{formatFileSize(size)}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center -space-y-0.5 px-2.5 w-full">
          <div className="dark:text-gray-100 text-sm flex justify-between items-center">
            {loading && (
              <div className="shrink-0 mr-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div className="font-medium line-clamp-1 flex-1">{decodeString(name)}</div>
            {size && (
              <div className="text-gray-500 text-xs capitalize shrink-0">
                {formatFileSize(size)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const buttonContent = (
    <>
      {content}
      {dismissible && (
        <div 
          className="absolute -top-1 -right-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label="Remove File"
            className="bg-card text-foreground border border-border rounded-full p-0.5 outline-hidden focus:outline-hidden group-hover:visible invisible transition hover:bg-accent hover:text-accent-foreground"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );

  const button = dismissible ? (
    <div
      className={cn(
        "relative group p-1.5 flex items-center gap-1 text-left cursor-pointer",
        small ? 'rounded-xl' : 'rounded-2xl',
        className,
        colorClassName
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {buttonContent}
    </div>
  ) : (
    <button
      className={cn(
        "relative group p-1.5 flex items-center gap-1 text-left",
        small ? 'rounded-xl' : 'rounded-2xl',
        className,
        colorClassName
      )}
      type="button"
      onClick={handleClick}
    >
      {buttonContent}
    </button>
  );

  if (small) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <p>{decodeString(name)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}