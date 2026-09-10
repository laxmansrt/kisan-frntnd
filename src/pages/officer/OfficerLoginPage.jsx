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
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.officer, data.token);
      navigate('/officer/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-4" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', background: 'var(--bg-muted)', padding: 'var(--sp-3)', borderRadius: 'var(--radius)', fontFamily: 'monospace' }}>
          Demo: officer_bellary / bellary@2026<br />
          Demo: officer_raichur / raichur@2026
        </div>
      </form>
    </div>
  );
}

export default function OfficerLoginPage() {
  return <OfficerAuthProvider><LoginForm /></OfficerAuthProvider>;
}
