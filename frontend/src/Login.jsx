import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Używamy do nawigacji

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Pozwoli nam przełączyć stronę po zalogowaniu

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);

            // Zapisujemy token w przeglądarce, żeby pamietała że jesteśmy zalogowani!
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            setMessage('Zalogowano! Zaraz nastąpi przekierowanie...');

            // Symulacja przekierowania do listy eventów po 1.5 sekundy
            setTimeout(() => {
                navigate('/events');
            }, 1500);

        } catch (error) {
            setMessage(error.response?.data?.message || 'Błąd logowania');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Logowanie do Event Manager</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Hasło" value={formData.password} onChange={handleChange} required />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Zaloguj się</button>
            </form>
            {message && <p style={{ marginTop: '15px', color: 'blue' }}>{message}</p>}

            {/* Link do rejestracji */}
            <p style={{ marginTop: '20px' }}>
                Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </p>
        </div>
    );
}

export default Login;