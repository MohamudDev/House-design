import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for a newer deployed version right away. This matters most for
        // the installed/PWA (home screen) launch, where the cached app shell is
        // shown instantly but may be stale — without this, a logged-in admin
        // could briefly land on the cached Landing page instead of the dashboard
        // until the periodic/focus check eventually fired.
        registration.update();

        // Periodically check for updates every 15 minutes
        setInterval(() => {
          registration.update();
        }, 15 * 60 * 1000);

        // Check for updates when app tab/window gains focus or becomes visible
        // again (covers PWA being resumed from the background on mobile).
        window.addEventListener('focus', () => {
          registration.update();
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 items-end">
      {needRefresh && (
        <div className="bg-slate-900/95 backdrop-blur text-white border border-slate-700/80 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="text-xs font-medium">
            ✨ App update available!
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <RefreshCw size={13} className="animate-spin" />
            Update App
          </button>
        </div>
      )}

      {supportsPWA && (
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors font-medium text-sm"
          onClick={onClick}
        >
          <Download size={18} />
          Install App
        </button>
      )}
    </div>
  );
}
