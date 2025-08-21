import { NextRequest, NextResponse } from 'next/server';

// OpenAI Whisper transcription endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }

    // Ensure file has proper extension
    let fileName = file.name || 'audio.mp3';
    
    // Handle WhatsApp opus files - convert to .ogg extension
    if (fileName.endsWith('.opus')) {
      fileName = fileName.replace('.opus', '.ogg');
    }
    
    if (!fileName.includes('.')) {
      // Add extension based on mime type
      const ext = file.type?.split('/')[1] || 'mp3';
      fileName = `audio.${ext}`;
    }
    
    // Convert the File to a Blob with correct type
    const buffer = await file.arrayBuffer();
    const audioType = file.type || 'audio/mpeg';
    const blob = new Blob([buffer], { type: audioType });
    
    console.log('Sending to OpenAI:', {
      fileName,
      audioType,
      size: blob.size
    });
    
    // Create FormData for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append('file', blob, fileName);
    openAIFormData.append('model', 'whisper-1');
    
    // Add language if specified
    if (language) {
      openAIFormData.append('language', language);
    }
    
    // Add response format
    openAIFormData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { 
          error: 'Transcription failed', 
          detail: errorData.error?.message || 'Unknown error',
          details: errorData.error?.message || 'Unknown error' 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return transcription result
    return NextResponse.json({
      text: result.text,
      success: true,
      language: result.language || language || 'en'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process transcription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}