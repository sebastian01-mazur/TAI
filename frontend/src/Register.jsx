import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Register() {
    // Stan formularza rejestracji
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');

    // Obsługa zmian w polach tekstowych formularza
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Rejestracja użytkownika poprzez API
    const handleSubmit = async (e) => {
        e.preventDefault(); // Zapobieganie domyślnemu przeładowaniu strony
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMessage(response.data.message);
            setFormData({ first_name: '', last_name: '', email: '', password: '' }); // Wyczyszczenie formularza po sukcesie
        } catch (error) {
            setMessage(error.response?.data?.message || 'Wystąpił błąd podczas rejestracji');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
                    <h2 style={{ fontSize: '26px', marginBottom: '10px', display: 'block' }}>
                    Utwórz Konto
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
                    Dołącz do Event Manager, aby wyszukiwać i zapisywać się na wydarzenia.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Imię</label>
                            <input type="text" name="first_name" placeholder="Jan" value={formData.first_name} onChange={handleChange} required />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Nazwisko</label>
                            <input type="text" name="last_name" placeholder="Kowalski" value={formData.last_name} onChange={handleChange} required />
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Adres Email</label>
                        <input type="email" name="email" placeholder="nazwa@domena.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Hasło</label>
                        <input type="password" name="password" placeholder="Min. 6 znaków" value={formData.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}>
                        Zarejestruj się
                    </button>
                </form>
                
                {message && (
                    <p style={{ 
                        marginTop: '20px', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        backgroundColor: message.includes('pomyślnie') || message.includes('sukces') || message.includes('Utworzono') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: message.includes('pomyślnie') || message.includes('sukces') || message.includes('Utworzono') ? 'var(--success-color)' : 'var(--danger-color)',
                        border: '1px solid',
                        borderColor: message.includes('pomyślnie') || message.includes('sukces') || message.includes('Utworzono') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'
                    }}>
                        {message}
                    </p>
                )}

                <p style={{ marginTop: '30px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Masz już konto? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;