import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface FeatureFlag {
  flag_name: string;
  enabled: boolean;
  details?: {
    description?: string;
    updated_at?: string;
  } | null;
}

export interface FeatureFlagsResponse {
  flags: Record<string, boolean>;
}

const flagCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

let globalFlagsCache: { flags: Record<string, boolean>; timestamp: number } | null = null;

// Default flags - todas ativadas por padrão
const DEFAULT_FLAGS: Record<string, boolean> = {
  'custom_agents': true,
  'notes': true,
  'chat': true,
  'collaboration': true,
  'file_upload': true,
  'real_time': true,
  'notifications': true,
  'analytics': true,
  'billing': true,
  'admin': true,
};

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  
  private constructor() {}
  
  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  async isEnabled(flagName: string): Promise<boolean> {
    try {
      const cached = flagCache.get(flagName);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.value;
      }
      
      const response = await fetch(`${API_URL}/api/feature-flags/${flagName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch feature flag ${flagName}: ${response.status}`);
        // Retorna valor padrão se backend não disponível
        return DEFAULT_FLAGS[flagName] ?? true;
      }
      
      const data: FeatureFlag = await response.json();
      
      flagCache.set(flagName, {
        value: data.enabled,
        timestamp: Date.now(),
      });
      
      return data.enabled;
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      // Retorna valor padrão se erro de rede/CORS
      return DEFAULT_FLAGS[flagName] ?? true;
    }
  }
  
  async getFlagDetails(flagName: string): Promise<FeatureFlag | null> {
    try {
      const response = await fetch(`${API_URL}/api/feature-flags/${flagName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch feature flag details for ${flagName}: ${response.status}`);
        return null;
      }
      
      const data: FeatureFlag = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching feature flag details for ${flagName}:`, error);
      return null;
    }
  }
  
  async getAllFlags(): Promise<Record<string, boolean>> {
    try {
      if (globalFlagsCache && Date.now() - globalFlagsCache.timestamp < CACHE_DURATION) {
        return globalFlagsCache.flags;
      }
      
      const response = await fetch(`${API_URL}/api/feature-flags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch all feature flags: ${response.status}`);
        // Retorna flags padrão se backend não disponível
        return DEFAULT_FLAGS;
      }
      
      const data: FeatureFlagsResponse = await response.json();
      globalFlagsCache = {
        flags: data.flags,
        timestamp: Date.now(),
      };
      
      Object.entries(data.flags).forEach(([flagName, enabled]) => {
        flagCache.set(flagName, {
          value: enabled,
          timestamp: Date.now(),
        });
      });
      
      return data.flags;
    } catch (error) {
      console.error('Error fetching all feature flags:', error);
      // Retorna flags padrão se erro de rede/CORS
      return DEFAULT_FLAGS;
    }
  }

  clearCache(): void {
    flagCache.clear();
    globalFlagsCache = null;
  }

  async preloadFlags(flagNames: string[]): Promise<void> {
    try {
      const promises = flagNames.map(flagName => this.isEnabled(flagName));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error preloading feature flags:', error);
    }
  }

  // Inicializa todas as flags padrão no cache
  initializeDefaultFlags(): void {
    Object.entries(DEFAULT_FLAGS).forEach(([flagName, enabled]) => {
      if (!flagCache.has(flagName)) {
        flagCache.set(flagName, {
          value: enabled,
          timestamp: Date.now(),
        });
      }
    });
  }

  // Pré-carrega todas as flags conhecidas
  async initializeAllFlags(): Promise<void> {
    try {
      // Primeiro inicializa com valores padrão
      this.initializeDefaultFlags();
      
      // Depois tenta buscar do backend (sem bloquear)
      this.getAllFlags().catch(error => {
        console.warn('Failed to fetch flags from backend, using defaults:', error);
      });
    } catch (error) {
      console.error('Error initializing feature flags:', error);
    }
  }
}

const featureFlagManager = FeatureFlagManager.getInstance();

export const isEnabled = (flagName: string): Promise<boolean> => {
  return featureFlagManager.isEnabled(flagName);
};

export const isFlagEnabled = isEnabled;

export const getFlagDetails = (flagName: string): Promise<FeatureFlag | null> => {
  return featureFlagManager.getFlagDetails(flagName);
};

export const getAllFlags = (): Promise<Record<string, boolean>> => {
  return featureFlagManager.getAllFlags();
};

export const clearFlagCache = (): void => {
  featureFlagManager.clearCache();
};

export const preloadFlags = (flagNames: string[]): Promise<void> => {
  return featureFlagManager.preloadFlags(flagNames);
};

export const initializeDefaultFlags = (): void => {
  featureFlagManager.initializeDefaultFlags();
};

export const initializeAllFlags = (): Promise<void> => {
  return featureFlagManager.initializeAllFlags();
};

// Auto-inicializa as flags quando o módulo é carregado
if (typeof window !== 'undefined') {
  // Inicializa imediatamente com valores padrão
  featureFlagManager.initializeDefaultFlags();
  
  // Tenta buscar do backend em background
  featureFlagManager.initializeAllFlags();
}

// React Query key factories
export const featureFlagKeys = {
  all: ['feature-flags'] as const,
  flag: (flagName: string) => [...featureFlagKeys.all, 'flag', flagName] as const,
  flagDetails: (flagName: string) => [...featureFlagKeys.all, 'details', flagName] as const,
  allFlags: () => [...featureFlagKeys.all, 'allFlags'] as const,
};

// Query functions
const fetchFeatureFlag = async (flagName: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/feature-flags/${flagName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch feature flag ${flagName}: ${response.status}`);
      return DEFAULT_FLAGS[flagName] ?? true;
    }
    
    const data: FeatureFlag = await response.json();
    return data.enabled;
  } catch (error) {
    console.error(`Error fetching feature flag ${flagName}:`, error);
    return DEFAULT_FLAGS[flagName] ?? true;
  }
};

const fetchFeatureFlagDetails = async (flagName: string): Promise<FeatureFlag> => {
  const response = await fetch(`${API_URL}/api/feature-flags/${flagName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch feature flag details for ${flagName}: ${response.status}`);
  }
  
  const data: FeatureFlag = await response.json();
  return data;
};

const fetchAllFeatureFlags = async (): Promise<Record<string, boolean>> => {
  try {
    const response = await fetch(`${API_URL}/api/feature-flags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch all feature flags: ${response.status}`);
      return DEFAULT_FLAGS;
    }
    
    const data: FeatureFlagsResponse = await response.json();
    return data.flags;
  } catch (error) {
    console.error('Error fetching all feature flags:', error);
    return DEFAULT_FLAGS;
  }
};

// React Query Hooks
export const useFeatureFlag = (flagName: string, options?: {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}) => {
  const query = useQuery({
    queryKey: featureFlagKeys.flag(flagName),
    queryFn: () => fetchFeatureFlag(flagName),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors, but retry on network errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      errorMessage: `Failed to fetch feature flag: ${flagName}`,
    },
  });

  // Return backward-compatible interface
  return {
    enabled: query.data ?? (DEFAULT_FLAGS[flagName] ?? true),
    loading: query.isLoading,
    // Also expose React Query properties for advanced usage
    ...query,
  };
};

export const useFeatureFlagDetails = (flagName: string, options?: {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}) => {
  return useQuery({
    queryKey: featureFlagKeys.flagDetails(flagName),
    queryFn: () => fetchFeatureFlagDetails(flagName),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useAllFeatureFlags = (options?: {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}) => {
  return useQuery({
    queryKey: featureFlagKeys.allFlags(),
    queryFn: fetchAllFeatureFlags,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useFeatureFlags = (flagNames: string[], options?: {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}) => {
  const queries = useQueries({
    queries: flagNames.map((flagName) => ({
      queryKey: featureFlagKeys.flag(flagName),
      queryFn: () => fetchFeatureFlag(flagName),
      staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
      gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
      enabled: options?.enabled ?? true,
      retry: (failureCount: number, error: Error) => {
        if (error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
    })),
  });

  // Transform the results into a more convenient format
  const flags = React.useMemo(() => {
    const result: Record<string, boolean> = {};
    flagNames.forEach((flagName, index) => {
      const query = queries[index];
      result[flagName] = query.data ?? (DEFAULT_FLAGS[flagName] ?? true);
    });
    return result;
  }, [queries, flagNames]);

  const loading = queries.some(query => query.isLoading);
  const error = queries.find(query => query.error)?.error?.message ?? null;

  return { flags, loading, error };
};
