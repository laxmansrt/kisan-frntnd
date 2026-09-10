import { useState } from 'react';
import { useOfficerAuth } from '../../context/OfficerAuthContext';

export default function OfficerProcurePage() {
  const { officer, apiFetch } = useOfficerAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      center_id: officer.center_id,
      status: 'at_center',
    });
    if (search) params.set('date', search); // search by date
    const res = await apiFetch(`/api/officer/registrations?${params}&limit=100`);
    const data = await res.json();
    setResults(data.registrations || []);
    setLoading(false);
  }

  async function handleProcure(regId) {
    const qty = parseFloat(form[regId]);
    if (!qty || qty <= 0) { showToast('Enter a valid quantity', 'error'); return; }

    setActionLoading(a => ({ ...a, [regId]: true }));
    try {
      const res = await apiFetch(`/api/officer/registrations/${regId}/procure`, {
        method: 'POST',
        body: JSON.stringify({ actual_quantity: qty }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast('Marked as procured ✓', 'success');
      setResults(r => r.filter(x => x.id !== regId));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(a => ({ ...a, [regId]: false }));
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <div className="officer-topbar">
        <div className="officer-topbar__title">Procurement Recording</div>
        <div className="officer-topbar__info">{officer.center_name}</div>
      </div>

      <div className="officer-content">
        <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
          Shows farmers currently marked as "At Center". Search by date to filter.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Filter by Date</label>
            <input
              className="form-input" type="date"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" type="submit" style={{ width: 'auto' }} disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {results.length === 0 && !loading && (
          <div className="state-box">
            <div className="state-box__icon">⚖️</div>
            <div>Search for farmers at the center to record procurement.</div>
          </div>
        )}

        {results.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Farmer</th>
                <th>Crop</th>
                <th>Expected (Q)</th>
                <th>Actual Quantity (Q)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>#{r.token_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.farmer_name}</div>
                    <div className="text-xs text-muted">{r.village}</div>
                  </td>
                  <td>{r.crop_type}</td>
                  <td>{r.expected_quantity}</td>
                  <td>
                    <input
                      className="form-input"
                      type="number" min="0" max="500" step="0.1"
                      placeholder={r.expected_quantity}
                      value={form[r.id] || ''}
                      onChange={e => setForm(f => ({ ...f, [r.id]: e.target.value }))}
                      style={{ width: 120, padding: '6px 10px', fontSize: '0.9rem', minHeight: 36 }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={actionLoading[r.id] || !form[r.id]}
                      onClick={() => handleProcure(r.id)}
                    >
                      Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
