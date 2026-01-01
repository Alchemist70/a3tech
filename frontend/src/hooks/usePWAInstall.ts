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
    
    if (isStandalone) {
      console.log('[PWA] App is running in standalone mode (already installed)');
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    // Check if running in web browser mode (not in standalone app)
    const isWebBrowser = !isStandalone && typeof window !== 'undefined';
    
    if (isWebBrowser) {
      console.log('[PWA] Web browser mode detected, PWA installation available');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar or install prompt from appearing
      e.preventDefault();
      // Store the event for later use
      const evt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      setCanInstall(true);
      console.log('[PWA] Install prompt event fired (browser supports PWA install)');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Set canInstall to true if we're in web browser mode, even if beforeinstallprompt hasn't fired yet
    // This handles cases where browsers may not fire the event immediately or at all
    const timer = setTimeout(() => {
      if (isWebBrowser && !isStandalone) {
        // If we're in web browser and not standalone, show install button
        // This is a fallback for browsers where beforeinstallprompt may not fire immediately
        console.log('[PWA] Timeout: Setting canInstall to true (web browser fallback)');
        setCanInstall(true);
      }
    }, 1000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
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

