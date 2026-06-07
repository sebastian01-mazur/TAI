import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function OrganizerDashboard() {
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/organizer/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setMyEvents(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Nie udało się pobrać Twoich wydarzeń.');
                setLoading(false);
            }
        };

        fetchMyEvents();
    }, [navigate]);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ładowanie panelu...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', marginTop: '50px' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Panel Organizatora</h2>
                <Link to="/organizer/events/new" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                    + Dodaj wydarzenie
                </Link>
            </div>

            {myEvents.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#555' }}>Nie masz jeszcze utworzonych żadnych wydarzeń.</p>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {myEvents.map(event => (
                        <div key={event.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{event.title}</h3>
                                <p style={{ margin: 0, color: '#666' }}>Data: {new Date(event.event_date).toLocaleDateString()}</p>
                            </div>
                            <Link to={`/events/${event.id}`} style={{ padding: '8px 12px', backgroundColor: '#007BFF', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                                Podgląd
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrganizerDashboard;