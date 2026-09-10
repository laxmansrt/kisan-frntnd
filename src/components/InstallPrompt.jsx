import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        left: 16,
        right: 16,
        maxWidth: 420,
        margin: '0 auto',
        backgroundColor: '#1B5E3F',
        color: '#ffffff',
        padding: '12px 16px',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 9999,
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/icon-192.png" alt="KisanSaathi" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
            Install KisanSaathi
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>
            Use offline & access from Home Screen
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            backgroundColor: '#F7F4EC',
            color: '#1B5E3F',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: 'none',
            padding: '4px 8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
