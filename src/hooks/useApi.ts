/**
 * useApi Hook
 * Custom hook for data fetching with loading and error states
 */

import { useState, useEffect, useCallback, DependencyList } from 'react';
import {
  lernplaeneApi,
  aufgabenApi,
  leistungenApi,
  unterrechtsgebieteApi,
} from '../services/api';

// =============================================================================
// TYPES
// =============================================================================

export interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T | null;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<T>;
  execute: (...args: unknown[]) => Promise<T>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export interface UseMutationReturn<T, Args extends unknown[]> {
  mutate: (...args: Args) => Promise<T>;
  loading: boolean;
  error: string | null;
}

// =============================================================================
// GENERIC HOOKS
// =============================================================================

/**
 * Generic data fetching hook
 */
export function useApi<T>(
  fetchFn: (...args: unknown[]) => Promise<T>,
  deps: DependencyList = [],
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch, execute, setData };
}

/**
 * Mutation hook for create/update/delete operations
 */
export function useMutation<T, Args extends unknown[] = unknown[]>(
  mutationFn: (...args: Args) => Promise<T>
): UseMutationReturn<T, Args> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(...args);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error };
}

// =============================================================================
// SPECIFIC HOOKS
// =============================================================================

/**
 * Hook for Lernpläne
 */
export function useLernplaene() {
  return useApi(() => lernplaeneApi.getAll());
}

/**
 * Hook for single Lernplan
 */
export function useLernplan(id: string | null | undefined) {
  return useApi(() => lernplaeneApi.getById(id!), [id], { immediate: !!id });
}

/**
 * Hook for Aufgaben
 */
export function useAufgaben() {
  return useApi(() => aufgabenApi.getAll());
}

/**
 * Hook for Leistungen
 */
export function useLeistungen() {
  return useApi(() => leistungenApi.getAll());
}

/**
 * Hook for Unterrechtsgebiete
 */
export function useUnterrechtsgebieteFromApi() {
  return useApi(() => unterrechtsgebieteApi.getAll(), [], { initialData: [] });
}

export default useApi;
