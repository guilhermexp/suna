import { NextRequest, NextResponse } from 'next/server';

// OpenAI-powered agent tool execution endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const body = await request.json();
    const { tool, params: toolParams, agentId } = body;

    console.log('Running agent tool:', { threadId, tool, toolParams, agentId });

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

    let output = '';
    let success = true;

    try {
      switch (tool) {
        case 'text_enhancement_tool.rephrase_text':
          output = await enhanceTextWithAI(apiKey, toolParams.text || '', toolParams.style || 'creative');
          break;
        case 'text_enhancement_tool.summarize_text':
          output = await summarizeTextWithAI(apiKey, toolParams.text || '', toolParams.length || 'short');
          break;
        case 'text_enhancement_tool.correct_grammar':
          output = await correctGrammarWithAI(apiKey, toolParams.text || '');
          break;
        case 'text_enhancement_tool.expand_text':
          output = await expandTextWithAI(apiKey, toolParams.text || '', toolParams.detail_level || 'medium');
          break;
        case 'note_enhancement_tool.enhance_note':
          output = await enhanceNoteWithAI(
            apiKey, 
            toolParams.noteContent || '', 
            toolParams.context,
            toolParams.selection,
            toolParams.instruction
          );
          break;
        default:
          output = `Tool "${tool}" not implemented yet`;
          success = false;
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      output = error instanceof Error ? error.message : 'Failed to process with AI';
      success = false;
    }

    return NextResponse.json({
      success,
      output,
      threadId,
      tool,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent tool execution error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute agent tool', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions using OpenAI API
async function callOpenAI(apiKey: string, prompt: string, maxTokens: number = 150): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Respond only with the requested text, no explanations or additional formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const result = await response.json();
  return result.choices[0]?.message?.content?.trim() || '';
}

async function enhanceTextWithAI(apiKey: string, text: string, style: string): Promise<string> {
  const stylePrompts: Record<string, string> = {
    creative: 'Rewrite the following text in a more creative and engaging way',
    formal: 'Rewrite the following text in a formal, professional tone',
    casual: 'Rewrite the following text in a casual, conversational tone',
    concise: 'Rewrite the following text to be more concise and direct'
  };
  
  const prompt = `${stylePrompts[style] || stylePrompts.creative}: "${text}"`;
  return callOpenAI(apiKey, prompt);
}

async function summarizeTextWithAI(apiKey: string, text: string, length: string): Promise<string> {
  const lengthInstructions: Record<string, string> = {
    short: 'in 1-2 sentences',
    medium: 'in 3-4 sentences',
    long: 'in 5-6 sentences'
  };
  
  const prompt = `Summarize the following text ${lengthInstructions[length] || lengthInstructions.short}: "${text}"`;
  return callOpenAI(apiKey, prompt, length === 'short' ? 100 : length === 'medium' ? 150 : 200);
}

async function correctGrammarWithAI(apiKey: string, text: string): Promise<string> {
  const prompt = `Correct any grammar, spelling, or punctuation errors in the following text. Return only the corrected text: "${text}"`;
  return callOpenAI(apiKey, prompt);
}

async function expandTextWithAI(apiKey: string, text: string, detailLevel: string): Promise<string> {
  const detailInstructions: Record<string, string> = {
    low: 'Add a few more details to',
    medium: 'Expand with additional context and details for',
    high: 'Provide comprehensive expansion with examples and explanations for'
  };
  
  const prompt = `${detailInstructions[detailLevel] || detailInstructions.medium} the following text: "${text}"`;
  return callOpenAI(apiKey, prompt, detailLevel === 'high' ? 300 : detailLevel === 'medium' ? 200 : 150);
}

// Enhanced note editing function based on OpenNotes
async function enhanceNoteWithAI(
  apiKey: string, 
  noteContent: string, 
  context?: string, 
  selection?: string,
  instruction?: string
): Promise<string> {
  const systemPrompt = `You are an expert document editor.

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
- Return only the final, fully-edited markdown notes—do not include explanations, reasoning, or XML tags.`;

  let userContent = '';
  
  // Build the user content with XML tags
  userContent += `<notes>${noteContent || ''}</notes>`;
  
  if (context) {
    userContent += `\n<context>${context}</context>`;
  }
  
  if (selection) {
    userContent += `\n<selection>${selection}</selection>`;
  }
  
  userContent += `\n\nInstruction: ${instruction || 'Improve and enhance this content with better formatting and structure.'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const result = await response.json();
  return result.choices[0]?.message?.content?.trim() || '';
}