import { createQueryHook } from "@/hooks/use-query";
import { AvailableModelsResponse, getAvailableModels } from "@/lib/api";
import { modelKeys } from "./keys";

export const useAvailableModels = createQueryHook<AvailableModelsResponse, Error>(
    modelKeys.available,
    getAvailableModels,
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: process.env.NEXT_PUBLIC_SELF_HOSTED !== 'true',
      select: (data) => {
        return {
          ...data,
          models: [...data.models].sort((a, b) => 
            a.display_name.localeCompare(b.display_name)
          ),
        };
      },
    }
  );