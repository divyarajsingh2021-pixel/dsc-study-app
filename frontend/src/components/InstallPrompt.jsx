import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Check if user dismissed before
      const dismissed = localStorage.getItem('dsc_install_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('dsc_install_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('dsc_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-[#090d16] via-[#1e1b4b] to-[#090d16] border-b border-cyan-500/30 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-300">
          <Smartphone size={18} />
        </div>
        <div className="truncate">
          <p className="font-bold text-white truncate flex items-center gap-1.5">
            <span>Install DSC Mobile App</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">PWA</span>
          </p>
          <p className="text-[11px] text-slate-300 truncate">
            {isIOS 
              ? "Tap Share ⎋ then 'Add to Home Screen' for instant 1-tap access" 
              : "Install to your phone home screen for instant 1-tap full-screen access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-white text-blue-700 font-bold text-xs rounded-lg shadow hover:bg-blue-50 transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Install</span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
