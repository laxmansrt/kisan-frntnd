import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { savePendingRegistration } from '../../lib/idb';

const CROPS = ['Paddy', 'Maize', 'Cotton', 'Sunflower', 'Jowar', 'Groundnut'];

export default function RegisterPage() {
  const { farmer, apiFetch, token } = useAuth();
  const { t } = useLang();
  const { isOnline } = useOutletContext();
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState({
    name: farmer?.name || '',
    village: farmer?.village || '',
    center_id: '',
    crop_type: '',
    expected_quantity: '',
    language_preference: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetch('/api/centers').then(r => r.json()).then(setCenters).catch(() => {});
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);

    const payload = {
      name: form.name,
      village: form.village,
      center_id: parseInt(form.center_id),
      crop_type: form.crop_type,
      expected_quantity: parseFloat(form.expected_quantity),
      language_preference: form.language_preference,
    };

    // OFFLINE path — queue registration
    if (!isOnline) {
      const tempId = `pending_${Date.now()}`;
      await savePendingRegistration(tempId, payload, token);

      // Register Background Sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const sw = await navigator.serviceWorker.ready;
        await sw.sync.register('sync-registrations');
      }

      setSuccess({ offline: true });
      setLoading(false);
      return;
    }

    // ONLINE path — register immediately
    try {
      const res = await apiFetch('/api/farmers/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    if (success.offline) {
      return (
        <div>
          <h1 className="section-title">{t('register_title')}</h1>
          <div className="pending-banner">
            <span className="pending-banner__icon">⏳</span>
            <div>
              <div className="pending-banner__label">Queued for Registration</div>
              <div className="pending-banner__text">{t('register_offline')}</div>
            </div>
          </div>
          <button className="btn btn--secondary w-full" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      );
    }

    return (
      <div>
        <h1 className="section-title">{t('register_title')}</h1>
        <div style={{ textAlign: 'center', padding: 'var(--sp-8) var(--sp-4)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>✅</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--sp-2)' }}>
            {t('register_success')}
          </div>
          {success.token && (
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--gold)', margin: 'var(--sp-4) 0' }}>
              Token #{String(success.token.token_number).padStart(2, '0')}
            </div>
          )}
          {success.slot && (
            <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: 'var(--sp-6)' }}>
              {success.slot.date} · {success.slot.start_time}–{success.slot.end_time}
            </div>
          )}
          <button className="btn btn--primary" onClick={() => navigate('/dashboard')}>
            View Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">{t('register_title')}</h1>

      {!isOnline && (
        <div className="pending-banner mb-4">
          <span className="pending-banner__icon">📶</span>
          <div>
            <div className="pending-banner__label">You're Offline</div>
            <div className="pending-banner__text text-sm">{t('register_offline')}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">{t('name_label')}</label>
          <input id="name" className="form-input" type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="village">{t('village_label')}</label>
          <input id="village" className="form-input" type="text" value={form.village} onChange={e => set('village', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="crop">{t('crop_label')}</label>
          <select id="crop" className="form-select" value={form.crop_type} onChange={e => set('crop_type', e.target.value)} required>
            <option value="">— Select Crop —</option>
            {CROPS.map(c => <option key={c} value={c}>{t(`crop_${c.toLowerCase()}`)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="qty">{t('quantity_label')}</label>
          <input
            id="qty" className="form-input"
            type="number" min="1" max="200" step="0.5"
            value={form.expected_quantity}
            onChange={e => set('expected_quantity', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="center">{t('center_label')}</label>
          <select id="center" className="form-select" value={form.center_id} onChange={e => set('center_id', e.target.value)} required>
            <option value="">— Select Center —</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.load_percent}% full today)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Preferred Language</label>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            {['en', 'hi'].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => set('language_preference', l)}
                style={{
                  flex: 1, padding: 'var(--sp-3)', border: '2px solid',
                  borderColor: form.language_preference === l ? 'var(--green-800)' : 'var(--border)',
                  borderRadius: 'var(--radius)', background: form.language_preference === l ? 'var(--green-50)' : 'var(--bg-card)',
                  fontWeight: 600, color: form.language_preference === l ? 'var(--green-800)' : 'var(--ink-muted)',
                  cursor: 'pointer', minHeight: 48,
                }}
              >
                {l === 'en' ? 'English' : 'हिंदी'}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form-error mb-4">⚠ {error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? t('registering') : t('submit_register')}
        </button>
      </form>
    </div>
  );
}
