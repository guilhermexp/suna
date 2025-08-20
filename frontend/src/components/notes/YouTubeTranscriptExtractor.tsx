'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Youtube, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface YouTubeTranscriptExtractorProps {
  open: boolean;
  onClose: () => void;
  onTranscriptExtracted: (transcript: string, metadata: any) => void;
}

export function YouTubeTranscriptExtractor({ 
  open, 
  onClose, 
  onTranscriptExtracted 
}: YouTubeTranscriptExtractorProps) {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract transcript');
      }

      // Success! Pass the transcript to parent
      onTranscriptExtracted(data.transcript, {
        videoId: data.videoId,
        url: data.metadata.url,
        extractedAt: data.metadata.extractedAt,
      });

      toast.success('YouTube transcript extracted successfully!');
      
      // Clear input and close dialog
      setUrl('');
      onClose();
    } catch (error) {
      console.error('Error extracting transcript:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extract transcript');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExtracting) {
      handleExtract();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Extract YouTube Transcript
          </DialogTitle>
          <DialogDescription>
            Enter a YouTube URL to extract its transcript and add it to your note context.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isExtracting}
              className="col-span-3"
            />
            <p className="text-xs text-muted-foreground">
              Supports youtube.com and youtu.be URLs
            </p>
          </div>

          {isExtracting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting transcript...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExtracting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || !url.trim()}
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Extract Transcript
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}