import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DEFAULT_SELECTION,
  ALL_UNTERRECHTSGEBIETE,
  RECHTSGEBIET_COLORS,
  RECHTSGEBIET_LABELS,
  getAllUnterrechtsgebieteFlat as flattenUnterrechtsgebiete
} from '../data/unterrechtsgebiete-data';

/**
 * Context for centrally managing Unterrechtsgebiete (law sub-areas)
 * Shared between wizard, calendar, and other components
 */

// Create the context
const UnterrechtsgebieteContext = createContext(null);

/**
 * Provider component for Unterrechtsgebiete
 */
export const UnterrechtsgebieteProvider = ({ children }) => {
  // Selected Unterrechtsgebiete (what the user has chosen for their Lernplan)
  const [selectedUnterrechtsgebiete, setSelectedUnterrechtsgebiete] = useState(DEFAULT_SELECTION);

  // Add a new Unterrechtsgebiet to a specific Rechtsgebiet
  const addUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebiet) => {
    setSelectedUnterrechtsgebiete(prev => {
      // Check if already exists
      const existing = prev[rechtsgebietId] || [];
      if (existing.some(item => item.id === unterrechtsgebiet.id)) {
        return prev;
      }
      return {
        ...prev,
        [rechtsgebietId]: [...existing, unterrechtsgebiet]
      };
    });
  }, []);

  // Delete an Unterrechtsgebiet from a specific Rechtsgebiet
  const deleteUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebietId) => {
    setSelectedUnterrechtsgebiete(prev => ({
      ...prev,
      [rechtsgebietId]: (prev[rechtsgebietId] || []).filter(item => item.id !== unterrechtsgebietId)
    }));
  }, []);

  // Get all selected Unterrechtsgebiete for a specific Rechtsgebiet
  const getUnterrechtsgebieteByRechtsgebiet = useCallback((rechtsgebietId) => {
    return selectedUnterrechtsgebiete[rechtsgebietId] || [];
  }, [selectedUnterrechtsgebiete]);

  // Get ALL available Unterrechtsgebiete for a specific Rechtsgebiet (from database)
  const getAllByRechtsgebiet = useCallback((rechtsgebietId) => {
    return ALL_UNTERRECHTSGEBIETE[rechtsgebietId] || [];
  }, []);

  // Update an existing Unterrechtsgebiet
  const updateUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebietId, updates) => {
    setSelectedUnterrechtsgebiete(prev => ({
      ...prev,
      [rechtsgebietId]: (prev[rechtsgebietId] || []).map(item =>
        item.id === unterrechtsgebietId ? { ...item, ...updates } : item
      )
    }));
  }, []);

  // Get all selected Unterrechtsgebiete as a flat list with colors
  const getAllSelectedFlat = useCallback(() => {
    const flat = [];
    Object.entries(selectedUnterrechtsgebiete).forEach(([rechtsgebietId, items]) => {
      items.forEach(item => {
        flat.push({
          ...item,
          rechtsgebiet: rechtsgebietId,
          color: RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-neutral-500'
        });
      });
    });
    return flat;
  }, [selectedUnterrechtsgebiete]);

  // Get all available Unterrechtsgebiete (the full database)
  const getAllAvailable = useCallback(() => {
    return ALL_UNTERRECHTSGEBIETE;
  }, []);

  // Get all available as flat list
  const getAllAvailableFlat = useCallback(() => {
    return flattenUnterrechtsgebiete(ALL_UNTERRECHTSGEBIETE);
  }, []);

  // Check if an Unterrechtsgebiet is selected
  const isSelected = useCallback((rechtsgebietId, unterrechtsgebietId) => {
    const items = selectedUnterrechtsgebiete[rechtsgebietId] || [];
    return items.some(item => item.id === unterrechtsgebietId);
  }, [selectedUnterrechtsgebiete]);

  // Toggle selection of an Unterrechtsgebiet
  const toggleUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebiet) => {
    setSelectedUnterrechtsgebiete(prev => {
      const existing = prev[rechtsgebietId] || [];
      const isCurrentlySelected = existing.some(item => item.id === unterrechtsgebiet.id);

      if (isCurrentlySelected) {
        return {
          ...prev,
          [rechtsgebietId]: existing.filter(item => item.id !== unterrechtsgebiet.id)
        };
      } else {
        return {
          ...prev,
          [rechtsgebietId]: [...existing, unterrechtsgebiet]
        };
      }
    });
  }, []);

  // Set all selected Unterrechtsgebiete at once
  const setAllSelected = useCallback((data) => {
    setSelectedUnterrechtsgebiete(data);
  }, []);

  // Reset to default selection
  const resetToDefault = useCallback(() => {
    setSelectedUnterrechtsgebiete(DEFAULT_SELECTION);
  }, []);

  // Get count of selected items
  const getSelectedCount = useCallback(() => {
    return Object.values(selectedUnterrechtsgebiete).reduce((sum, items) => sum + items.length, 0);
  }, [selectedUnterrechtsgebiete]);

  const value = {
    // State
    selectedUnterrechtsgebiete,
    allUnterrechtsgebiete: ALL_UNTERRECHTSGEBIETE,

    // Constants
    RECHTSGEBIET_COLORS,
    RECHTSGEBIET_LABELS,

    // Actions
    addUnterrechtsgebiet,
    deleteUnterrechtsgebiet,
    getUnterrechtsgebieteByRechtsgebiet,
    getAllByRechtsgebiet,
    updateUnterrechtsgebiet,
    toggleUnterrechtsgebiet,
    isSelected,
    setAllSelected,
    resetToDefault,

    // Getters
    getAllSelectedFlat,
    getAllAvailable,
    getAllAvailableFlat,
    getSelectedCount,

    // Legacy alias for backwards compatibility
    getAllUnterrechtsgebieteFlat: getAllSelectedFlat,
    unterrechtsgebiete: selectedUnterrechtsgebiete,
  };

  return (
    <UnterrechtsgebieteContext.Provider value={value}>
      {children}
    </UnterrechtsgebieteContext.Provider>
  );
};

/**
 * Hook to use the Unterrechtsgebiete context
 */
export const useUnterrechtsgebiete = () => {
  const context = useContext(UnterrechtsgebieteContext);
  if (!context) {
    throw new Error('useUnterrechtsgebiete must be used within an UnterrechtsgebieteProvider');
  }
  return context;
};

export default UnterrechtsgebieteContext;
