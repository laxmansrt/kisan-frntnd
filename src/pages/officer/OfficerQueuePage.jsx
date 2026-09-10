import { useState, useEffect, useRef } from 'react';
import { useOfficerAuth } from '../../context/OfficerAuthContext';

const STATUS_FILTERS = ['', 'registered', 'approved', 'scheduled', 'at_center', 'procured', 'payment_processing', 'paid'];

export default function OfficerQueuePage() {
  const { officer, apiFetch, token } = useOfficerAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [regs, setRegs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadQueue();
    connectWs();
    return () => wsRef.current?.close();
  }, [date, status]);

  function connectWs() {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(
      `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?type=officer&id=${officer.center_id}&token=${token}`
    );
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'QUEUE_UPDATE') loadQueue();
    };
    wsRef.current = ws;
  }

  async function loadQueue() {
    setLoading(true);
    const params = new URLSearchParams({ center_id: officer.center_id, date });
    if (status) params.set('status', status);
    const res = await apiFetch(`/api/officer/registrations?${params}`);
    const data = await res.json();
    setRegs(data.registrations || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function action(id, endpoint, label) {
    setActionLoading(a => ({ ...a, [id]: true }));
    try {
      const res = await apiFetch(`/api/officer/registrations/${id}/${endpoint}`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast(`${label} ✓`, 'success');
      loadQueue();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(a => ({ ...a, [id]: false }));
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <div className="officer-topbar">
        <div className="officer-topbar__title">Registration Queue</div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <input
            type="date" className="form-input"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.875rem', minHeight: 36 }}
            value={date} onChange={e => setDate(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: '0.875rem', minHeight: 36 }}
            value={status} onChange={e => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_FILTERS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <span className="text-muted text-sm">{total} total</span>
        </div>
      </div>

      <div className="officer-content">
        {loading ? (
          <div className="state-box"><div className="state-box__icon">⏳</div><div>Loading...</div></div>
        ) : regs.length === 0 ? (
          <div className="state-box"><div className="state-box__icon">📋</div><div>No registrations found.</div></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Farmer</th>
                  <th>Mobile</th>
                  <th>Village</th>
                  <th>Crop</th>
                  <th>Qty (Q)</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>
                      {r.token_number ? `#${r.token_number}` : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.farmer_name}</td>
                    <td className="text-muted text-sm">{r.mobile_number}</td>
                    <td className="text-muted text-sm">{r.village || '—'}</td>
                    <td>{r.crop_type}</td>
                    <td>{r.expected_quantity}</td>
                    <td className="text-sm">
                      {r.slot_date ? `${r.slot_date} ${r.start_time}–${r.end_time}` : '—'}
                    </td>
                    <td><span className={`badge badge--${r.status}`}>{r.status.replace(/_/g, ' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                        {r.status === 'registered' && (
                          <button
                            className="btn btn--sm btn--primary"
                            disabled={actionLoading[r.id]}
                            onClick={() => action(r.id, 'approve', 'Approved')}
                          >
                            Approve
                          </button>
                        )}
                        {(r.status === 'approved' || r.status === 'scheduled') && (
                          <button
                            className="btn btn--sm btn--secondary"
                            disabled={actionLoading[r.id]}
                            onClick={() => action(r.id, 'mark-at-center', 'Marked at center')}
                          >
                            At Center
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
