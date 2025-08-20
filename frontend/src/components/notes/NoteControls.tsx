'use client';

import React, { useState, useEffect } from 'react';
import { X, FileAudio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileItem } from './FileItem';
import { toast } from 'sonner';
import { uploadAudioForTranscription } from '@/lib/api/transcription';
import { runAgentTool } from '@/lib/api/agent_tools';

interface AudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  status?: 'uploading' | 'transcribing' | 'ready';
  transcription?: string;
}

interface NoteControlsProps {
  show: boolean;
  selectedModelId: string;
  files: AudioFile[];
  onUpdate: (files: AudioFile[]) => void;
  onClose: () => void;
  className?: string;
  noteId?: string;
  onProcessAudio?: (text: string) => void;
}

const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export function NoteControls({ 
  show,
  selectedModelId,
  files,
  onUpdate,
  onClose,
  className,
  noteId,
  onProcessAudio
}: NoteControlsProps) {
  const [localSelectedModel, setLocalSelectedModel] = useState(selectedModelId || 'gpt-4o');
  const [localFiles, setLocalFiles] = useState<AudioFile[]>(files || []);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLocalFiles(files || []);
  }, [files]);

  useEffect(() => {
    setLocalSelectedModel(selectedModelId || 'gpt-4o');
  }, [selectedModelId]);

  const handleRemoveFile = (fileId: string) => {
    const newFiles = localFiles.filter(f => f.id !== fileId);
    setLocalFiles(newFiles);
    onUpdate(newFiles);
  };

  const handleProcessAudio = async () => {
    if (localFiles.length === 0) {
      toast.error('No audio files to process');
      return;
    }

    setIsProcessing(true);
    try {
      // Process each audio file
      const transcriptions: string[] = [];
      
      for (const file of localFiles) {
        if (file.file && file.type === 'audio') {
          toast.info(`Transcribing ${file.name}...`);
          const result = await uploadAudioForTranscription(file.file);
          
          if (result?.text) {
            transcriptions.push(result.text);
          }
        } else if (file.transcription) {
          transcriptions.push(file.transcription);
        }
      }

      if (transcriptions.length === 0) {
        toast.error('No transcriptions available');
        return;
      }

      // Combine all transcriptions
      const combinedText = transcriptions.join('\n\n');
      
      // Enhance the text using AI
      if (noteId) {
        toast.info('Enhancing text...');
        const enhanced = await runAgentTool(
          noteId,
          'text_enhancement_tool.rephrase_text',
          { text: combinedText, style: 'professional' }
        );
        
        if (enhanced?.success && enhanced.output) {
          // Send enhanced text to editor
          if (onProcessAudio) {
            onProcessAudio(enhanced.output);
            toast.success('Text enhanced and added to editor!');
            
            // Clear files after processing
            setLocalFiles([]);
            onUpdate([]);
          }
        } else {
          // Fallback to original transcription
          if (onProcessAudio) {
            onProcessAudio(combinedText);
            toast.success('Transcription added to editor!');
            
            // Clear files after processing
            setLocalFiles([]);
            onUpdate([]);
          }
        }
      } else {
        // No noteId, just send transcription
        if (onProcessAudio) {
          onProcessAudio(combinedText);
          toast.success('Transcription added to editor!');
          
          // Clear files after processing
          setLocalFiles([]);
          onUpdate([]);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio files');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!show) return null;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex items-center mb-1.5 pt-1.5">
        <div className="-translate-x-1.5 flex items-center">
          <button
            className="p-0.5 bg-transparent transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="font-medium text-base flex items-center gap-1">
          <div>Controles</div>
        </div>
      </div>

      <div className="mt-1">
        <div className="pb-10">
          {localFiles.length > 0 && (
            <>
              <div className="text-xs font-medium pb-1">Files</div>

              <div className="flex flex-col gap-1">
                {localFiles.filter(file => file.type !== 'image').map((file) => (
                  <FileItem
                    key={file.id}
                    className="w-full"
                    item={file}
                    small={true}
                    edit={true}
                    dismissible={true}
                    url={file.url}
                    name={file.name}
                    type={file.type}
                    size={file.size}
                    loading={file.status === 'uploading'}
                    onDismiss={() => handleRemoveFile(file.id)}
                    onClick={() => console.log(file)}
                  />
                ))}
              </div>

              {localFiles.filter(file => file.type === 'image').length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  {localFiles.filter(file => file.type === 'image').map((file) => (
                    <div key={file.id} className="relative">
                      <img
                        src={file.url}
                        className="size-14 rounded-xl object-cover"
                        alt={file.name}
                      />
                      <button
                        className="absolute -top-1 -right-1 bg-white text-black border border-gray-50 rounded-full p-0.5"
                        onClick={() => handleRemoveFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <hr className="my-2 border-gray-50 dark:border-gray-700/10" />
            </>
          )}

          <div className="text-xs font-medium mb-1">Model</div>

          <div className="w-full">
            <select 
              className="w-full bg-transparent text-sm outline-none"
              value={localSelectedModel}
              onChange={(e) => setLocalSelectedModel(e.target.value)}
            >
              <option value="" className="bg-gray-50 dark:bg-gray-700" disabled>
                Select a model
              </option>
              {MODELS.map(model => (
                <option key={model.value} value={model.value} className="bg-gray-50 dark:bg-gray-700">
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Process Audio Button */}
        {localFiles.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleProcessAudio}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2"
              variant="default"
            >
              <Sparkles className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Process Audio to Editor'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}