import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { recordEvent, getEvents, clearEvents, downloadEvents } from '../utils/examTelemetry';

interface SafeExamModeContextType {
  isExamMode: boolean;
  setIsExamMode: (value: boolean) => void;
  enterFullscreenMode: () => Promise<void>;
  exitFullscreenMode: () => Promise<void>;
}

const SafeExamModeContext = createContext<SafeExamModeContextType | undefined>(undefined);

export const SafeExamModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isExamMode, setIsExamMode] = useState(false);
  const [showFullscreenLostOverlay, setShowFullscreenLostOverlay] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [telemetryEvents, setTelemetryEvents] = useState<any[]>([]);


  const enterFullscreenMode = useCallback(async () => {
    try {
      // Fullscreen is requested/maintained via the useEffect above
      // This is a fallback if something else tries to request it
      if (document.fullscreenElement) {
        // eslint-disable-next-line no-console
        console.log('[SafeExamMode] Fullscreen already active');
        return;
      }

      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        try {
          await elem.requestFullscreen();
          // eslint-disable-next-line no-console
          console.log('[SafeExamMode] Fullscreen request via callback');
        } catch (err) {
          // Silently fail - may not have user gesture in callback context
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[SafeExamMode] enterFullscreenMode fallback failed:', (err as any)?.message);
          }
        }
      }
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[SafeExamMode] Error in enterFullscreenMode:', error?.message);
      }
    }
  }, []);

  const exitFullscreenMode = useCallback(async () => {
    try {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isInFullscreen) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[SafeExamMode] not in fullscreen, skipping exit');
        }
        return;
      }

      const promise: Promise<void> | undefined =
        document.exitFullscreen?.() ||
        (document as any).webkitExitFullscreen?.() ||
        (document as any).mozCancelFullScreen?.() ||
        (document as any).msExitFullscreen?.();

      if (promise) {
        await promise;
        
        // Restore document styles after exiting fullscreen
        const element = document.documentElement;
        element.style.width = '';
        element.style.height = '';
        element.style.margin = '';
        element.style.padding = '';
        element.style.border = '';
        element.style.overflow = '';
        
        const bodyElement = document.body;
        bodyElement.style.width = '';
        bodyElement.style.height = '';
        bodyElement.style.margin = '';
        bodyElement.style.padding = '';
        bodyElement.style.overflow = '';
        
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[SafeExamMode] exited fullscreen successfully');
        }
      }
    } catch (error: any) {
      console.error('[SafeExamMode] fullscreen exit failed:', error?.name, error?.message);
    }
  }, []);

  // Lock body/html overflow when in fullscreen to prevent scrollbars from causing fullscreen exit
  useEffect(() => {
    if (!isExamMode) {
      // Restore overflow when exiting exam mode
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      return;
    }

    // Set overflow: hidden on html and body to prevent scrollbars during fullscreen
    // This prevents the viewport from shifting which can cause fullscreen to exit in some browsers
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Monitor fullscreenchange events to warn if fullscreen is unexpectedly exited
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      if (!isCurrentlyFullscreen && isExamMode) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[SafeExamMode] Fullscreen was unexpectedly exited while in exam mode');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isExamMode]);

  // Allow pages to hide the overlay when they are ready to show their own UI
  useEffect(() => {
    const onHideOverlay = () => setShowFullscreenLostOverlay(false);
    window.addEventListener('exam:overlay-hide', onHideOverlay as EventListener);
    return () => window.removeEventListener('exam:overlay-hide', onHideOverlay as EventListener);
  }, []);

  // Update telemetry events snapshot for debug UI periodically
  useEffect(() => {
    if (!debugPanelOpen) return;
    const refresh = () => setTelemetryEvents(getEvents().slice(-100));
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [debugPanelOpen]);

  // Prevent keyboard shortcuts for tab switching when in exam mode
  useEffect(() => {
    if (!isExamMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Suppress Escape key while in exam mode and notify pages to show confirmation
      if (isExamMode && (e.key === 'Escape' || e.key === 'Esc')) {
        try {
          e.preventDefault();
          e.stopImmediatePropagation();
        } catch (err) {}
        try {
          // record that an escape key was observed by this handler
          recordEvent('escape_key_detected', { key: e.key });
        } catch (err) {}
        try {
          window.dispatchEvent(new CustomEvent('exam:escape'));
        } catch (err) {}
        return;
      }

      // Prevent Ctrl+Tab, Ctrl+Shift+Tab (tab switching)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Tab' || e.code === 'Tab')) {
        e.preventDefault();
        return;
      }

      // Prevent Alt+Tab (Windows task switcher) - browser may not allow this due to OS-level restriction
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        return;
      }

      // Prevent Ctrl+W, Ctrl+Q (close tab/browser)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W' || e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        return;
      }

      // Prevent F11 (fullscreen toggle which could exit our fullscreen)
      if (e.key === 'F11') {
        e.preventDefault();
        return;
      }

      // Temporarily disabled for debugging: Prevent F12 (developer tools)
      // if (e.key === 'F12') {
      //   e.preventDefault();
      //   return;
      // }

      // Prevent right-click context menu
      if (e.code === 'ContextMenu') {
        e.preventDefault();
        return;
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent page unload with warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return false;
    };

    // Register capture-phase, non-passive listeners on multiple targets to maximize
    // the chance of intercepting Escape before the browser handles fullscreen exit.
    const opts: AddEventListenerOptions = { capture: true, passive: false };

    window.addEventListener('keydown', handleKeyDown, opts as any);
    document.addEventListener('keydown', handleKeyDown, opts as any);
    document.documentElement.addEventListener('keydown', handleKeyDown, opts as any);
    // Also listen on body for completeness
    document.body.addEventListener('keydown', handleKeyDown, opts as any);

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Additionally, dispatch a custom event immediately when the browser exits fullscreen
    // so pages can show UI faster than relying on the native fullscreenchange alone.
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isCurrentlyFullscreen && isExamMode) {
        try {
          // show overlay immediately to mask browser chrome
          setShowFullscreenLostOverlay(true);
        } catch (err) {}
        try {
          // record fullscreen exit event and whether an escape key was recently detected
          const events = getEvents();
          const last = events.length ? events[events.length - 1] : null;
          const lastWasEscape = last && last.type === 'escape_key_detected';
          recordEvent('fullscreen_exited', { lastWasEscape });
        } catch (err) {}
        try {
          window.dispatchEvent(new CustomEvent('exam:fullscreen-exited'));
        } catch (err) {}
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange, { capture: true });

    return () => {
      try { window.removeEventListener('keydown', handleKeyDown, opts as any); } catch (e) {}
      try { document.removeEventListener('keydown', handleKeyDown, opts as any); } catch (e) {}
      try { document.documentElement.removeEventListener('keydown', handleKeyDown, opts as any); } catch (e) {}
      try { document.body.removeEventListener('keydown', handleKeyDown, opts as any); } catch (e) {}
      try { document.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any); } catch (e) {}
      try { window.removeEventListener('beforeunload', handleBeforeUnload); } catch (e) {}
      try { document.removeEventListener('fullscreenchange', handleFullscreenChange, { capture: true } as any); } catch (e) {}
    };
  }, [isExamMode]);

  return (
    <SafeExamModeContext.Provider value={{ isExamMode, setIsExamMode, enterFullscreenMode, exitFullscreenMode }}>
      {children}
      {isExamMode && showFullscreenLostOverlay && (
        <div
          id="__exam_fullscreen_lost_overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.88)',
            zIndex: 2147483646,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Debug UI: toggle button + panel (shows recent telemetry) - DISABLED */}
      <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 2147483647, display: 'none' }}>
        {!debugPanelOpen ? (
          <button
            onClick={() => { setDebugPanelOpen(true); setTelemetryEvents(getEvents().slice(-100)); }}
            style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
            aria-label="Open exam debug panel"
          >
            Exam Debug
          </button>
        ) : (
          <div style={{ width: 420, maxHeight: '60vh', overflow: 'auto', background: '#0b1220', color: '#e6eef8', border: '1px solid #263347', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.6)', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>Exam Telemetry</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { clearEvents(); setTelemetryEvents([]); }} style={{ padding: '4px 8px' }}>Clear</button>
                <button onClick={() => downloadEvents()} style={{ padding: '4px 8px' }}>Download</button>
                <button onClick={() => setDebugPanelOpen(false)} style={{ padding: '4px 8px' }}>Close</button>
              </div>
            </div>
            <div style={{ fontSize: 12 }}>
              {telemetryEvents.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No events recorded yet.</div>
              ) : (
                telemetryEvents.slice().reverse().map((ev: any, idx: number) => (
                  <div key={idx} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: 4 }}>
                    <div style={{ color: '#9fb6ff', fontWeight: 700 }}>{ev.type}</div>
                    <div style={{ color: '#bcd3ff', fontSize: 11 }}>{new Date(ev.ts).toLocaleString()}</div>
                    {ev.details && <pre style={{ whiteSpace: 'pre-wrap', color: '#dfefff', marginTop: 6, fontSize: 11 }}>{JSON.stringify(ev.details)}</pre>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </SafeExamModeContext.Provider>
  );
};

export const useSafeExamMode = (): SafeExamModeContextType => {
  const context = useContext(SafeExamModeContext);
  if (!context) {
    throw new Error('useSafeExamMode must be used within SafeExamModeProvider');
  }
  return context;
};
