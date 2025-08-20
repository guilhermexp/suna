import { useQuery } from '@tanstack/react-query';
import { apiClient, backendApi } from '@/lib/api-client';

interface UpcomingRun {
  trigger_id: string;
  trigger_name: string;
  trigger_type: string;
  next_run_time: string;
  next_run_time_local: string;
  timezone: string;
  cron_expression: string;
  execution_type: string;
  agent_prompt?: string;
  workflow_id?: string;
  is_active: boolean;
  human_readable: string;
}

interface UpcomingRunsResponse {
  upcoming_runs: UpcomingRun[];
  total_count: number;
}

export const useAgentUpcomingRuns = (agentId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['agent-upcoming-runs', agentId, limit],
    queryFn: async (): Promise<UpcomingRunsResponse> => {
      const response = await backendApi.get<UpcomingRunsResponse>(`/triggers/agents/${agentId}/upcoming-runs?limit=${limit}`);
      
      if (!response.success || !response.data) {
        // Return empty response for 403 errors or when user lacks permission
        if (response.error?.status === 403) {
          return { upcoming_runs: [], total_count: 0 };
        }
        throw response.error || new Error('Failed to fetch upcoming runs');
      }
      
      return response.data;
    },
    enabled: !!agentId,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors
      if (error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export type { UpcomingRun, UpcomingRunsResponse }; 