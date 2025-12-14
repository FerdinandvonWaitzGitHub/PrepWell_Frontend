import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for centrally managing Unterrechtsgebiete (law sub-areas)
 * Shared between month view and week view calendar components
 */

// Initial state structure - grouped by Rechtsgebiet
const initialUnterrechtsgebiete = {
  'zivilrecht': [],
  'oeffentliches-recht': [],
  'strafrecht': []
};

// Create the context
const UnterrechtsgebieteContext = createContext(null);

/**
 * Provider component for Unterrechtsgebiete
 */
export const UnterrechtsgebieteProvider = ({ children }) => {
  const [unterrechtsgebiete, setUnterrechtsgebiete] = useState(initialUnterrechtsgebiete);

  // Add a new Unterrechtsgebiet to a specific Rechtsgebiet
  const addUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebiet) => {
    setUnterrechtsgebiete(prev => ({
      ...prev,
      [rechtsgebietId]: [...(prev[rechtsgebietId] || []), unterrechtsgebiet]
    }));
  }, []);

  // Delete an Unterrechtsgebiet from a specific Rechtsgebiet
  const deleteUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebietId) => {
    setUnterrechtsgebiete(prev => ({
      ...prev,
      [rechtsgebietId]: prev[rechtsgebietId].filter(item => item.id !== unterrechtsgebietId)
    }));
  }, []);

  // Get all Unterrechtsgebiete for a specific Rechtsgebiet
  const getUnterrechtsgebieteByRechtsgebiet = useCallback((rechtsgebietId) => {
    return unterrechtsgebiete[rechtsgebietId] || [];
  }, [unterrechtsgebiete]);

  // Update an existing Unterrechtsgebiet
  const updateUnterrechtsgebiet = useCallback((rechtsgebietId, unterrechtsgebietId, updates) => {
    setUnterrechtsgebiete(prev => ({
      ...prev,
      [rechtsgebietId]: prev[rechtsgebietId].map(item =>
        item.id === unterrechtsgebietId ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const value = {
    unterrechtsgebiete,
    addUnterrechtsgebiet,
    deleteUnterrechtsgebiet,
    getUnterrechtsgebieteByRechtsgebiet,
    updateUnterrechtsgebiet
  };

  return (
    <UnterrechtsgebieteContext.Provider value={value}>
      {children}
    </UnterrechtsgebieteContext.Provider>
  );
};

/**
 * Hook to use the Unterrechtsgebiete context
 * @returns {Object} The context value with unterrechtsgebiete data and methods
 */
export const useUnterrechtsgebiete = () => {
  const context = useContext(UnterrechtsgebieteContext);
  if (!context) {
    throw new Error('useUnterrechtsgebiete must be used within an UnterrechtsgebieteProvider');
  }
  return context;
};

export default UnterrechtsgebieteContext;
