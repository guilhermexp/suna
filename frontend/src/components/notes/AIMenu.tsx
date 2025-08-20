'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  MessageCircle, 
  Wand2,
  FileText,
  CheckCircle,
  Maximize2,
  Youtube,
  FileUp,
  Languages,
  Zap
} from 'lucide-react';

interface AIMenuProps {
  onEnhance: () => void;
  onChat: () => void;
  onSummarize: () => void;
  onCorrectGrammar: () => void;
  onExpand: () => void;
  onYouTube?: () => void;
  onFileUpload?: () => void;
  onTranslate?: () => void;
  onSimplify?: () => void;
  children?: React.ReactNode;
}

export function AIMenu({
  onEnhance,
  onChat,
  onSummarize,
  onCorrectGrammar,
  onExpand,
  onYouTube,
  onFileUpload,
  onTranslate,
  onSimplify,
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
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuItem onClick={onEnhance} className="font-medium">
          <Wand2 className="mr-2 h-4 w-4 text-purple-500" />
          ✨ Embelezar (Enhance)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onSummarize}>
          <FileText className="mr-2 h-4 w-4 text-blue-500" />
          Resumir (Summarize)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onCorrectGrammar}>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Corrigir Gramática
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onExpand}>
          <Maximize2 className="mr-2 h-4 w-4 text-orange-500" />
          Expandir Conteúdo
        </DropdownMenuItem>
        
        {onSimplify && (
          <DropdownMenuItem onClick={onSimplify}>
            <Zap className="mr-2 h-4 w-4 text-yellow-500" />
            Simplificar
          </DropdownMenuItem>
        )}
        
        {onTranslate && (
          <DropdownMenuItem onClick={onTranslate}>
            <Languages className="mr-2 h-4 w-4 text-indigo-500" />
            Traduzir
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {onYouTube && (
          <DropdownMenuItem onClick={onYouTube}>
            <Youtube className="mr-2 h-4 w-4 text-red-500" />
            Extrair YouTube
          </DropdownMenuItem>
        )}
        
        {onFileUpload && (
          <DropdownMenuItem onClick={onFileUpload}>
            <FileUp className="mr-2 h-4 w-4 text-teal-500" />
            Upload de Arquivo
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onChat}>
          <MessageCircle className="mr-2 h-4 w-4 text-sky-500" />
          Chat com IA
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}