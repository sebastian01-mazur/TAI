import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Navbar() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Pobieramy dane zalogowanego użytkownika z pamięci przeglądarki
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const token = localStorage.getItem('token');

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const response = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch (err) {
            console.error('Błąd pobierania powiadomień:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling co 15 sekund
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setNotifications([]);
        setShowNotifDropdown(false);
        navigate('/login');
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkSingleRead = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 40px',
            backgroundColor: 'rgba(22, 30, 47, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.15)'
        }}>
            <div style={{ fontWeight: '700', fontSize: '22px', letterSpacing: '-0.03em' }}>
                <Link to="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent-color)' }}>⚡</span> EventManager
                </Link>
            </div>

            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
                        
                        <Link to="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>
                            Wydarzenia
                        </Link>
                        
                        <Link to="/events/map" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>
                            Mapa
                        </Link>

                        {user.role === 'USER' && (
                            <Link to="/become-organizer" style={{ color: 'var(--warning-color)', textDecoration: 'none', fontWeight: '600' }}>
                                Zostań organizatorem
                            </Link>
                        )}

                        {user.role === 'ORGANIZER' && (
                            <Link to="/organizer" style={{ color: 'var(--success-color)', textDecoration: 'none', fontWeight: '600' }}>
                                Panel Organizatora
                            </Link>
                        )}
                        
                        {user.role === 'ADMIN' && (
                            <Link to="/admin/organizer-requests" style={{ color: 'var(--danger-color)', textDecoration: 'none', fontWeight: '600' }}>
                                Panel Admina
                            </Link>
                        )}

                        {/* Powiadomienia - Dzwoneczek */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button 
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    fontSize: '20px', 
                                    cursor: 'pointer', 
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px'
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        backgroundColor: 'var(--danger-color)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        fontWeight: '700'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown powiadomień */}
                            {showNotifDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '35px',
                                    width: '320px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    boxShadow: 'var(--glass-shadow)',
                                    padding: '16px',
                                    zIndex: 2000,
                                    textAlign: 'left'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>Powiadomienia</h4>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={handleMarkAllRead} 
                                                style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                Oznacz wszystkie
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {notifications.length === 0 ? (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0' }}>Brak nowych powiadomień.</p>
                                        ) : (
                                            notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => !notif.is_read && handleMarkSingleRead(notif.id)}
                                                    style={{ 
                                                        padding: '10px', 
                                                        borderRadius: '6px', 
                                                        backgroundColor: notif.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.08)', 
                                                        border: '1px solid',
                                                        borderColor: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.2)',
                                                        cursor: notif.is_read ? 'default' : 'pointer',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <strong style={{ fontSize: '13px', color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{notif.title}</strong>
                                                        {!notif.is_read && <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-color)', borderRadius: '50%' }}></span>}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{notif.message}</p>
                                                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/profile" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>
                            Profil
                        </Link>

                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                            Cześć, <strong style={{ color: 'var(--text-primary)' }}>{user.first_name}</strong>!
                        </span>
                        
                        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                            Wyloguj
                        </button>
                    </div>
                ) : (
                    // Widok dla gościa
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>Zaloguj</Link>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Zarejestruj</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;