import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    created_at: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          email: response.data.email,
          role: response.data.role,
          created_at: response.data.created_at
        });
        setLoading(false);
      } catch (err) {
        setError('Błąd wczytywania danych profilu.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Jeśli użytkownik wpisał hasło, weryfikujemy czy zgadza się z potwierdzeniem
    if (passwordData.password) {
      if (passwordData.password !== passwordData.confirmPassword) {
        setError('Nowe hasło i jego potwierdzenie nie są identyczne.');
        return;
      }
      if (passwordData.password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.');
        return;
      }
    }

    try {
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name
      };

      if (passwordData.password) {
        payload.password = passwordData.password;
      }

      const response = await axios.put(
        'http://localhost:5000/api/users/me',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Aktualizujemy dane w localStorage, żeby pasek Navbar zaktualizował imię
      const localUserString = localStorage.getItem('user');
      if (localUserString) {
        const localUser = JSON.parse(localUserString);
        localUser.first_name = response.data.user.first_name;
        localStorage.setItem('user', JSON.stringify(localUser));
      }

      setMessage(response.data.message);
      setPasswordData({ password: '', confirmPassword: '' });

      // Odświeżenie okna po 1.5 sekundy
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas aktualizacji profilu.');
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center' }}><p>Wczytywanie profilu...</p></div>;
  if (error && !profile.email) return <div className="container" style={{ textAlign: 'center', color: 'var(--danger-color)' }}><p>{error}</p></div>;

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card" style={{ textAlign: 'left' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>Twój Profil</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          Zarejestrowany: {new Date(profile.created_at).toLocaleDateString()} | Rola: <strong style={{ color: 'var(--accent-color)' }}>{profile.role}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Email (Nieedytowalny)</label>
            <input 
              type="email" 
              value={profile.email} 
              disabled 
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} 
            />
          </div>

          <div className="grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Imię</label>
              <input 
                type="text" 
                name="first_name" 
                value={profile.first_name} 
                onChange={handleProfileChange} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Nazwisko</label>
              <input 
                type="text" 
                name="last_name" 
                value={profile.last_name} 
                onChange={handleProfileChange} 
                required 
              />
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>Zmień hasło</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Pozostaw puste, jeśli nie chcesz zmieniać hasła.</p>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Nowe hasło</label>
            <input 
              type="password" 
              name="password" 
              placeholder="Wpisz nowe hasło" 
              value={passwordData.password} 
              onChange={handlePasswordChange} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Potwierdź nowe hasło</label>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Powtórz nowe hasło" 
              value={passwordData.confirmPassword} 
              onChange={handlePasswordChange} 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: '600' }}>
            Zapisz Zmiany
          </button>
        </form>

        {error && <p style={{ color: 'var(--danger-color)', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{error}</p>}
        {message && <p style={{ color: 'var(--success-color)', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>{message}</p>}
      </div>
    </div>
  );
}

export default Profile;
