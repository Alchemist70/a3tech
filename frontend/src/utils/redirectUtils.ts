/**
 * Utility function to determine redirect path based on user's education level
 */
export const getRedirectPathByEducationLevel = (educationLevel?: string): string => {
  if (!educationLevel) return '/';
  
  // High School users should be redirected to root '/' where Home renders the dedicated page
  if (educationLevel === 'high-school') {
    return '/';
  }
  
  // All other users go to default home page
  return '/';
};
