import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { saveFarmerStatus, getFarmerStatus } from '../../lib/idb';
import { useOutletContext, useNavigate } from 'react-router-dom';

// Status pipeline configuration
const STEPS = [
  { key: 'registered',         icon: '📝', descKey: 'Your registration has been received.' },
  { key: 'approved',           icon: '✅', descKey: 'Your registration is approved by the center.' },
  { key: 'scheduled',         icon: '📅', descKey: 'Your time slot has been assigned.' },
  { key: 'at_center',         icon: '🏛️', descKey: 'You are present at the center.' },
  { key: 'procured',          icon: '⚖️', descKey: 'Your crop has been weighed and recorded.' },
  { key: 'payment_processing',icon: '🏦', descKey: 'Payment is being processed.' },
  { key: 'paid',              icon: '💰', descKey: 'Payment has been credited to your account.' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ── Text-to-Speech hook ───────────────────────────────────
function useTTS() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);

  function speak(text, lang = 'en-IN') {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    u.onstart  = () => setSpeaking(true);
    u.onend    = () => setSpeaking(false);
    u.onerror  = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return { speak, stop, speaking, supported };
}

export default function DashboardPage() {
  const { farmer, apiFetch } = useAuth();
  const { t, lang } = useLang();
  const { isOnline } = useOutletContext();
  const navigate = useNavigate();
  const tts = useTTS();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [pendingReg, setPendingReg] = useState(null);

  useEffect(() => {
    loadStatus();
    // Listen for background sync completion
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_COMPLETE') {
          setPendingReg(null);
          loadStatus();
        }
      });
    }
  }, []);

  async function loadStatus() {
    // Check for pending offline registration
    const { getPendingRegistrations } = await import('../../lib/idb');
    const pending = await getPendingRegistrations();
    if (pending.length > 0) setPendingReg(pending[0]);

    if (!isOnline) {
      // Serve from cache
      const cached = await getFarmerStatus(farmer.id);
      if (cached) { setData(cached); setFromCache(true); }
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/farmers/${farmer.id}/status`);
      const json = await res.json();
      setData(json);
      await saveFarmerStatus(farmer.id, json);
    } catch {
      // Fall back to cache
      const cached = await getFarmerStatus(farmer.id);
      if (cached) { setData(cached); setFromCache(true); }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="state-box__icon">⏳</div>
        <div className="state-box__msg">{t('loading')}</div>
      </div>
    );
  }

  const { registration, token, payment } = data || {};
  const currentStepIndex = registration ? STEPS.findIndex(s => s.key === registration.status) : -1;

  return (
    <div>
      <h1 className="section-title">{t('dashboard_title')}</h1>

      {/* Offline cache notice */}
      {fromCache && data?.synced_at && (
        <p className="text-muted text-sm mb-4" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          🔄 {t('offline_banner')} {new Date(data.synced_at).toLocaleTimeString()}
        </p>
      )}

      {/* Pending offline registration */}
      {pendingReg && (
        <div className="pending-banner">
          <span className="pending-banner__icon">⏳</span>
          <div>
            <div className="pending-banner__label">{t('register_pending')}</div>
            <div className="pending-banner__text text-sm">
              {pendingReg.payload?.crop_type} — {pendingReg.payload?.expected_quantity} quintals
            </div>
          </div>
        </div>
      )}

      {!registration && !pendingReg ? (
        /* No registration state */
        <div className="state-box">
          <div className="state-box__icon">🌾</div>
          <div className="state-box__msg">{t('no_registration')}</div>
          <button className="btn btn--primary mt-4" style={{ maxWidth: 240, margin: '16px auto 0' }} onClick={() => navigate('/register')}>
            {t('register_now')}
          </button>
        </div>
      ) : (
        <>
          {/* Token card */}
          {token && (
            <div className="token-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <div className="token-card__label">{t('token_label')}</div>
                {/* 🔊 TTS button — hidden if Web Speech API not supported */}
                {tts.supported && (
                  <button
                    className={`tts-btn${tts.speaking ? ' tts-btn--speaking' : ''}`}
                    onClick={() => {
                      if (tts.speaking) { tts.stop(); return; }
                      const utterLang = lang === 'hi' ? 'hi-IN' : 'en-IN';
                      const statusText = t(`status_${registration.status}`);
                      const script = lang === 'hi'
                        ? `आपका टोकन नंबर ${token.token_number} है। ` +
                          `${registration.center_name || ''} पर ` +
                          `${token.date} को ${token.start_time} से ${token.end_time} के बीच आएं। ` +
                          `वर्तमान स्थिति: ${statusText}।`
                        : `Your token is ${token.token_number}. ` +
                          `Visit ${registration.center_name || 'the center'} ` +
                          `on ${token.date} between ${token.start_time} and ${token.end_time}. ` +
                          `Current status: ${statusText}.`;
                      tts.speak(script, utterLang);
                    }}
                    title={tts.speaking ? t('tts_speaking') : t('tts_listen')}
                    aria-label={tts.speaking ? t('tts_speaking') : t('tts_listen')}
                  >
                    {tts.speaking ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
              <div className="token-card__number">{String(token.token_number).padStart(2, '0')}</div>
              <div className="token-card__meta">
                <div className="token-card__meta-item">
                  <div className="token-card__meta-label">{t('center_label_d')}</div>
                  <div className="token-card__meta-value">{registration.center_name}</div>
                </div>
                <div className="token-card__meta-item">
                  <div className="token-card__meta-label">{t('date_label')}</div>
                  <div className="token-card__meta-value">{formatDate(token.date)}</div>
                </div>
                <div className="token-card__meta-item">
                  <div className="token-card__meta-label">{t('time_label')}</div>
                  <div className="token-card__meta-value">
                    {formatTime(token.start_time)}–{formatTime(token.end_time)}
                  </div>
                </div>
                <div className="token-card__meta-item">
                  <div className="token-card__meta-label">Crop</div>
                  <div className="token-card__meta-value">{registration.crop_type}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment summary if paid */}
          {payment?.status === 'completed' && payment?.amount && (
            <div className="card mb-4" style={{ borderLeft: '3px solid var(--gold)', background: 'var(--gold-bg)' }}>
              <div className="text-xs font-600" style={{ color: '#7a5a00', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Payment Received</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gold)' }}>
                ₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              {payment.payment_ref && <div className="text-xs text-muted mt-1">Ref: {payment.payment_ref}</div>}
            </div>
          )}

          {/* Status pipeline — vertical stepper */}
          <h2 className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--sp-4)' }}>
            {t('status_label')}
          </h2>
          <div className="pipeline">
            {STEPS.map((step, i) => {
              const isDone   = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              const isPaid   = step.key === 'paid' && registration.status === 'paid';

              let cls = 'pipeline__step';
              if (isDone)   cls += ' pipeline__step--done';
              if (isActive) cls += ' pipeline__step--active';
              if (isPaid)   cls += ' pipeline__step--paid';

              return (
                <div key={step.key} className={cls}>
                  <div className="pipeline__dot">{step.icon}</div>
                  <div className="pipeline__body">
                    <div className="pipeline__title">{t(`status_${step.key}`)}</div>
                    {isActive && <div className="pipeline__desc">{step.descKey}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
