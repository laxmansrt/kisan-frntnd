import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfficerAuthProvider, useOfficerAuth } from '../../context/OfficerAuthContext';

function LoginForm() {
  const { login } = useOfficerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await res.json(); } catch { data = null; }
      }

      if (res.ok && data?.token) {
        login(data.officer, data.token);
        navigate('/officer/dashboard');
        return;
      }

      // Demo fallback bypass for offline / unseeded cloud backend
      const isBellary = form.username === 'officer_bellary' && form.password === 'bellary@2026';
      const isRaichur = form.username === 'officer_raichur' && form.password === 'raichur@2026';

      if (isBellary || isRaichur) {
        const demoOfficer = {
          id: isBellary ? 'demo-officer-bellary' : 'demo-officer-raichur',
          name: isBellary ? 'Rajesh Kumar' : 'Priya Reddy',
          username: form.username,
          center_id: isBellary ? '6aa35aced533d27d95cacaab' : '6aa35aced533d27d95cacaac',
          center_name: isBellary ? 'Bellary APMC Procurement Center' : 'Raichur APMC Procurement Center',
        };
        login(demoOfficer, `demo-officer-jwt-${Date.now()}`);
        navigate('/officer/dashboard');
        return;
      }

      throw new Error(data?.error || 'Invalid credentials');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillOfficer(username, password) {
    setForm({ username, password });
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-logo">🏛️</div>
      <h1 className="login-title">Officer Login</h1>
      <p className="login-subtitle">Procurement Center Management</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">Username</label>
          <input
            id="username" className="form-input" type="text"
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password" className="form-input" type="password"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required autoComplete="current-password"
          />
        </div>

        {error && <p className="form-error mb-4">⚠ {error}</p>}

        <button className="btn btn--primary w-full" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-4" style={{ fontSize: '0.82rem', color: '#166534', background: '#f0fdf4', border: '1px solid #86efac', padding: 12, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>⚡ Quick 1-Click Fill:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => fillOfficer('officer_bellary', 'bellary@2026')}
            >
              Bellary Officer
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => fillOfficer('officer_raichur', 'raichur@2026')}
            >
              Raichur Officer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function OfficerLoginPage() {
  return <OfficerAuthProvider><LoginForm /></OfficerAuthProvider>;
}
