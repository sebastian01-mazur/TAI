import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function OrganizerDashboard() {
  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartMode, setChartMode] = useState('occupancy'); // 'occupancy' lub 'popularity'
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch events
      const eventsRes = await axios.get('http://localhost:5000/api/organizer/events', { headers });
      setMyEvents(eventsRes.data);

      // Fetch statistics
      const statsRes = await axios.get('http://localhost:5000/api/organizer/statistics', { headers });
      setStats(statsRes.data);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się pobrać danych panelu organizatora.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleCancelEvent = async (eventId, eventTitle) => {
    const confirmCancel = window.confirm(`Czy na pewno chcesz anulować wydarzenie "${eventTitle}"? Wszyscy zapisani oraz obserwujący uczestnicy otrzymają powiadomienie.`);
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Wydarzenie zostało pomyślnie anulowane!');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Wystąpił błąd podczas anulowania wydarzenia.');
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Ładowanie panelu organizatora...</p></div>;
  if (error) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Panel Organizatora</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Zarządzaj swoimi wydarzeniami, edytuj, anuluj lub twórz nowe i monitoruj statystyki.</p>
        </div>
        <Link to="/organizer/events/new" className="btn btn-success">
          ➕ Dodaj nowe wydarzenie
        </Link>
      </div>

      {/* Statistics Cards Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Card 1: Total Events */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <div style={{ fontSize: '30px', backgroundColor: 'rgba(99, 102, 241, 0.15)', width: '54px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
              📅
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Twoje Wydarzenia</span>
              <strong style={{ fontSize: '22px', color: 'var(--text-primary)' }}>{stats.totalEvents}</strong>
            </div>
          </div>

          {/* Card 2: Total Participants */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <div style={{ fontSize: '30px', backgroundColor: 'rgba(16, 185, 129, 0.15)', width: '54px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
              👥
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Zapisani Uczestnicy</span>
              <strong style={{ fontSize: '22px', color: 'var(--text-primary)' }}>{stats.totalParticipants}</strong>
            </div>
          </div>

          {/* Card 3: Total Followers */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <div style={{ fontSize: '30px', backgroundColor: 'rgba(239, 68, 68, 0.15)', width: '54px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
              ❤️
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Obserwujący</span>
              <strong style={{ fontSize: '22px', color: 'var(--text-primary)' }}>{stats.totalFollowers || 0}</strong>
            </div>
          </div>

          {/* Card 4: Overall Occupancy */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <div style={{ fontSize: '30px', backgroundColor: 'rgba(245, 158, 11, 0.15)', width: '54px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-color)' }}>
              📊
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Średnie Obłożenie</span>
              <strong style={{ fontSize: '22px', color: 'var(--text-primary)' }}>{stats.occupancyPercent}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Chart & Event list */}
      <div className="grid-2" style={{ alignItems: 'start', gap: '32px' }}>
        {/* Left Side: Event Signups chart */}
        {stats && stats.events && stats.events.length > 0 && (
          <div className="glass-card" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>Statystyki Wydarzeń</h3>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setChartMode('occupancy')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: chartMode === 'occupancy' ? 'var(--accent-color)' : 'transparent',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  Obłożenie (%)
                </button>
                <button 
                  onClick={() => setChartMode('popularity')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: chartMode === 'popularity' ? 'var(--accent-color)' : 'transparent',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  Popularność (Algorytm)
                </button>
              </div>
            </div>

            {chartMode === 'popularity' && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', borderLeft: '3px solid var(--accent-color)', paddingLeft: '8px' }}>
                Algorytm popularności: <strong>(Zapisani × 2) + (Obserwujący × 1)</strong>. Wartości pokazują punkty zainteresowania.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                // Sort copy of list based on active mode
                const sortedEvents = [...stats.events].sort((a, b) => {
                  if (chartMode === 'occupancy') {
                    const aPercent = a.capacity > 0 ? (a.participant_count / a.capacity) : 0;
                    const bPercent = b.capacity > 0 ? (b.participant_count / b.capacity) : 0;
                    return bPercent - aPercent;
                  } else {
                    const aScore = (a.participant_count * 2) + (a.follow_count || 0);
                    const bScore = (b.participant_count * 2) + (b.follow_count || 0);
                    return bScore - aScore;
                  }
                });

                const maxPopularity = Math.max(...sortedEvents.map(e => (e.participant_count * 2) + (e.follow_count || 0)), 1);

                return sortedEvents.slice(0, 5).map(event => {
                  const percentCap = Math.min(Math.round((event.participant_count / event.capacity) * 100), 100);
                  const popularityScore = (event.participant_count * 2) + (event.follow_count || 0);
                  const percentWidth = Math.min(Math.round((popularityScore / maxPopularity) * 100), 100);

                  return (
                    <div key={event.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {event.title}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {chartMode === 'occupancy' ? (
                            <><strong>{event.participant_count}</strong> / {event.capacity} ({percentCap}%)</>
                          ) : (
                            <><strong>{popularityScore}</strong> pkt (👥{event.participant_count} ×2 + ❤️{event.follow_count})</>
                          )}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${chartMode === 'occupancy' ? percentCap : percentWidth}%`, 
                            background: chartMode === 'occupancy' 
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                              : 'linear-gradient(90deg, var(--accent-color) 0%, #a855f7 100%)',
                            borderRadius: '6px',
                            transition: 'width 0.5s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Right Side: Event list */}
        <div className="glass-card" style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>Twoja Lista Wydarzeń</h3>
          
          {myEvents.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nie masz jeszcze utworzonych żadnych wydarzeń.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myEvents.map(event => {
                const isCancelled = event.status === 'CANCELLED';
                return (
                  <div 
                    key={event.id} 
                    style={{ 
                      padding: '16px', 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      opacity: isCancelled ? 0.7 : 1
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {event.title} 
                        {isCancelled && <span style={{ color: 'var(--danger-color)', fontSize: '12px', marginLeft: '10px', fontWeight: 'bold' }}>[ANULOWANE]</span>}
                      </h4>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                        📅 {new Date(event.event_date).toLocaleDateString()} | 👥 {event.participant_count || 0} zapisanych | ❤️ {event.follow_count || 0} | ⭐ {event.popularity_score || 0} pkt
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/events/${event.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Podgląd
                      </Link>
                      {!isCancelled && (
                        <>
                          <Link to={`/organizer/events/${event.id}/edit`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'var(--accent-color)' }}>
                            Edytuj
                          </Link>
                          <button 
                            onClick={() => handleCancelEvent(event.id, event.title)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Anuluj
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;