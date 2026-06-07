import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]); // Array for multiple selection
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch logged-in user to show action buttons
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  const fetchEvents = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('http://localhost:5000/api/events', { headers });
      setEvents(response.data);
      setFilteredEvents(response.data);
      setLoading(false);
    } catch (err) {
      setError('Nie udało się pobrać wydarzeń.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  // Handle client-side search and filtering
  useEffect(() => {
    let result = events;

    // Filter by text search (title, location, or description)
    if (searchQuery.trim() !== '') {
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by multiple categories
    if (selectedCategories.length > 0) {
      result = result.filter(event => selectedCategories.includes(event.category));
    }

    // Filter by date
    if (selectedDate !== '') {
      result = result.filter(event => {
        const eventDateStr = new Date(event.event_date).toISOString().split('T')[0];
        return eventDateStr === selectedDate;
      });
    }

    setFilteredEvents(result);
  }, [searchQuery, selectedCategories, selectedDate, events]);

  const handleFollow = async (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      alert('Musisz być zalogowany, aby obserwować wydarzenie.');
      return;
    }
    try {
      const response = await axios.post(
        `http://localhost:5000/api/events/${eventId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEvents(prev => prev.map(evt => 
        evt.id === eventId 
          ? { ...evt, is_followed: response.data.is_followed, follow_count: response.data.follow_count } 
          : evt
      ));
    } catch (err) {
      console.error('Błąd przełączania obserwacji:', err);
    }
  };

  const handleCategoryCheckboxChange = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => prev.filter(c => c !== categoryName));
    } else {
      setSelectedCategories(prev => [...prev, categoryName]);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Ładowanie wydarzeń...</p></div>;
  if (error) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;

  // Category badge styles
  const getCategoryClass = (cat) => {
    const categoriesMap = {
      'Rozrywka': 'badge-entertainment',
      'Edukacja': 'badge-education',
      'Sport': 'badge-sport',
      'Biznes': 'badge-business',
      'Motoryzacja': 'badge-other', // default styling, or map specifically
      'Inne': 'badge-other'
    };
    return categoriesMap[cat] || 'badge-other';
  };

  // Get color for progress bar
  const getProgressBarClass = (percent) => {
    if (percent >= 90) return 'progress-red';
    if (percent >= 60) return 'progress-orange';
    return 'progress-green';
  };

  const categories = ['Rozrywka', 'Edukacja', 'Sport', 'Biznes', 'Motoryzacja', 'Inne'];

  return (
    <div className="container">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Nadchodzące Wydarzenia</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Zapisz się na najciekawsze wydarzenia lub obserwuj je za pomocą serduszka.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/events/map" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
            🗺️ Zobacz na mapie
          </Link>
          {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
            <Link to="/organizer/events/new" className="btn btn-primary">
              ➕ Utwórz wydarzenie
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="glass-card" style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          {/* Search bar */}
          <div style={{ flex: '2', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Wyszukiwarka</label>
            <input 
              type="text" 
              placeholder="Wyszukaj po nazwie, miejscu lub opisie..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Wybierz datę</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Checkboxes */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
            Kategorie (możesz wybrać kilka):
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <label 
                key={cat} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  backgroundColor: selectedCategories.includes(cat) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedCategories.includes(cat) ? 'var(--accent-color)' : 'var(--border-color)',
                  fontSize: '14px',
                  userSelect: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)} 
                  onChange={() => handleCategoryCheckboxChange(cat)}
                  style={{ display: 'none' }}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset button */}
        {(searchQuery || selectedCategories.length > 0 || selectedDate) && (
          <button 
            className="btn btn-secondary" 
            style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px' }}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategories([]);
              setSelectedDate('');
            }}
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Brak nadchodzących wydarzeń spełniających kryteria wyszukiwania.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredEvents.map((event) => {
            const capacity = event.capacity || 1;
            const participantCount = event.participant_count || 0;
            const filledPercent = Math.min(Math.round((participantCount / capacity) * 100), 100);
            const isCancelled = event.status === 'CANCELLED';

            return (
              <div 
                key={event.id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  justifyContent: 'space-between', 
                  textAlign: 'left', 
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  opacity: isCancelled ? 0.7 : 1
                }}
              >
                {/* Event Image Banner */}
                <div style={{ height: '140px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  {event.image_url ? (
                    <img 
                      src={event.image_url.startsWith('/') ? `http://localhost:5000${event.image_url}` : event.image_url} 
                      alt={event.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                      ⚡
                    </div>
                  )}

                  {/* Cancelled overlay tag */}
                  {isCancelled && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(239, 68, 68, 0.4)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '18px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      ANULOWANE
                    </div>
                  )}

                  {/* Heart button overlay */}
                  <button 
                    onClick={(e) => handleFollow(event.id, e)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: event.is_followed ? 'rgba(239, 68, 68, 0.9)' : 'rgba(15, 23, 42, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                      zIndex: 10
                    }}
                    title={event.is_followed ? 'Przestań obserwować' : 'Obserwuj'}
                  >
                    {event.is_followed ? '❤️' : '🤍'}
                  </button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className={`badge ${getCategoryClass(event.category)}`}>
                        {event.category}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        📅 {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.title}
                    </h3>
                    
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      📍 {event.location_name}
                    </p>

                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.description}
                    </p>
                  </div>

                  <div>
                    {/* Likes & registration info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>❤️ {event.follow_count || 0} obserwujących</span>
                    </div>

                    {/* Capacity progress info */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Zapisani: <strong>{participantCount}</strong> / {capacity}</span>
                        <span>{filledPercent}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className={`progress-bar-fill ${getProgressBarClass(filledPercent)}`} 
                          style={{ width: `${filledPercent}%` }} 
                        />
                      </div>
                    </div>

                    <Link 
                      to={`/events/${event.id}`} 
                      className="btn btn-primary" 
                      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                      Zobacz szczegóły
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Events;
