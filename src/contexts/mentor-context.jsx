import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'prepwell_mentor_activated';

/**
 * MentorContext - Manages mentor activation state
 *
 * The mentor feature requires explicit activation by the user.
 * Once activated, statistics and analytics become available.
 */
const MentorContext = createContext(null);

/**
 * Load mentor state from localStorage
 */
const loadMentorState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading mentor state:', error);
  }
  return { isActivated: false, activatedAt: null };
};

/**
 * Save mentor state to localStorage
 */
const saveMentorState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving mentor state:', error);
  }
};

/**
 * MentorProvider component
 */
export const MentorProvider = ({ children }) => {
  const [mentorState, setMentorState] = useState(loadMentorState);

  // Persist state changes to localStorage
  useEffect(() => {
    saveMentorState(mentorState);
  }, [mentorState]);

  /**
   * Activate the mentor feature
   */
  const activateMentor = () => {
    setMentorState({
      isActivated: true,
      activatedAt: new Date().toISOString()
    });
  };

  /**
   * Deactivate the mentor feature (reset)
   */
  const deactivateMentor = () => {
    setMentorState({
      isActivated: false,
      activatedAt: null
    });
  };

  const value = {
    isActivated: mentorState.isActivated,
    activatedAt: mentorState.activatedAt,
    activateMentor,
    deactivateMentor
  };

  return (
    <MentorContext.Provider value={value}>
      {children}
    </MentorContext.Provider>
  );
};

/**
 * useMentor hook - Access mentor context
 */
export const useMentor = () => {
  const context = useContext(MentorContext);
  if (!context) {
    throw new Error('useMentor must be used within a MentorProvider');
  }
  return context;
};

export default MentorContext;
