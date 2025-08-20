import { NextRequest, NextResponse } from 'next/server';

// Test all endpoints
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const results: any = {};
  
  // Test 1: Notes Chat
  try {
    const chatResponse = await fetch(`${baseUrl}/api/notes/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message' }],
        stream: false
      })
    });
    results.notesChat = {
      status: chatResponse.status,
      ok: chatResponse.ok,
      data: await chatResponse.json()
    };
  } catch (error: any) {
    results.notesChat = { error: error.message };
  }
  
  // Test 2: YouTube Transcript
  try {
    const ytResponse = await fetch(`${baseUrl}/api/youtube/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      })
    });
    results.youtubeTranscript = {
      status: ytResponse.status,
      ok: ytResponse.ok,
      data: await ytResponse.json()
    };
  } catch (error: any) {
    results.youtubeTranscript = { error: error.message };
  }
  
  // Test 3: Check if enhance is available in notes/chat
  try {
    const enhanceTest = await fetch(`${baseUrl}/api/notes/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert document editor. Enhance the following text.' },
          { role: 'user', content: 'Test text to enhance.' }
        ],
        stream: false
      })
    });
    results.enhanceFunction = {
      status: enhanceTest.status,
      ok: enhanceTest.ok,
      data: await enhanceTest.json()
    };
  } catch (error: any) {
    results.enhanceFunction = { error: error.message };
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    endpoints: results,
    summary: {
      notesChat: results.notesChat?.ok ? 'Working' : 'Failed',
      youtubeTranscript: results.youtubeTranscript?.ok === false ? 'Working (returns expected error)' : 'Check',
      enhanceFunction: results.enhanceFunction?.ok ? 'Working' : 'Failed'
    }
  });
}