import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// YouTube transcript extraction endpoint using yt-dlp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { 
          success: false,
          error: 'YouTube URL is required' 
        },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid YouTube URL' 
        },
        { status: 400 }
      );
    }

    try {
      console.log('Attempting to fetch real transcript using yt-dlp for:', videoId);
      
      // Create temp directory for subtitles
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `${videoId}`);
      
      // Try to download subtitles in multiple languages
      const languages = ['pt', 'en', 'es', 'auto'];
      let transcript = '';
      let foundLanguage = '';
      
      for (const lang of languages) {
        try {
          console.log(`Trying to download subtitles in language: ${lang}`);
          
          // Use yt-dlp to download subtitles - try both auto-generated and manual
          // Remove the 2>/dev/null to see errors, and add --write-sub for manual subs
          const command = `yt-dlp --write-sub --write-auto-sub --sub-lang ${lang} --skip-download --sub-format srt/vtt/best "${url}" -o "${outputPath}.%(ext)s" 2>&1 | grep -v "Testing format"`;
          
          await execAsync(command);
          
          // Check if subtitle file exists - try multiple formats
          const subtitleFiles = [
            `${outputPath}.${lang}.srt`,
            `${outputPath}.${lang}.vtt`,
            `${outputPath}.en.srt`, // Sometimes auto generates english
            `${outputPath}.en.vtt`,
            `${outputPath}.srt`,
            `${outputPath}.vtt`,
            // Also check for auto-generated versions
            `${outputPath}.${lang}.${lang}.srt`,
            `${outputPath}.${lang}.${lang}.vtt`
          ];
          
          for (const subtitleFile of subtitleFiles) {
            try {
              const subtitleContent = await fs.readFile(subtitleFile, 'utf-8');
              if (subtitleContent) {
                // Parse SRT format to extract text
                transcript = parseSRT(subtitleContent);
                foundLanguage = lang;
                
                // Clean up subtitle file
                await fs.unlink(subtitleFile).catch(() => {});
                break;
              }
            } catch (e) {
              // File doesn't exist, continue
            }
          }
          
          if (transcript) break;
        } catch (e) {
          console.log(`Failed to get subtitles in ${lang}:`, e);
        }
      }
      
      if (!transcript) {
        // If no subtitles found, try to get video info at least
        console.log('No subtitles found, attempting to get video info...');
        
        try {
          const infoCommand = `yt-dlp --dump-json --no-warnings "${url}" 2>/dev/null`;
          const { stdout } = await execAsync(infoCommand);
          const videoInfo = JSON.parse(stdout);
          
          // Create a transcript from video metadata
          transcript = `
# ${videoInfo.title || 'Unknown Title'}

**Channel:** ${videoInfo.uploader || 'Unknown'}
**Duration:** ${formatDuration(videoInfo.duration || 0)}
**Upload Date:** ${videoInfo.upload_date ? formatDate(videoInfo.upload_date) : 'Unknown'}
**Views:** ${videoInfo.view_count ? videoInfo.view_count.toLocaleString() : 'Unknown'}

## Description

${videoInfo.description || 'No description available.'}

---

*Note: This video does not have accessible captions. The above information is extracted from the video metadata. To get a full transcript, you can use the audio recording feature to capture and transcribe the audio directly while playing the video.*
          `.trim();
          
          return NextResponse.json({
            success: true,
            videoId,
            transcript,
            method: 'yt-dlp-metadata',
            metadata: {
              url,
              title: videoInfo.title,
              channel: videoInfo.uploader,
              duration: videoInfo.duration,
              extractedAt: new Date().toISOString(),
              hasActualTranscript: false
            }
          });
        } catch (infoError) {
          console.error('Failed to get video info:', infoError);
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: 'No transcript available for this video. The video may not have captions enabled.',
            videoId
          },
          { status: 404 }
        );
      }
      
      console.log(`Successfully extracted transcript in ${foundLanguage}, length:`, transcript.length);
      
      return NextResponse.json({
        success: true,
        videoId,
        transcript,
        method: 'yt-dlp',
        metadata: {
          url,
          language: foundLanguage,
          extractedAt: new Date().toISOString(),
          transcriptLength: transcript.length
        }
      });
      
    } catch (transcriptError: any) {
      console.error('Transcript extraction error:', transcriptError);
      
      let errorMessage = 'Failed to extract transcript from YouTube.';
      
      if (transcriptError.message?.includes('yt-dlp')) {
        errorMessage = 'yt-dlp is not installed. Please install it to extract YouTube transcripts.';
      } else if (transcriptError.message?.includes('network')) {
        errorMessage = 'Network error while fetching transcript. Please check your connection and try again.';
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          videoId,
          details: transcriptError.message 
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('YouTube transcript API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Parse SRT or VTT subtitle format
function parseSRT(srtContent: string): string {
  const lines = srtContent.split('\n');
  const textLines: string[] = [];
  let isTextLine = false;
  
  for (const line of lines) {
    // Skip WEBVTT header
    if (line.trim() === 'WEBVTT' || line.trim().startsWith('NOTE')) {
      continue;
    }
    
    // Skip subtitle numbers and timestamps (both SRT and VTT formats)
    if (/^\d+$/.test(line.trim())) {
      isTextLine = false;
    } else if (
      /^\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3}/.test(line.trim()) || // SRT/VTT with hours
      /^\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}[,.]\d{3}/.test(line.trim()) // VTT without hours
    ) {
      isTextLine = true;
    } else if (isTextLine && line.trim()) {
      // This is actual subtitle text - remove VTT tags if present
      let cleanLine = line.trim()
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\{[^}]*\}/g, ''); // Remove style tags
      if (cleanLine) {
        textLines.push(cleanLine);
      }
    }
  }
  
  // Join all text lines and remove duplicates
  const text = textLines.join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

// Format duration from seconds to readable format
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format date from YYYYMMDD to readable format
function formatDate(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr;
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}