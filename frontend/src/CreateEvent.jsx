import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function CreateEvent() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Rozrywka', // Domyślna kategoria
        event_date: '',
        start_time: '',
        end_time: '',
        location_name: '',
        capacity: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Brak autoryzacji. Zaloguj się ponownie.');
                return;
            }

            await axios.post(
                'http://localhost:5000/api/events',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Wydarzenie utworzone! Przekierowuję do panelu...');

            setTimeout(() => {
                navigate('/organizer'); // Powrót do panelu organizatora
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || 'Błąd podczas tworzenia wydarzenia.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Nowe Wydarzenie</h2>
                <Link to="/organizer" style={{ textDecoration: 'none', color: '#007BFF' }}>&larr; Anuluj</Link>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" name="title" placeholder="Tytuł wydarzenia" value={formData.title} onChange={handleChange} required style={{ padding: '10px' }} />

                <select name="category" value={formData.category} onChange={handleChange} style={{ padding: '10px' }}>
                    <option value="Rozrywka">Rozrywka</option>
                    <option value="Edukacja">Edukacja</option>
                    <option value="Sport">Sport</option>
                    <option value="Biznes">Biznes</option>
                    <option value="Inne">Inne</option>
                </select>

                <textarea name="description" placeholder="Pełny opis wydarzenia..." value={formData.description} onChange={handleChange} required style={{ padding: '10px', minHeight: '100px' }} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required style={{ padding: '10px', flex: 1 }} />
                    <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} style={{ padding: '10px', flex: 1 }} />
                    <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} style={{ padding: '10px', flex: 1 }} />
                </div>

                <input type="text" name="location_name" placeholder="Miejsce (np. Warszawa, ul. Główna 1)" value={formData.location_name} onChange={handleChange} required style={{ padding: '10px' }} />

                <input type="number" name="capacity" placeholder="Liczba miejsc (np. 100)" value={formData.capacity} onChange={handleChange} min="1" required style={{ padding: '10px' }} />

                <button type="submit" style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    Zapisz wydarzenie
                </button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
            {message && <p style={{ color: 'green', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
}

export default CreateEvent;