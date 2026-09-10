import { useState } from 'react';
import { useOfficerAuth } from '../../context/OfficerAuthContext';

export default function OfficerPaymentPage() {
  const { officer, apiFetch } = useOfficerAuth();
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('procured');
  const [form, setForm] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  async function loadProcured() {
    setLoading(true);
    const res = await apiFetch(`/api/officer/registrations?center_id=${officer.center_id}&status=${filterStatus}&limit=100`);
    const data = await res.json();
    setRegs(data.registrations || []);
    setLoading(false);
  }

  async function updatePayment(regId, status) {
    setActionLoading(a => ({ ...a, [regId]: true }));
    try {
      const body = { status, amount: form[`${regId}_amount`] ? parseFloat(form[`${regId}_amount`]) : undefined };
      const res = await apiFetch(`/api/officer/registrations/${regId}/payment`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast(`Payment ${status} ✓`, 'success');
      loadProcured();
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
        <div className="officer-topbar__title">Payment Status Update</div>
        <div className="officer-topbar__info">{officer.center_name}</div>
      </div>

      <div className="officer-content">
        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Show</label>
            <select
              className="form-select"
              style={{ width: 220, padding: '6px 28px 6px 10px', fontSize: '0.875rem', minHeight: 36 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="procured">Procured (awaiting payment)</option>
              <option value="payment_processing">Payment Processing</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button className="btn btn--primary" style={{ width: 'auto' }} onClick={loadProcured} disabled={loading}>
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {regs.length === 0 ? (
          <div className="state-box">
            <div className="state-box__icon">💳</div>
            <div>Click Load to fetch registrations with this status.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Farmer</th>
                <th>Crop</th>
                <th>Actual Qty (Q)</th>
                <th>Amount (₹)</th>
                <th>Pay Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regs.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--gold)' }}>#{r.token_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.farmer_name}</div>
                    <div className="text-xs text-muted">{r.mobile_number}</div>
                  </td>
                  <td>{r.crop_type}</td>
                  <td>{r.actual_quantity || r.expected_quantity}</td>
                  <td>
                    <input
                      className="form-input"
                      type="number" min="0" step="1"
                      placeholder={r.amount ? Math.round(r.amount) : 'Enter amount'}
                      value={form[`${r.id}_amount`] || ''}
                      onChange={e => setForm(f => ({ ...f, [`${r.id}_amount`]: e.target.value }))}
                      style={{ width: 130, padding: '6px 10px', fontSize: '0.9rem', minHeight: 36 }}
                    />
                  </td>
                  <td><span className={`badge badge--${r.payment_status || 'pending'}`}>{r.payment_status || 'pending'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      {r.status !== 'payment_processing' && r.status !== 'paid' && (
                        <button
                          className="btn btn--sm btn--secondary"
                          disabled={actionLoading[r.id]}
                          onClick={() => updatePayment(r.id, 'processing')}
                        >
                          Processing
                        </button>
                      )}
                      {r.status !== 'paid' && (
                        <button
                          className="btn btn--sm btn--primary"
                          disabled={actionLoading[r.id]}
                          onClick={() => updatePayment(r.id, 'completed')}
                        >
                          Mark Paid
                        </button>
                      )}
                      {r.status === 'paid' && (
                        <span className="badge badge--paid">✓ Paid</span>
                      )}
                    </div>
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
