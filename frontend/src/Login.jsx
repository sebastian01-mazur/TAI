import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Hook do nawigacji pomiędzy widokami

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Inicjalizacja nawigacji po zalogowaniu

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);

            // Zapisanie tokenu JWT oraz danych użytkownika w pamięci przeglądarki
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            setMessage('Zalogowano! Zaraz nastąpi przekierowanie...');

            // Opóźnione przekierowanie do widoku wydarzeń
            setTimeout(() => {
                navigate('/events');
            }, 1500);

        } catch (error) {
            setMessage(error.response?.data?.message || 'Błąd logowania');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                    <h2 style={{ fontSize: '26px', marginBottom: '10px', display: 'block' }}>
                    Witaj Ponownie
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
                    Zaloguj się do Event Manager, aby zarządzać wydarzeniami.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Adres Email</label>
                        <input type="email" name="email" placeholder="nazwa@domena.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Hasło</label>
                        <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}>
                        Zaloguj się
                    </button>
                </form>
                
                {message && (
                    <p style={{ 
                        marginTop: '20px', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        backgroundColor: message.includes('Zalogowano') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: message.includes('Zalogowano') ? 'var(--success-color)' : 'var(--danger-color)',
                        border: '1px solid',
                        borderColor: message.includes('Zalogowano') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'
                    }}>
                        {message}
                    </p>
                )}

                <p style={{ marginTop: '30px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Nie masz konta? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Zarejestruj się</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;