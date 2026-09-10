import { useState, useEffect } from 'react';
import { useLang } from '../../context/LangContext';

// Leaflet CSS must be imported
import 'leaflet/dist/leaflet.css';

export default function CentersPage() {
  const { t } = useLang();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [MapComponents, setMapComponents] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [sortedCenters, setSortedCenters] = useState([]);

  useEffect(() => {
    // Load centers
    fetch('/api/centers')
      .then(r => r.json())
      .then(data => { setCenters(data); setSortedCenters(data); })
      .finally(() => setLoading(false));

    // Get user location for sorting by distance
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }

    // Lazy-load Leaflet (avoids SSR issues)
    import('react-leaflet').then(mod => {
      setMapComponents({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Marker: mod.Marker,
        Popup: mod.Popup,
      });
    });
  }, []);

  // Sort by distance when we have both centers and user position
  useEffect(() => {
    if (!userPos || centers.length === 0) return;
    const sorted = [...centers].sort((a, b) => {
      const da = haversine(userPos.lat, userPos.lng, a.latitude, a.longitude);
      const db = haversine(userPos.lat, userPos.lng, b.latitude, b.longitude);
      return da - db;
    });
    setSortedCenters(sorted);
  }, [userPos, centers]);

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function deg2rad(d) { return d * Math.PI / 180; }

  const mapCenter = centers.length > 0 ? [centers[0].latitude, centers[0].longitude] : [15.5, 77.0];

  if (loading) return <div className="state-box"><div className="state-box__icon">📍</div><div>{t('loading')}</div></div>;

  return (
    <div>
      <h1 className="section-title">{t('centers_title')}</h1>

      {/* Leaflet Map */}
      {MapComponents && (
        <div className="center-map">
          <MapComponents.MapContainer
            center={mapCenter}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <MapComponents.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {centers.map(c => (
              <MapComponents.Marker key={c.id} position={[c.latitude, c.longitude]}>
                <MapComponents.Popup>
                  <strong>{c.name}</strong><br />
                  {c.location}<br />
                  Load: {c.load_percent}%
                </MapComponents.Popup>
              </MapComponents.Marker>
            ))}
          </MapComponents.MapContainer>
        </div>
      )}

      {/* Center list */}
      {sortedCenters.map(c => (
        <div key={c.id} className="center-item">
          <div className="center-item__icon">🏛️</div>
          <div className="center-item__body">
            <div className="center-item__name">{c.name}</div>
            <div className="center-item__location">{c.location}</div>
            {c.contact_number && (
              <div className="text-xs text-muted mt-1">📞 {c.contact_number}</div>
            )}
            {userPos && c.latitude && (
              <div className="text-xs text-muted mt-1">
                📍 {haversine(userPos.lat, userPos.lng, c.latitude, c.longitude).toFixed(1)} km away
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-1)', flexShrink: 0 }}>
            <div className="load-bar" title={`${c.load_percent}% full`}>
              <div
                className={`load-bar__fill${c.load_percent >= 100 ? ' load-bar__fill--full' : ''}`}
                style={{ width: `${Math.min(c.load_percent, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted">{c.load_percent}%</div>
            <div className={`badge ${c.load_percent >= 100 ? 'badge--at_center' : 'badge--registered'}`} style={{ fontSize: '0.68rem' }}>
              {c.load_percent >= 100 ? t('full') : t('slots_available')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
