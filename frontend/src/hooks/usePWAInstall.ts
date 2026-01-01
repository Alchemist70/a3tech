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

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar or install prompt from appearing
      e.preventDefault();
      // Store the event for later use
      const evt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      setCanInstall(true);
      console.log('[PWA] Install prompt available (web browser mode)');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
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
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

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
      console.error('[PWA] Installation failed:', error);
    }
  };

  return {
    canInstall,
    isInstalled,
    installApp
  };
}

