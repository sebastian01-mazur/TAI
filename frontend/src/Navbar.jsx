import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();

    // Pobieramy dane zalogowanego użytkownika z pamięci przeglądarki
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Funkcja czyszcząca pamięć i wylogowująca
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login'); // Przekierowanie na ekran logowania
    };
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            backgroundColor: '#2c3e50',
            color: '#fff',
            fontFamily: 'sans-serif'
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '22px' }}>
                <Link to="/events" style={{ color: '#fff', textDecoration: 'none' }}>Event Manager</Link>
            </div>

            <div>
                {user ? (
                    // Widok dla zalogowanego użytkownika
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                        {/* Dodajemy link do formularza zgłoszeniowego */}
                        {/* Logika wyświetlania linków na podstawie roli */}
                        {user.role === 'USER' && (
                            <Link to="/become-organizer" style={{ color: '#f39c12', textDecoration: 'none', fontWeight: 'bold', marginRight: '10px' }}>
                                Zostań organizatorem
                            </Link>
                        )}

                        {user.role === 'ORGANIZER' && (
                            <Link to="/organizer" style={{ color: '#2ecc71', textDecoration: 'none', fontWeight: 'bold', marginRight: '15px' }}>
                                Panel Organizatora
                            </Link>
                        )}
                        {user.role === 'ADMIN' && (
                            <Link to="/admin/organizer-requests" style={{ color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold', marginRight: '15px' }}>
                                Panel Admina
                            </Link>
                        )}

                        <span>Cześć, {user.first_name}!</span>
                        <button onClick={handleLogout} /* reszta guzika bez zmian */ >
                            Wyloguj
                        </button>
                    </div>
                ) : (
                    // Widok dla gościa
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Zaloguj</Link>
                        <Link to="/register" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Zarejestruj</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;