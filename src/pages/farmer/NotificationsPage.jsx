import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { farmer, apiFetch } = useAuth();
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/farmers/${farmer.id}/notifications`)
      .then(r => r.json())
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="state-box__icon">🔔</div><div>{t('loading')}</div></div>;

  return (
    <div>
      <h1 className="section-title">{t('notifications_title')}</h1>

      {notifications.length === 0 ? (
        <div className="state-box">
          <div className="state-box__icon">🔔</div>
          <div className="state-box__msg">{t('no_notifications')}</div>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div key={n.id} className={`notif-item${!n.read ? ' notif-item--unread' : ''}`}>
              <div className="notif-item__dot" />
              <div>
                <div className="notif-item__msg">{n.message}</div>
                <div className="notif-item__time">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
