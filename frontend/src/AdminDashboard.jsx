import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            const response = await axios.get('http://localhost:5000/api/admin/organizer-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
            setLoading(false);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Brak dostępu lub błąd serwera.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/organizer-requests/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(`Zgłoszenie ${action === 'approve' ? 'zaakceptowane' : 'odrzucone'}!`);
            fetchRequests(); // Odśwież listę po akcji
        } catch (err) {
            setMessage('Wystąpił błąd podczas przetwarzania zgłoszenia.');
        }
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ładowanie panelu administratora...</p>;

    return (
        <div style={{ maxWidth: '900px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Panel Administratora - Zgłoszenia</h2>
            {message && <p style={{ color: 'blue', fontWeight: 'bold' }}>{message}</p>}

            {requests.length === 0 ? (
                <p>Brak nowych zgłoszeń do rozpatrzenia.</p>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {requests.map(req => (
                        <div key={req.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{req.organization_name}</h3>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>Od: {req.first_name} {req.last_name} ({req.email})</p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Opis:</strong> {req.description}</p>
                                <p style={{ margin: '0', fontSize: '14px' }}>Tel: {req.phone || 'Brak'} | WWW: {req.website || 'Brak'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleAction(req.id, 'approve')} style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Akceptuj</button>
                                <button onClick={() => handleAction(req.id, 'reject')} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Odrzuć</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;