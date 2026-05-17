import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // To uruchomi się automatycznie przy wejściu na stronę
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/events');
                setEvents(response.data);
                setLoading(false);
            } catch (err) {
                setError('Nie udało się pobrać wydarzeń.');
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ładowanie wydarzeń...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Lista Wydarzeń</h2>
                {/* Przyda się później do wylogowywania lub panelu */}
                <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Mój Profil</button>
            </div>

            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                {events.length === 0 ? (
                    <p>Brak nadchodzących wydarzeń.</p>
                ) : (
                    events.map((event) => (
                        <div key={event.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{event.title}</h3>
                            <p style={{ margin: '0 0 5px 0', color: '#555' }}>
                                <strong>Data:</strong> {new Date(event.event_date).toLocaleDateString()}
                            </p>
                            <p style={{ margin: '0 0 5px 0', color: '#555' }}>
                                <strong>Miejsce:</strong> {event.location_name}
                            </p>
                            <p style={{ margin: '0 0 15px 0' }}>{event.description}</p>
                            <button style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}>
                                <Link to={`/events/${event.id}`} style={{ display: 'inline-block', padding: '8px 16px', textDecoration: 'none', backgroundColor: '#007BFF', color: 'white', borderRadius: '4px', textAlign: 'center' }}>
                                    Zobacz szczegóły
                                </Link>

                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Events;





































































































































