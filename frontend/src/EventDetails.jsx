import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function EventDetails() {
    const { id } = useParams(); // Pobiera ID z paska adresu URL
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/events/${id}`);
                setEvent(response.data);
                setLoading(false);
            } catch (err) {
                setError('Nie udało się pobrać szczegółów wydarzenia.');
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ładowanie...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;
    if (!event) return <p style={{ textAlign: 'center' }}>Wydarzenie nie istnieje.</p>;

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <Link to="/events" style={{ textDecoration: 'none', color: '#007BFF', marginBottom: '20px', display: 'inline-block' }}>
                &larr; Powrót do listy
            </Link>
            <h2>{event.title}</h2>
            <p><strong>Kategoria:</strong> {event.category}</p>
            <p><strong>Data:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
            <p><strong>Miejsce:</strong> {event.location_name}</p>
            <p><strong>Opis:</strong> {event.description}</p>
            <p><strong>Ilość miejsc:</strong> {event.capacity}</p>

            <button style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
                Zapisz się (wkrótce)
            </button>
        </div>
    );
}

export default EventDetails;