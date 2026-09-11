import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOfficerAuth } from '../../context/OfficerAuthContext';

const CROPS = ['Paddy', 'Maize', 'Cotton', 'Sunflower', 'Jowar', 'Groundnut'];

export default function OfficerAssistedRegisterPage() {
  const { officer, apiFetch } = useOfficerAuth();
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState({
    mobile_number: '',
    name: '',
    village: '',
    center_id: String(officer?.center_id || ''),
    crop_type: '',
    expected_quantity: '',
    language_preference: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/centers').then(r => r.json()).then(setCenters).catch(() => {});
    apiFetch('/api/officer/assisted-stats')
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      const res = await apiFetch('/api/officer/assisted-register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          center_id: form.center_id,
          expected_quantity: parseFloat(form.expected_quantity),
        }),
      });

      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await res.json(); } catch { data = null; }
      }

      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    setError('');
    setForm(f => ({
      ...f,
      mobile_number: '', name: '', village: '',
      crop_type: '', expected_quantity: '',
    }));
    // Refresh stats after each successful registration
    apiFetch('/api/officer/assisted-stats')
      .then(r => r.json()).then(setStats).catch(() => {});
  }

  // ── Success screen ──────────────────────────────────────
  if (success) {
    const { token, slot, farmer } = success;
    return (
      <div>
        <h1 className="section-title">🤝 Assisted Registration</h1>
        <div style={{
          background: 'var(--green-50)', border: '2px solid var(--green-800)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)',
          textAlign: 'center', marginBottom: 'var(--sp-4)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-3)' }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green-800)', marginBottom: 'var(--sp-2)' }}>
            Registration Successful!
          </div>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-4)' }}>
            {farmer?.name} · {farmer?.mobile_number}
          </div>

          {token && (
            <div style={{
              background: 'var(--green-800)', color: '#fff',
              borderRadius: 'var(--radius)', padding: 'var(--sp-4) var(--sp-6)',
              display: 'inline-block', marginBottom: 'var(--sp-4)',
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Token Number
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1 }}>
                {String(token.token_number).padStart(2, '0')}
              </div>
            </div>
          )}

          {slot && (
            <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-6)' }}>
              📅 {slot.date} &nbsp;·&nbsp; ⏰ {slot.start_time}–{slot.end_time}
            </div>
          )}

          <div style={{
            background: 'rgba(27,94,63,0.08)', borderRadius: 'var(--radius)',
            padding: 'var(--sp-3) var(--sp-4)', fontSize: '0.8rem',
            color: 'var(--green-800)', marginBottom: 'var(--sp-6)',
          }}>
            📱 An SMS has been sent to the farmer's number
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <button className="btn btn--primary" style={{ flex: 1 }} onClick={resetForm}>
            Register Another Farmer
          </button>
          <button className="btn btn--secondary" onClick={() => navigate('/officer/queue')}>
            View Queue
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────
  return (
    <div>
      <h1 className="section-title">🤝 Assisted Registration</h1>
      <p className="text-muted text-sm mb-4" style={{ marginBottom: 'var(--sp-4)' }}>
        Register a crop on a farmer's behalf — for farmers who cannot use the app themselves.
        This registration will be tagged as <strong>assisted</strong> in the system.
      </p>

      {/* Channel stats badge */}
      {stats && stats.total > 0 && (
        <div style={{
          display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap',
          marginBottom: 'var(--sp-5)',
        }}>
          {[
            { label: 'Self', count: stats.self, color: 'var(--green-800)' },
            { label: 'Assisted', count: stats.assisted, color: 'var(--gold)' },
            { label: 'IVR', count: stats.ivr, color: '#6264a7' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '6px 14px',
              fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: s.color,
                display: 'inline-block',
              }} />
              <span className="text-muted">{s.label}:</span>
              <span style={{ fontWeight: 700 }}>{s.count}</span>
            </div>
          ))}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '6px 14px',
            fontSize: '0.75rem', color: 'var(--ink-muted)',
          }}>
            Total: <strong>{stats.total}</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Farmer mobile — required for find-or-create */}
        <div className="form-group">
          <label className="form-label" htmlFor="ar-mobile">
            Farmer Mobile Number <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            id="ar-mobile" className="form-input" type="tel"
            placeholder="+91XXXXXXXXXX or 10-digit"
            value={form.mobile_number}
            onChange={e => set('mobile_number', e.target.value)}
            required
          />
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
            If this number is new, a farmer account will be created automatically.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ar-name">Full Name</label>
          <input id="ar-name" className="form-input" type="text" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ar-village">Village / Town</label>
          <input id="ar-village" className="form-input" type="text" value={form.village}
            onChange={e => set('village', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ar-crop">
            Crop Type <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <select id="ar-crop" className="form-select" value={form.crop_type}
            onChange={e => set('crop_type', e.target.value)} required>
            <option value="">— Select Crop —</option>
            {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ar-qty">
            Expected Quantity (Quintals) <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            id="ar-qty" className="form-input" type="number"
            min="1" max="200" step="0.5"
            value={form.expected_quantity}
            onChange={e => set('expected_quantity', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ar-center">
            Procurement Center <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <select id="ar-center" className="form-select" value={form.center_id}
            onChange={e => set('center_id', e.target.value)} required>
            <option value="">— Select Center —</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.load_percent}% full today)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Farmer's Preferred Language</label>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            {[{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' }].map(l => (
              <button key={l.code} type="button"
                onClick={() => set('language_preference', l.code)}
                style={{
                  flex: 1, padding: 'var(--sp-3)', border: '2px solid',
                  borderColor: form.language_preference === l.code ? 'var(--green-800)' : 'var(--border)',
                  borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
                  background: form.language_preference === l.code ? 'var(--green-50)' : 'var(--bg-card)',
                  color: form.language_preference === l.code ? 'var(--green-800)' : 'var(--ink-muted)',
                  minHeight: 44,
                }}
              >{l.label}</button>
            ))}
          </div>
        </div>

        {/* "Assisted" channel badge — always shown, non-editable */}
        <div style={{
          background: 'var(--gold-bg)', border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)', padding: 'var(--sp-3) var(--sp-4)',
          fontSize: '0.8rem', color: '#7a5a00', marginBottom: 'var(--sp-4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🤝</span>
          <span>This registration will be tagged as <strong>Assisted</strong> (registered by officer on behalf of farmer)</span>
        </div>

        {error && <p className="form-error mb-4">⚠ {error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register on Farmer\'s Behalf'}
        </button>
      </form>
    </div>
  );
}
