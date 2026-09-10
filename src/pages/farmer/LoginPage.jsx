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
      if (data.dev_otp) setDevOtp(data.dev_otp);
      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/farmer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile, otp_code: otp }),
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
      <div className="login-logo">🌾</div>
      <h1 className="login-title">{t('app_name')}</h1>
      <p className="login-subtitle">{t('tagline')}</p>

      <div className="login-form">
        {step === 'mobile' ? (
          <form onSubmit={requestOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="mobile">{t('mobile_label')}</label>
              <input
                id="mobile"
                className="form-input"
                type="tel"
                placeholder={t('mobile_placeholder')}
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
                autoComplete="tel"
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

            <div className="pending-banner mb-4">
              <span className="pending-banner__icon">🔑</span>
              <div>
                <div className="pending-banner__label">Demo OTP</div>
                <div className="pending-banner__text" style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {devOtp || '123456'}
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', marginTop: 4 }}
                  onClick={() => setOtp(devOtp || '123456')}
                >
                  ⚡ Auto-fill OTP
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
