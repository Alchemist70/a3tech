import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    console.log('[PWA] isStandalone:', isStandalone, 'display-mode:', window.matchMedia('(display-mode: standalone)').matches, 'navigator.standalone:', (window.navigator as any).standalone);

    if (isStandalone) {
      console.log('[PWA] App is running in standalone mode (already installed)');
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    // If we reach here, we're in web browser mode - show install button
    console.log('[PWA] Web browser mode detected - install button should be visible');
    setCanInstall(true);
    setIsInstalled(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar or install prompt from appearing
      e.preventDefault();
      // Store the event for later use
      const evt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      console.log('[PWA] beforeinstallprompt event fired');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // If we have deferredPrompt, use it (most reliable method)
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();
        // Wait for user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User response:', outcome);
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        
        // Clear the deferredPrompt for the next time
        setDeferredPrompt(null);
        setCanInstall(false);
      } catch (error) {
        console.error('[PWA] Installation with prompt failed:', error);
      }
      return;
    }

    // Fallback: Try share-like install method for browsers without native install prompt
    // Some mobile browsers might support this
    if ((navigator as any).share) {
      try {
        console.log('[PWA] Using share method as install fallback');
        await (navigator as any).share({
          title: 'A3 Tech',
          text: 'Install the A3 Tech app',
          url: window.location.href
        });
      } catch (error) {
        console.log('[PWA] Share fallback dismissed or failed:', error);
      }
    } else {
      console.log('[PWA] No install method available, showing instructions');
      // Show browser-specific installation instructions
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
      
      if (isChrome) {
        alert('To install this app:\n1. Tap the menu (⋮) in Chrome\n2. Tap "Install app" or "Add to Home screen"');
      } else if (isSafari) {
        alert('To install this app:\n1. Tap the Share button\n2. Tap "Add to Home Screen"');
      } else {
        alert('To install this app, look for the "Add to Home Screen" or "Install" option in your browser menu');
      }
    }
  };

  return {
    canInstall,
    isInstalled,
    installApp
  };
}

