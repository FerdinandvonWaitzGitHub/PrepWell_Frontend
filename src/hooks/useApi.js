/**
 * useApi Hook
 * Custom hook for data fetching with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data fetching hook
 * @param {Function} fetchFn - API function to call
 * @param {Array} deps - Dependencies to trigger refetch
 * @param {Object} options - Additional options
 */
export function useApi(fetchFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch, execute, setData };
}

/**
 * Mutation hook for create/update/delete operations
 * @param {Function} mutationFn - API function to call
 */
export function useMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      return result;
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  return { mutate, loading, error };
}

/**
 * Hook for Lernpläne
 */
export function useLernplaene() {
  const { lernplaeneApi } = require('../services/api');
  return useApi(() => lernplaeneApi.getAll());
}

/**
 * Hook for single Lernplan
 */
export function useLernplan(id) {
  const { lernplaeneApi } = require('../services/api');
  return useApi(
    () => lernplaeneApi.getById(id),
    [id],
    { immediate: !!id }
  );
}

/**
 * Hook for Aufgaben
 */
export function useAufgaben() {
  const { aufgabenApi } = require('../services/api');
  return useApi(() => aufgabenApi.getAll());
}

/**
 * Hook for Leistungen
 */
export function useLeistungen() {
  const { leistungenApi } = require('../services/api');
  return useApi(() => leistungenApi.getAll());
}

/**
 * Hook for Kalender Slots
 */
export function useSlots(lernplanId) {
  const { kalenderApi } = require('../services/api');
  return useApi(
    () => kalenderApi.getSlots(lernplanId),
    [lernplanId],
    { immediate: !!lernplanId, initialData: [] }
  );
}

/**
 * Hook for Unterrechtsgebiete
 */
export function useUnterrechtsgebiete() {
  const { unterrechtsgebieteApi } = require('../services/api');
  return useApi(() => unterrechtsgebieteApi.getAll(), [], { initialData: [] });
}

export default useApi;
