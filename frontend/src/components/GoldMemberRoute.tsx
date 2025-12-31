import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import Spinner from './Spinner';

interface GoldMemberRouteProps {
  children: React.ReactNode;
  requireGold?: boolean;
}

const GoldMemberRoute: React.FC<GoldMemberRouteProps> = ({ 
  children,
  requireGold = true
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { openLogin } = useAuthModal();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const location = useLocation();

  // CRITICAL DEBUG: Log the auth and premium state
  console.debug('[GoldMemberRoute] State:', {
    isAuthenticated,
    isAuthLoading: isLoading,
    userExists: !!user,
    userSubscribed: user?.isSubscribed,
    userIsGoldMember: !!(user as any)?.isGoldMember || !!(user as any)?.isGold,
    userIsPremium: !!(user as any)?.isPremium,
    isPremium,
    isPremiumLoading
  });

  if (isLoading) {
    return <Spinner />;
  }

  // For gold-member/subscribed required routes
  if (requireGold) {
    if (!isAuthenticated) {
      // Open the login modal for unauthenticated users
      openLogin();
      // Do not render the protected page while login is in progress
      return null;
    }

    // CRITICAL FIX: ALWAYS check all premium flags first (isSubscribed, isGoldMember, isPremium)
    // If user has any premium flag locally, allow access IMMEDIATELY to prevent redirect on refresh
    if (user) {
      const isSubscribed = !!user.isSubscribed;
      const isGoldMember = !!(user as any).isGoldMember || !!(user as any).isGold;
      const isPremium = !!(user as any).isPremium;
      const hasPremiumAccess = isSubscribed || isGoldMember || isPremium;
      
      if (hasPremiumAccess) {
        console.debug('[GoldMemberRoute] User has premium access (local flags), allowing access:', { isSubscribed, isGoldMember, isPremium });
        return <>{children}</>;
      }
    }

    // CRITICAL FIX: If premium status verification is still loading, show spinner
    if (isPremiumLoading) {
      console.debug('[GoldMemberRoute] Waiting for premium status verification...');
      return <Spinner />;
    }

    // CRITICAL FIX: Only redirect if we're SURE user is not premium
    // If isPremium is false AND we've completed verification, then redirect
    if (!isPremium) {
      console.debug('[GoldMemberRoute] User is not premium, redirecting to subscription');
      return <Navigate to="/subscription" state={{ from: location }} replace />;
    }

    // If premium status verified as true, allow access
    return <>{children}</>;
  }

  // For regular authenticated routes
  if (!isAuthenticated) {
    openLogin();
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default GoldMemberRoute;