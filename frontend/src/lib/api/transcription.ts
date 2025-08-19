import { toast } from 'sonner';

interface TranscriptionResponse {
  text: string;
}

export async function uploadAudioForTranscription(audioFile: File): Promise<TranscriptionResponse | null> {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch('/api/transcription', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(`Transcription failed: ${errorData.detail || response.statusText}`);
      return null;
    }

    const data: TranscriptionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading audio for transcription:', error);
    toast.error(`An unexpected error occurred during transcription: ${error.message || ''}`);
    return null;
  }
}
