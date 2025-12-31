import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // If not authenticated at all, user cannot be premium
    if (!isAuthenticated) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    // If AuthContext is still bootstrapping (fetching profile), wait for it to finish
    // This avoids duplicate /users/profile calls and rate-limiting.
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // If AuthContext provided a user, use its authoritative flags (no extra API call)
    if (user) {
      const isSubscribed = !!user.isSubscribed;
      const isGoldMember = !!(user as any).isGoldMember || !!(user as any).isGold;
      const isPremiumUser = isSubscribed || isGoldMember || !!(user as any).isPremium;
      setIsPremium(isPremiumUser);
      setIsLoading(false);
      console.debug('[usePremiumStatus] Using AuthContext user for premium:', { isSubscribed, isGoldMember, isPremium: isPremiumUser });
      return;
    }

    // Otherwise (authenticated but no user in context), perform a single verification call
    setIsLoading(true);
    let mounted = true;
    const verifyPremiumStatus = async () => {
      try {
        const response = await api.get('/users/profile');
        if (response && response.data && response.data.data) {
          const profileData = response.data.data;
          const isSubscribed = !!profileData.isSubscribed;
          const isGoldMember = !!profileData.isGoldMember || !!profileData.isGold;
          const isPremiumUser = isSubscribed || isGoldMember || !!profileData.isPremium;
          if (mounted) setIsPremium(isPremiumUser);
          console.debug('[usePremiumStatus] Verified from backend (standalone):', { isSubscribed, isGoldMember, isPremium: isPremiumUser });
        }
      } catch (error) {
        console.error('[usePremiumStatus] Error verifying premium status:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    verifyPremiumStatus();
    return () => { mounted = false; };
  }, [isAuthenticated, authLoading, user?._id]);

  return { isPremium, isLoading };
};

export default usePremiumStatus;
