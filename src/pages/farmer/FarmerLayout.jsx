import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

// Icons
const IconDash  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconReg   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconMap   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const IconBell  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconWifi  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;

export default function FarmerLayout() {
  const { farmer, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function onOnline()  { setIsOnline(true);  }
    function onOffline() { setIsOnline(false); setLastSynced(new Date()); }
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">🌾 {t('app_name')}</div>
        <div className="app-header__actions">
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang === 'en' ? 'हिं' : 'EN'}
          </button>
          <button className="btn btn--ghost" style={{ color: 'rgba(255,255,255,0.8)', padding: '4px 8px', minHeight: 'auto', fontSize: '0.8rem' }} onClick={handleLogout}>
            {t('nav_logout')}
          </button>
        </div>
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          <IconWifi />
          <span>
            {t('offline_banner')}{' '}
            {lastSynced ? lastSynced.toLocaleTimeString() : '—'}
          </span>
        </div>
      )}

      {/* Page content */}
      <main className="page-content" style={{ paddingBottom: '80px' }}>
        <Outlet context={{ isOnline, farmer }} />
      </main>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
          <IconDash />
          <span>{t('nav_dashboard')}</span>
        </NavLink>
        <NavLink to="/register" className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
          <IconReg />
          <span>{t('nav_register')}</span>
        </NavLink>
        <NavLink to="/centers" className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
          <IconMap />
          <span>{t('nav_centers')}</span>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}>
          <IconBell />
          <span>{t('nav_notifications')}</span>
        </NavLink>
      </nav>
    </div>
  );
}
