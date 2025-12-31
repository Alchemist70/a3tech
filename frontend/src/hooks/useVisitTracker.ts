import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

/**
 * Hook to automatically record page visits
 * Uses combination of auth token (if available) and browser fingerprint
 */
export const useVisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const recordVisit = async () => {
      try {
        await api.post('/visits/record', {
          path: location.pathname,
          query: location.search,
        });
      } catch (error) {
        // Silently fail visit recording - don't disrupt user experience
        console.error('Failed to record visit:', error);
      }
    };

    recordVisit();
  }, [location.pathname, location.search]);
};