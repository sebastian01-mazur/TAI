import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Import marker images directly to fix Vite bundling issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // Fetch logged in user info
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  const fetchEventAndParticipants = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const eventResponse = await axios.get(`http://localhost:5000/api/events/${id}`, { headers });
      setEvent(eventResponse.data);

      const participantsResponse = await axios.get(
        `http://localhost:5000/api/events/${id}/participants`,
        { headers }
      );
      const partsList = participantsResponse.data;
      setParticipants(partsList);

      // Check if current user is in participants list
      if (user) {
        const registered = partsList.some(p => p.email === user.email);
        setIsRegistered(registered);
      }
      setLoading(false);
    } catch (err) {
      setError('Nie udało się pobrać szczegółów wydarzenia.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndParticipants();
  }, [id, token]);

  const handleRegister = async () => {
    try {
      if (!token) {
        setActionMessage('Musisz być zalogowany, aby się zapisać.');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/events/${id}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActionMessage(response.data.message);
      fetchEventAndParticipants();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Wystąpił błąd podczas zapisów.');
    }
  };

  const handleUnregister = async () => {
    try {
      if (!token) return;

      const response = await axios.delete(
        `http://localhost:5000/api/events/${id}/register`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActionMessage(response.data.message);
      fetchEventAndParticipants();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Wystąpił błąd podczas wypisywania się.');
    }
  };

  const handleFollow = async () => {
    if (!token) {
      alert('Musisz być zalogowany, aby obserwować wydarzenie.');
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:5000/api/events/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEvent(prev => ({
        ...prev,
        is_followed: response.data.is_followed,
        follow_count: response.data.follow_count
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Ładowanie...</p></div>;
  if (error) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;
  if (!event) return <div className="container" style={{ textAlign: 'center' }}><p>Wydarzenie nie istnieje.</p></div>;

  const lat = parseFloat(event.latitude);
  const lng = parseFloat(event.longitude);
  const hasCoordinates = !isNaN(lat) && !isNaN(lng);

  // Calculate percentage of filled seats
  const capacity = event.capacity || 1;
  const participantCount = event.participant_count || 0;
  const filledPercent = Math.min(Math.round((participantCount / capacity) * 100), 100);
  const freeSpots = Math.max(capacity - participantCount, 0);
  const isCancelled = event.status === 'CANCELLED';

  const getCategoryClass = (cat) => {
    const categoriesMap = {
      'Rozrywka': 'badge-entertainment',
      'Edukacja': 'badge-education',
      'Sport': 'badge-sport',
      'Biznes': 'badge-business',
      'Motoryzacja': 'badge-other',
      'Inne': 'badge-other'
    };
    return categoriesMap[cat] || 'badge-other';
  };

  const getProgressBarClass = (percent) => {
    if (percent >= 90) return 'progress-red';
    if (percent >= 60) return 'progress-orange';
    return 'progress-green';
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/events" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: '600' }}>
          &larr; Powrót do listy wydarzeń
        </Link>
        {isCancelled && (
          <span style={{ color: 'var(--danger-color)', fontWeight: '700', fontSize: '16px', letterSpacing: '1px' }}>
            🔴 WYDARZENIE ANULOWANE
          </span>
        )}
      </div>

      {/* Main Image Banner */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '300px', marginBottom: '24px', position: 'relative' }}>
        {event.image_url ? (
          <img 
            src={event.image_url.startsWith('/') ? `http://localhost:5000${event.image_url}` : event.image_url} 
            alt={event.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
            ⚡
          </div>
        )}
        
        {isCancelled && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '28px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            ANULOWANE PRZEZ ORGANIZATORA
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Left Side: Info */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className={`badge ${getCategoryClass(event.category)}`}>
                {event.category}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                ❤️ {event.follow_count || 0} obserwujących
              </span>
            </div>
            
            <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>{event.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              📍 {event.location_name}
            </p>
          </div>

          <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>Czas wydarzenia</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              📅 <strong>Data:</strong> {new Date(event.event_date).toLocaleDateString()}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              ⏰ <strong>Godzina:</strong> {event.start_time ? event.start_time.slice(0, 5) : 'Brak'} - {event.end_time ? event.end_time.slice(0, 5) : 'Brak'}
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Opis</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', whiteSpace: 'pre-line' }}>{event.description}</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wolne miejsca: <strong>{freeSpots}</strong> z {capacity}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{filledPercent}% zajętych</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${getProgressBarClass(filledPercent)}`} 
                style={{ width: `${filledPercent}%` }} 
              />
            </div>
          </div>

          {/* Action buttons (Register + Follow) */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              {isRegistered ? (
                <button 
                  onClick={handleUnregister} 
                  className="btn btn-danger" 
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  disabled={isCancelled}
                >
                  Anuluj zapis
                </button>
              ) : (
                <button 
                  onClick={handleRegister} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  disabled={freeSpots === 0 || isCancelled}
                >
                  {isCancelled ? 'Niedostępne' : freeSpots === 0 ? 'Brak wolnych miejsc' : 'Zapisz się'}
                </button>
              )}
            </div>
            
            <button 
              onClick={handleFollow}
              className="btn btn-secondary"
              style={{ 
                padding: '0 20px', 
                fontSize: '20px', 
                backgroundColor: event.is_followed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                border: '1px solid',
                borderColor: event.is_followed ? 'var(--danger-color)' : 'var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title={event.is_followed ? 'Usuń z obserwowanych' : 'Obserwuj'}
            >
              {event.is_followed ? '❤️' : '🤍'}
            </button>
          </div>

          {actionMessage && (
            <p style={{ 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: actionMessage.includes('Udało') || actionMessage.includes('Anulowano') ? 'var(--success-color)' : 'var(--danger-color)' 
            }}>
              {actionMessage}
            </p>
          )}
        </div>

        {/* Right Side: Map & Participants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Map card */}
          <div className="glass-card" style={{ padding: '8px' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: '12px 16px', fontSize: '16px' }}>Lokalizacja na mapie</h4>
            <div className="map-container" style={{ height: '280px' }}>
              {hasCoordinates ? (
                <MapContainer 
                  center={[lat, lng]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>{event.location_name}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }}>
                  <p>Brak dokładnych współrzędnych mapy.</p>
                </div>
              )}
            </div>
          </div>

          {/* Participants card */}
          <div className="glass-card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '16px' }}>Uczestnicy ({participants.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {participants.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>Brak zapisanych uczestników. Bądź pierwszy!</p>
              ) : (
                participants.map((p, index) => (
                  <div key={index} style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{p.first_name} {p.last_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.email}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;