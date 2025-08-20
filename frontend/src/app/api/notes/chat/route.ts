import { NextRequest, NextResponse } from 'next/server';

// Note chat completion endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      model = 'gpt-4o-mini',
      stream = false,
      noteContent,
      context,
      selection,
      editMode = false
    } = body;

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { 
          success: false,
          error: 'AI service not configured' 
        },
        { status: 500 }
      );
    }

    // Prepare system message for edit mode
    let systemMessage = '';
    
    if (editMode) {
      systemMessage = `You are an expert document editor.

## Task
Based on the user's instruction, update and enhance the existing notes or selection by incorporating relevant and accurate information from the provided context in the content's primary language. Ensure all edits strictly follow the user's intent.

## Input Structure
- Existing notes: Enclosed within <notes></notes> XML tags.
- Additional context: Enclosed within <context></context> XML tags (may include YouTube transcripts, documents, or other files).
- Current note selection: Enclosed within <selection></selection> XML tags.
- Editing instruction: Provided in the user message.

## Important
- If the notes are empty or contain minimal content, create new content based on the user's instruction and any available context.
- If no context is provided and notes are empty, politely explain that you need some initial content or context to work with.

## Output Instructions
- If a selection is provided, edit **only** the content within <selection></selection>. Leave unselected parts unchanged.
- If no selection is provided, edit the entire notes.
- Deliver a single, rewritten version of the notes in markdown format.
- Integrate information from the context only if it directly supports the user's instruction.
- Use clear, organized markdown elements: headings, lists, task lists ([ ]) where tasks or checklists are strongly implied, bold and italic text as appropriate.
- Focus on improving clarity, completeness, and usefulness of the notes.
- Return only the final, fully-edited markdown notes—do not include explanations, reasoning, or XML tags.

<notes>${noteContent || ''}</notes>`;

      if (context) {
        systemMessage += `\n<context>${context}</context>`;
      }
      
      if (selection) {
        systemMessage += `\n<selection>${selection}</selection>`;
      }
    } else {
      systemMessage = `You are a helpful assistant. Please answer the user's questions based on the context provided.

<notes>${noteContent || ''}</notes>`;
      
      if (context) {
        systemMessage += `\n<context>${context}</context>`;
      }
    }

    // Prepare messages with system message
    const chatMessages = [
      {
        role: 'system',
        content: systemMessage
      },
      ...messages
    ];

    if (stream) {
      // Stream response for real-time updates
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      // Return the stream directly
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const result = await response.json();
      
      return NextResponse.json({
        success: true,
        content: result.choices[0]?.message?.content || '',
        usage: result.usage,
        model: result.model
      });
    }
  } catch (error) {
    console.error('Note chat error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}