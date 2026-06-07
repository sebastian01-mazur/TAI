import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function BecomeOrganizer() {
    const [formData, setFormData] = useState({
        organization_name: '',
        description: '',
        phone: '',
        website: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Musisz być zalogowany.');
                return;
            }

            const response = await axios.post(
                'http://localhost:5000/api/organizer-requests',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(response.data.message);

            // Po 2 sekundach wracamy na stronę główną
            setTimeout(() => {
                navigate('/events');
            }, 2000);

        } catch (error) {
            setMessage(error.response?.data?.message || 'Błąd podczas wysyłania zgłoszenia.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Zostań Organizatorem</h2>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Wypełnij formularz, aby zyskać uprawnienia do tworzenia własnych wydarzeń.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" name="organization_name" placeholder="Nazwa organizacji / Koła" value={formData.organization_name} onChange={handleChange} required style={{ padding: '10px' }} />
                <textarea name="description" placeholder="Krótki opis działalności" value={formData.description} onChange={handleChange} required style={{ padding: '10px', minHeight: '100px' }} />
                <input type="text" name="phone" placeholder="Numer telefonu (opcjonalnie)" value={formData.phone} onChange={handleChange} style={{ padding: '10px' }} />
                <input type="text" name="website" placeholder="Strona www (opcjonalnie)" value={formData.website} onChange={handleChange} style={{ padding: '10px' }} />

                <button type="submit" style={{ padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Wyślij zgłoszenie
                </button>
            </form>
            {message && <p style={{ marginTop: '15px', color: 'blue', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
}

export default BecomeOrganizer;