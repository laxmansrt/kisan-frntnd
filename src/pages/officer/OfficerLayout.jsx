import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { OfficerAuthProvider, useOfficerAuth } from '../../context/OfficerAuthContext';
import { useEffect, useState, useCallback } from 'react';

const NAV = [
  { path: '/officer/dashboard',         label: 'Overview',      icon: '📊' },
  { path: '/officer/queue',             label: 'Queue',         icon: '📋' },
  { path: '/officer/procure',           label: 'Procure',       icon: '⚖️' },
  { path: '/officer/payment',           label: 'Payments',      icon: '💳' },
  { path: '/officer/slots',             label: 'Slots',         icon: '🕐' },
  { path: '/officer/assisted-register', label: 'Assist Farmer', icon: '🤝' },
];

const IconMenu  = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>
);

function Layout() {
  const { officer, logout } = useOfficerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { if (!officer) navigate('/officer/login'); }, [officer]);
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!officer) return null;

  const isActive = path => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>

      {/* ─────────────────────────────────────────────
          SIDEBAR — always visible on desktop,
          hidden (drawer) on mobile
      ───────────────────────────────────────────── */}
      <>
        {/* Backdrop — mobile only, appears behind open drawer */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'none',
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 149,
            }}
            className="mob-only"
          />
        )}

        <aside
          className="officer-sidebar-el"
          style={{
            background: '#1a1d15',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            width: 224,
            flexShrink: 0,
            padding: '24px 0',
            minHeight: '100dvh',
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            height: '100dvh',
            overflowY: 'auto',
          }}
        >
          <SidebarContent officer={officer} logout={logout} navigate={navigate} isActive={isActive} />
        </aside>
      </>

      {/* ─────────────────────────────────────────────
          MOBILE DRAWER — fixed position overlay
      ───────────────────────────────────────────── */}
      <>
        <div
          className="mob-drawer"
          style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: 270,
            background: '#1a1d15',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 0',
            zIndex: 160,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: drawerOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
            overflowY: 'auto',
          }}
          aria-hidden={!drawerOpen}
        >
          <SidebarContent officer={officer} logout={logout} navigate={navigate} isActive={isActive} />
        </div>

        {/* Overlay */}
        <div
          className="mob-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 159,
            opacity: drawerOpen ? 1 : 0,
            pointerEvents: drawerOpen ? 'auto' : 'none',
            transition: 'opacity 0.26s',
          }}
        />
      </>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT
      ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Mobile top bar — hamburger + title */}
        <div
          className="mob-topbar"
          style={{
            background: '#1a1d15',
            color: '#fff',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky', top: 0, zIndex: 100,
          }}
        >
          <button
            onClick={() => setDrawerOpen(d => !d)}
            aria-label="Toggle menu"
            style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            {drawerOpen ? <IconClose /> : <IconMenu />}
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>🏛️ GovProcure</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
            {officer.center_name}
          </span>
        </div>

        {/* Page outlet */}
        <div style={{ flex: 1, paddingBottom: 70 }}>
          <Outlet />
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MOBILE BOTTOM NAV — hidden on desktop via CSS
      ───────────────────────────────────────────── */}
      <nav className="off-bottom-nav">
        {NAV.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`off-bottom-item${isActive(item.path) ? ' off-bottom-item--active' : ''}`}
          >
            <span className="off-bottom-icon">{item.icon}</span>
            <span className="off-bottom-label">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}

// Extracted sidebar content (shared between desktop sidebar and mobile drawer)
function SidebarContent({ officer, logout, navigate, isActive }) {
  return (
    <>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>🏛️ GovProcure</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 3 }}>Officer Portal</div>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              fontSize: '0.9rem', fontWeight: 500,
              color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive(item.path) ? 'var(--green-800)' : 'none',
              border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.45, marginBottom: 3 }}>Logged in as</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 }}>{officer.name}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.45, marginBottom: 12 }}>{officer.center_name}</div>
        <button
          onClick={() => { logout(); navigate('/officer/login'); }}
          style={{
            width: '100%', padding: '7px', borderRadius: 6,
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </>
  );
}

export default function OfficerLayout() {
  return <OfficerAuthProvider><Layout /></OfficerAuthProvider>;
}
