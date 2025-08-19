import { toast } from 'sonner';

interface AgentToolRunResponse {
  output: string;
  success: boolean;
}

export async function runAgentTool(
  threadId: string,
  toolName: string,
  toolArgs: Record<string, any>,
  agentId?: string
): Promise<AgentToolRunResponse | null> {
  try {
    const response = await fetch(`/api/thread/${threadId}/agent/run-tool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: toolName,
        params: toolArgs,
        agentId: agentId, // Optional agent ID
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(`Failed to run tool ${toolName}: ${errorData.detail || response.statusText}`);
      return null;
    }

    const data: AgentToolRunResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error running agent tool ${toolName}:`, error);
    toast.error(`An unexpected error occurred while running tool ${toolName}: ${error.message || ''}`);
    return null;
  }
}
