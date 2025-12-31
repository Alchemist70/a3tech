import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    // CRITICAL FIX: Immediately set isPremium from local user.isSubscribed
    // This prevents race conditions and gives immediate feedback
    const localPremiumStatus = !!user?.isSubscribed;
    setIsPremium(localPremiumStatus);
    setIsLoading(false);

    console.debug('[usePremiumStatus] Initial status:', { 
      userSubscribed: user?.isSubscribed,
      isPremium: localPremiumStatus
    });

    // Then verify the current premium status from backend in the background
    // This ensures we catch gold member status and subscription changes
    const verifyPremiumStatus = async () => {
      try {
        const response = await api.get('/users/profile');
        if (response && response.data && response.data.data) {
          const profileData = response.data.data;
          // isPremium = isSubscribed OR isGoldMember
          const isPremiumUser = profileData.isSubscribed || profileData.isGoldMember;
          
          setIsPremium(isPremiumUser);
          console.debug('[usePremiumStatus] Verified from backend:', { 
            isSubscribed: profileData.isSubscribed,
            isGoldMember: profileData.isGoldMember,
            isPremium: isPremiumUser
          });
        }
      } catch (error) {
        console.error('[usePremiumStatus] Error verifying premium status:', error);
        // On error, keep the local value - don't deny access if backend fails
        setIsPremium(localPremiumStatus);
      }
    };

    // CRITICAL FIX: ALWAYS verify with backend, not just when local status is false
    // This ensures Gold Members (isSubscribed=false but isGoldMember=true) are detected
    // Remove the condition: if (!localPremiumStatus) { ... }
    // Always call verification to get authoritative answer from backend
    verifyPremiumStatus();

  }, [isAuthenticated, user?._id]);

  return { isPremium, isLoading };
};

export default usePremiumStatus;
