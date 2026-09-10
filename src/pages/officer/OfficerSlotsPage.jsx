import { useState, useEffect } from 'react';
import { useOfficerAuth } from '../../context/OfficerAuthContext';

export default function OfficerSlotsPage() {
  const { officer, apiFetch } = useOfficerAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', start_time: '06:00', end_time: '08:00', max_farmers: 25 });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => { loadSlots(); }, [date]);

  async function loadSlots() {
    setLoading(true);
    const res = await apiFetch(`/api/officer/slots?center_id=${officer.center_id}&date=${date}`);
    setSlots(await res.json());
    setLoading(false);
  }

  async function createSlot(e) {
    e.preventDefault();
    const res = await apiFetch('/api/officer/slots', {
      method: 'POST',
      body: JSON.stringify({ ...form, center_id: officer.center_id }),
    });
    if (res.ok) {
      showToast('Slot created ✓', 'success');
      setShowForm(false);
      setForm({ date: '', start_time: '06:00', end_time: '08:00', max_farmers: 25 });
      loadSlots();
    } else {
      const d = await res.json();
      showToast(d.error, 'error');
    }
  }

  async function updateSlot(id) {
    const res = await apiFetch(`/api/officer/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      showToast('Slot updated ✓', 'success');
      setEditId(null);
      loadSlots();
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <div className="officer-topbar">
        <div className="officer-topbar__title">Slot Management</div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <input
            type="date" className="form-input"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.875rem', minHeight: 36 }}
            value={date} onChange={e => setDate(e.target.value)}
          />
          <button className="btn btn--primary btn--sm" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New Slot'}
          </button>
        </div>
      </div>

      <div className="officer-content">
        {showForm && (
          <div className="card mb-6">
            <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--sp-4)' }}>Create New Slot</h3>
            <form onSubmit={createSlot} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" type="time" required value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input className="form-input" type="time" required value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Max Farmers</label>
                <input className="form-input" type="number" min="1" max="200" required value={form.max_farmers} onChange={e => setForm(f => ({ ...f, max_farmers: parseInt(e.target.value) }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <button className="btn btn--primary" type="submit" style={{ width: 'auto' }}>Create Slot</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="state-box"><div className="state-box__icon">⏳</div><div>Loading...</div></div>
        ) : slots.length === 0 ? (
          <div className="state-box">
            <div className="state-box__icon">🕐</div>
            <div>No slots for {date}. Create one above.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Max Farmers</th>
                <th>Assigned</th>
                <th>Remaining</th>
                <th>Quintals Allocated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id}>
                  <td style={{ fontWeight: 600 }}>{slot.start_time}–{slot.end_time}</td>
                  <td>
                    {editId === slot.id ? (
                      <input
                        type="number" className="form-input"
                        style={{ width: 80, padding: '4px 8px', minHeight: 32, fontSize: '0.875rem' }}
                        value={editForm.max_farmers ?? slot.max_farmers}
                        onChange={e => setEditForm(f => ({ ...f, max_farmers: parseInt(e.target.value) }))}
                      />
                    ) : slot.max_farmers}
                  </td>
                  <td>{slot.farmers_assigned_count}</td>
                  <td style={{ color: slot.max_farmers - slot.farmers_assigned_count === 0 ? 'var(--red)' : 'inherit' }}>
                    {slot.max_farmers - slot.farmers_assigned_count}
                  </td>
                  <td>{parseFloat(slot.allocated_quintals || 0).toFixed(1)}</td>
                  <td>
                    {editId === slot.id ? (
                      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                        <button className="btn btn--primary btn--sm" onClick={() => updateSlot(slot.id)}>Save</button>
                        <button className="btn btn--secondary btn--sm" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn--ghost" onClick={() => { setEditId(slot.id); setEditForm({}); }}>Edit</button>
                    )}
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
