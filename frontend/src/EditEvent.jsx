import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function LocationMarker({ position, onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Rozrywka',
    event_date: '',
    start_time: '',
    end_time: '',
    location_name: '',
    capacity: '',
    latitude: '',
    longitude: '',
    image_url: ''
  });

  const [mapPosition, setMapPosition] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const token = localStorage.getItem('token');
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setFormData(prev => ({ ...prev, image_url: response.data.url }));
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'Błąd podczas przesyłania pliku.');
      setUploading(false);
    }
  };

  // Fetch logged in user to check ownership
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchEventData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/events/${id}`);
        const event = response.data;

        // Check ownership
        if (event.organizer_id !== user.id && user.role !== 'ADMIN') {
          alert('Brak uprawnień do edycji tego wydarzenia.');
          navigate('/organizer');
          return;
        }

        // Format event date YYYY-MM-DD
        const formattedDate = new Date(event.event_date).toISOString().split('T')[0];

        setFormData({
          title: event.title,
          description: event.description,
          category: event.category,
          event_date: formattedDate,
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          location_name: event.location_name,
          capacity: event.capacity,
          latitude: event.latitude || '',
          longitude: event.longitude || '',
          image_url: event.image_url || ''
        });

        if (event.latitude && event.longitude) {
          const latlng = { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) };
          setMapPosition(latlng);
        }

        setLoading(false);
      } catch (err) {
        setError('Błąd podczas pobierania danych wydarzenia.');
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMapClick = (latlng) => {
    setMapPosition(latlng);
    setFormData(prev => ({
      ...prev,
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.put(
        `http://localhost:5000/api/events/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Wydarzenie zaktualizowane! Powiadamianie zapisanych uczestników...');

      setTimeout(() => {
        navigate('/organizer');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Błąd podczas aktualizacji wydarzenia.');
    }
  };

  const defaultCenter = mapPosition ? [mapPosition.lat, mapPosition.lng] : [52.2297, 21.0122];

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Wczytywanie wydarzenia...</p></div>;
  if (error) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Edytuj Wydarzenie</h2>
          <Link to="/organizer" className="btn btn-secondary" style={{ padding: '8px 16px' }}>&larr; Wróć</Link>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Tytuł wydarzenia</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Kategoria</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Rozrywka">Rozrywka</option>
                  <option value="Edukacja">Edukacja</option>
                  <option value="Sport">Sport</option>
                  <option value="Biznes">Biznes</option>
                  <option value="Motoryzacja">Motoryzacja</option>
                  <option value="Inne">Inne</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Opis wydarzenia</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  style={{ minHeight: '120px' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Data i Godziny</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required style={{ flex: 2 }} />
                  <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} style={{ flex: 1 }} />
                  <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} style={{ flex: 1 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Nazwa lokalizacji (adres)</label>
                <input 
                  type="text" 
                  name="location_name" 
                  value={formData.location_name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Liczba miejsc</label>
                <input 
                  type="number" 
                  name="capacity" 
                  value={formData.capacity} 
                  onChange={handleChange} 
                  min="1" 
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Zdjęcie wydarzenia (Dodaj plik z komputera)</label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ width: 'auto', flex: 1, minWidth: '200px' }} 
              />
              {uploading && <span style={{ fontSize: '13px', color: 'var(--warning-color)' }}>Przesyłanie zdjęcia...</span>}
              {uploadError && <span style={{ fontSize: '13px', color: 'var(--danger-color)' }}>{uploadError}</span>}
            </div>
            
            {formData.image_url && (
              <div style={{ marginTop: '12px', position: 'relative', width: '100%', maxHeight: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img 
                  src={formData.image_url.startsWith('/') ? `http://localhost:5000${formData.image_url}` : formData.image_url} 
                  alt="Podgląd zdjęcia" 
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Usuń zdjęcie
                </button>
              </div>
            )}
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

          {/* Coordinate Map Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Wybierz lokalizację na mapie (kliknij na mapie, aby zaktualizować pinezkę)
            </label>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Szerokość (Lat): </span>
                <input 
                  type="text" 
                  name="latitude" 
                  value={formData.latitude} 
                  readOnly 
                  style={{ display: 'inline-block', width: 'auto', padding: '6px 12px', fontSize: '13px' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Długość (Lng): </span>
                <input 
                  type="text" 
                  name="longitude" 
                  value={formData.longitude} 
                  readOnly 
                  style={{ display: 'inline-block', width: 'auto', padding: '6px 12px', fontSize: '13px' }} 
                />
              </div>
            </div>
            
            <div className="map-container" style={{ height: '300px' }}>
              <MapContainer 
                center={defaultCenter} 
                zoom={10} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={mapPosition} onClick={handleMapClick} />
              </MapContainer>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }}>
            Zaktualizuj wydarzenie
          </button>
        </form>

        {error && <p style={{ color: 'var(--danger-color)', marginTop: '15px', fontWeight: 'bold' }}>{error}</p>}
        {message && <p style={{ color: 'var(--success-color)', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
      </div>
    </div>
  );
}

export default EditEvent;
