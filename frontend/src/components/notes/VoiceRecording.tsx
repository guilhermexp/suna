'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecordingProps {
  recording: boolean;
  transcribe?: boolean;
  displayMedia?: boolean;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  className?: string;
  onCancel: () => void;
  onConfirm: (data: any) => void;
}

export function VoiceRecording({
  recording,
  transcribe = false,
  displayMedia = false,
  echoCancellation = false,
  noiseSuppression = false,
  autoGainControl = true,
  className = 'p-1 w-full max-w-full',
  onCancel,
  onConfirm
}: VoiceRecordingProps) {
  const [loading, setLoading] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(300).fill(0));
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const VISUALIZER_BUFFER_LENGTH = 300;
  const MIN_DECIBELS = -45;

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
  };

  const calculateRMS = (data: Uint8Array) => {
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalizedValue = (data[i] - 128) / 128;
      sumSquares += normalizedValue * normalizedValue;
    }
    return Math.sqrt(sumSquares / data.length);
  };

  const normalizeRMS = (rms: number) => {
    rms = rms * 10;
    const exp = 1.5;
    const scaledRMS = Math.pow(rms, exp);
    return Math.min(1.0, Math.max(0.01, scaledRMS));
  };

  const analyseAudio = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const audioStreamSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.minDecibels = MIN_DECIBELS;
    audioStreamSource.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const domainData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(analyser.fftSize);

    const processFrame = () => {
      if (!recording || loading) return;

      analyser.getByteTimeDomainData(timeDomainData);
      analyser.getByteFrequencyData(domainData);

      const rmsLevel = calculateRMS(timeDomainData);
      
      setVisualizerData(prev => {
        const newData = [...prev, normalizeRMS(rmsLevel)];
        if (newData.length > VISUALIZER_BUFFER_LENGTH) {
          newData.shift();
        }
        return newData;
      });

      animationFrameRef.current = window.requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(processFrame);
  };

  const onStopHandler = async (audioBlob: Blob, ext: string = 'webm') => {
    console.log('onStopHandler called with blob size:', audioBlob.size, 'ext:', ext);
    const fileName = `Recording-${new Date().toLocaleString()}.${ext}`;
    const file = new File([audioBlob], fileName, { type: audioBlob.type });
    console.log('Created file:', file.name, 'size:', file.size, 'type:', file.type);

    if (transcribe) {
      console.log('Transcribe is true, calling API...');
      // Use OpenAI Whisper API for transcription
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/transcription', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Transcription failed');
        }
        
        const data = await response.json();
        console.log('Calling onConfirm with transcription:', data.text);
        onConfirm({ text: data.text, file });
      } catch (error) {
        console.error('Transcription error:', error);
        toast.error('Failed to transcribe audio');
        console.log('Calling onConfirm with file only due to error');
        onConfirm({ file, blob: audioBlob });
      }
    } else {
      console.log('Transcribe is false, calling onConfirm with file and blob');
      onConfirm({ file, blob: audioBlob });
    }
  };

  const startRecording = async () => {
    console.log('Starting recording...');
    setLoading(true);

    try {
      if (displayMedia) {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
          audio: true
        });
        streamRef.current = new MediaStream();
        for (const track of mediaStream.getAudioTracks()) {
          streamRef.current.addTrack(track);
        }
        for (const track of mediaStream.getVideoTracks()) {
          track.stop();
        }
      } else {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation,
            noiseSuppression,
            autoGainControl
          }
        });
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      toast.error('Error accessing media devices');
      setLoading(false);
      return;
    }

    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });

    mediaRecorderRef.current.onstart = () => {
      console.log('Recording started');
      setLoading(false);
      
      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);

      audioChunksRef.current = [];
      if (streamRef.current) {
        analyseAudio(streamRef.current);
      }
    };

    mediaRecorderRef.current.ondataavailable = (event) => {
      console.log('Data available, size:', event.data.size);
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log('Audio chunks now:', audioChunksRef.current.length);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      console.log('Recording stopped, total chunks:', audioChunksRef.current.length);
      // Don't clear chunks here - we need them for processing
    };

    try {
      // Start with timeslice to get data periodically
      mediaRecorderRef.current.start(1000); // Get data every 1 second
      console.log('MediaRecorder started with 1s timeslice');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error starting recording');
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      setDurationSeconds(0);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    audioChunksRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const confirmRecording = async () => {
    console.log('Confirm recording clicked');
    setLoading(true);

    try {
      // Stop the duration counter immediately
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop media recorder first to get the final data
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('Stopping media recorder...');
        
        // Request any remaining data before stopping
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        
        // Wait a bit for the data to be available
        await new Promise(resolve => setTimeout(resolve, 200));
        
        mediaRecorderRef.current.stop();
        
        // Wait for stop to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Process the recording
      if (audioChunksRef.current.length > 0) {
        console.log('Processing audio chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
        
        const ext = mediaRecorderRef.current?.mimeType?.split('/')[1]?.split(';')[0] || 'webm';
        await onStopHandler(audioBlob, ext);
        
        // Clear chunks after processing
        audioChunksRef.current = [];
      } else {
        console.log('No audio chunks to process');
        // Even if no chunks, we should still call onCancel to close the component
        onCancel();
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Error confirming recording:', error);
      toast.error('Failed to save recording');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recording) {
      startRecording();
    } else {
      stopRecording();
    }
    
    return () => {
      stopRecording();
    };
  }, [recording]);

  return (
    <div
      className={cn(
        "rounded-full flex justify-between",
        loading ? "bg-gray-100/50 dark:bg-gray-850/50" : "bg-indigo-300/10 dark:bg-indigo-500/10",
        className
      )}
    >
      <div className="flex items-center mr-1">
        <button
          type="button"
          className={cn(
            "p-1.5 rounded-full",
            loading 
              ? "bg-gray-200 dark:bg-gray-700/50" 
              : "bg-indigo-400/20 text-indigo-600 dark:text-indigo-300"
          )}
          onClick={async () => {
            console.log('Cancel button clicked');
            await stopRecording();
            onCancel();
          }}
        >
          <X className="size-4" />
        </button>
      </div>

      <div 
        className="flex flex-1 self-center items-center justify-between ml-2 mx-1 overflow-hidden h-6"
        dir="rtl"
      >
        <div className="flex items-center gap-0.5 h-6 w-full max-w-full overflow-hidden overflow-x-hidden flex-wrap">
          {visualizerData.slice().reverse().map((rms, index) => (
            <div key={index} className="flex items-center h-full">
              <div
                className={cn(
                  "w-[2px] shrink-0 inline-block h-full",
                  loading 
                    ? "bg-gray-500 dark:bg-gray-400" 
                    : "bg-indigo-500 dark:bg-indigo-400"
                )}
                style={{ height: `${Math.min(100, Math.max(14, rms * 100))}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        <div className="mx-1.5 pr-1 flex justify-center items-center">
          <div
            className={cn(
              "text-sm font-medium flex-1 mx-auto text-center",
              loading ? "text-gray-500 dark:text-gray-400" : "text-indigo-400"
            )}
          >
            {formatSeconds(durationSeconds)}
          </div>
        </div>

        <div className="flex items-center">
          {loading ? (
            <div className="text-gray-500 rounded-full cursor-not-allowed">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <button
              type="button"
              className="p-1.5 bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-600 dark:text-indigo-300 rounded-full transition-colors"
              onClick={() => {
                console.log('Check button clicked');
                confirmRecording();
              }}
            >
              <Check className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}