import { useState, useEffect, useCallback } from 'react';

/**
 * useOnlineStatus - Hook to track browser online/offline status
 *
 * T33: Added for offline-aware saving in Themenliste Editor
 *
 * @returns {Object} { isOnline, lastOnlineAt }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnlineAt, setLastOnlineAt] = useState(
    typeof navigator !== 'undefined' && navigator.onLine ? Date.now() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, lastOnlineAt };
}

/**
 * useOnlineCallback - Execute callback when coming back online
 *
 * @param {Function} callback - Function to execute when online
 * @param {Array} deps - Dependencies for the callback
 */
export function useOnlineCallback(callback, deps = []) {
  const { isOnline } = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Just came back online
      callback();
      setWasOffline(false);
    }
  }, [isOnline, wasOffline, callback, ...deps]);
}

export default useOnlineStatus;
