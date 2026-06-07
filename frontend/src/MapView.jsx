import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

function MapView() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  useEffect(() => {
    const fetchMapEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events/map');
        setEvents(response.data);
        setFilteredEvents(response.data);
        setLoading(false);
      } catch (err) {
        setError('Nie udało się załadować danych mapy.');
        setLoading(false);
      }
    };
    fetchMapEvents();
  }, []);

  // Filter events based on search query and category
  useEffect(() => {
    let result = events;

    if (searchQuery.trim() !== '') {
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'Wszystkie') {
      result = result.filter(event => event.category === selectedCategory);
    }

    setFilteredEvents(result);
  }, [searchQuery, selectedCategory, events]);

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Ładowanie mapy...</p></div>;
  if (error) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;

  // Set default center to Poland (Warsaw: 52.2297, 21.0122)
  const defaultCenter = [52.2297, 21.0122];
  const defaultZoom = 6;

  return (
    <div className="container">
      <div className="page-header" style={{ marginBottom: '24px', textAlign: 'left' }}>
        <h2 className="page-title">Mapa Wydarzeń</h2>
        <p className="subtitle">Znajdź interesujące Cię wydarzenia w Twojej okolicy.</p>
      </div>

      {/* Filter panel */}
      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input 
            type="text" 
            placeholder="Szukaj wydarzenia lub miasta..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="Wszystkie">Wszystkie kategorie</option>
            <option value="Rozrywka">Rozrywka</option>
            <option value="Edukacja">Edukacja</option>
            <option value="Sport">Sport</option>
            <option value="Biznes">Biznes</option>
            <option value="Inne">Inne</option>
          </select>
        </div>
        <Link to="/events" className="btn btn-secondary">
          Lista Wydarzeń
        </Link>
      </div>

      {/* Map rendering */}
      <div className="glass-card" style={{ padding: '8px', height: '600px', width: '100%', overflow: 'hidden' }}>
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredEvents.map(event => {
            const lat = parseFloat(event.latitude);
            const lng = parseFloat(event.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker key={event.id} position={[lat, lng]}>
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    <h4 style={{ color: 'var(--accent-color)', marginBottom: '8px', fontSize: '15px' }}>{event.title}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <strong>Data:</strong> {new Date(event.event_date).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <strong>Miejsce:</strong> {event.location_name}
                    </p>
                    <Link 
                      to={`/events/${event.id}`} 
                      className="btn btn-primary" 
                      style={{ fontSize: '12px', padding: '6px 12px', width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                      Szczegóły
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
