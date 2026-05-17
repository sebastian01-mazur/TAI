import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Register() {
    // Stan przechowujący dane z formularza
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');

    // Obsługa wpisywania w pola
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Wysłanie formularza do backendu
    const handleSubmit = async (e) => {
        e.preventDefault(); // Blokuje przeładowanie strony
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMessage(response.data.message); // Komunikat o sukcesie
            setFormData({ first_name: '', last_name: '', email: '', password: '' }); // Czyszczenie pól
        } catch (error) {
            setMessage(error.response?.data?.message || 'Wystąpił błąd podczas rejestracji');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Rejestracja w Event Manager</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" name="first_name" placeholder="Imię" value={formData.first_name} onChange={handleChange} required />
                <input type="text" name="last_name" placeholder="Nazwisko" value={formData.last_name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Hasło" value={formData.password} onChange={handleChange} required />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Zarejestruj się</button>
            </form>
            {message && <p style={{ marginTop: '15px', color: 'blue' }}>{message}</p>}
            <p style={{ marginTop: '20px' }}>
                Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p></div>
    );
}

export default Register;