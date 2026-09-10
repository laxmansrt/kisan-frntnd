import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  async function requestOtp(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/farmer/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStep('otp');
      const receivedOtp = data.dev_otp || '123456';
      setDevOtp(receivedOtp);
      setOtp(receivedOtp); // Auto-prefill the OTP in the input box!
      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoFarmer() {
    setMobile('9876543210');
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/farmer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile, otp_code: otp || '123456' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      login(data.farmer, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startCountdown() {
    setCountdown(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  }

  return (
    <div className="login-page">
      <img
        src="/logo.png"
        alt="KisanSaathi"
        style={{
          width: 104,
          height: 104,
          borderRadius: 24,
          marginBottom: 16,
          boxShadow: '0 8px 24px rgba(27,94,63,0.18)',
          objectFit: 'cover',
        }}
      />
      <h1 className="login-title">{t('app_name')}</h1>
      <p className="login-subtitle">{t('tagline')}</p>

      <div className="login-form">
        {step === 'mobile' ? (
          <form onSubmit={requestOtp}>
            {/* Demo Helper Banner */}
            <div className="pending-banner mb-4" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <span className="pending-banner__icon">💡</span>
              <div style={{ flex: 1 }}>
                <div className="pending-banner__label" style={{ color: '#166534', fontWeight: 600 }}>Demo / Testing Mode</div>
                <p className="text-muted text-sm mb-2" style={{ margin: '4px 0 8px 0', fontSize: '0.82rem' }}>
                  No real SMS needed! Enter any 10-digit number or click below:
                </p>
                <button
                  type="button"
                  className="btn btn--sm btn--secondary"
                  style={{ fontSize: '0.8rem', padding: '4px 10px', width: 'auto' }}
                  onClick={fillDemoFarmer}
                >
                  ⚡ Fill Demo Phone (9876543210)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mobile">{t('mobile_label')}</label>
              <input
                id="mobile"
                className="form-input"
                type="tel"
                placeholder={t('mobile_placeholder')}
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="tel"
                maxLength={10}
                style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}
              />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}
            <button className="btn btn--primary" type="submit" disabled={loading || mobile.length < 10}>
              {loading ? t('loading') : t('send_otp')}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              {t('otp_sent')}: <strong>{mobile}</strong>
            </p>

            <div className="pending-banner mb-4" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <span className="pending-banner__icon">🔑</span>
              <div style={{ flex: 1 }}>
                <div className="pending-banner__label" style={{ color: '#92400e', fontWeight: 600 }}>Demo OTP (Pre-filled)</div>
                <div className="pending-banner__text" style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: '#b45309', letterSpacing: '0.15em', margin: '4px 0' }}>
                  {devOtp || '123456'}
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', marginTop: 2, color: '#92400e', borderColor: '#fcd34d' }}
                  onClick={() => setOtp(devOtp || '123456')}
                >
                  ⚡ Re-fill OTP ({devOtp || '123456'})
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="otp">{t('otp_label')}</label>
              <input
                id="otp"
                className="form-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                style={{ fontSize: '1.5rem', letterSpacing: '0.2em', textAlign: 'center' }}
              />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}

            <button className="btn btn--primary" type="submit" disabled={loading || otp.length < 6}>
              {loading ? t('loading') : t('verify_otp')}
            </button>

            <div className="mt-4" style={{ textAlign: 'center' }}>
              {countdown > 0 ? (
                <span className="text-muted text-sm">Resend in {countdown}s</span>
              ) : (
                <button type="button" className="btn btn--ghost" onClick={requestOtp}>
                  {t('otp_resend')}
                </button>
              )}
            </div>

            <button type="button" className="btn btn--secondary mt-3 w-full" onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}>
              ← {t('back')}
            </button>
          </form>
        )}

        <hr className="divider mt-4" />
        <p className="text-center text-muted text-sm">
          Officer?{' '}
          <a href="/officer/login" style={{ color: 'var(--green-800)', fontWeight: 600 }}>
            Officer Login →
          </a>
        </p>
      </div>
    </div>
  );
}
