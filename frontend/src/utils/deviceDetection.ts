/**
 * Detect if the user is on a mobile/tablet device
 * Returns true if mobile/tablet, false if desktop/laptop
 */
export const isMobileOrTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  
  // Check for common mobile/tablet indicators
  const mobileIndicators = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /IEMobile/i,
    /Opera Mini/i,
  ];
  
  const isMobile = mobileIndicators.some(regex => regex.test(userAgent));
  
  // Also check screen width as fallback
  const screenWidth = window.innerWidth;
  const isSmallScreen = screenWidth <= 1024;
  
  return isMobile || isSmallScreen;
};

/**
 * Get device type description
 */
export const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux';
  
  return 'unknown';
};
