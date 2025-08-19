import { NextRequest, NextResponse } from 'next/server';

// Mock transcription endpoint for audio file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // In production, you would send this to a real transcription service
    // For now, we'll return a mock response
    console.log('Received audio file for transcription:', file.name);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock transcription result
    const mockTranscription = {
      text: "This is a mock transcription of the audio file. In production, this would be replaced with actual speech-to-text processing.",
      success: true,
      duration: 5.2,
      language: "en"
    };

    return NextResponse.json(mockTranscription);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}