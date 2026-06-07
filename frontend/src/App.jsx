import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Events from './Events';
import Navbar from './Navbar';
import EventDetails from './EventDetails';
import BecomeOrganizer from './BecomeOrganizer';
import OrganizerDashboard from './OrganizerDashboard';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import Profile from './Profile';
import AdminDashboard from './AdminDashboard';
import MapView from './MapView';

// Komponent zabezpieczający trasy na podstawie zalogowania i ról użytkownika
function ProtectedRoute({ children, allowedRoles }) {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Zalogowany, ale nie ma wymaganej roli
        return <Navigate to="/events" replace />;
    }

    return children;
}

function App() {
    const token = localStorage.getItem('token');

    return (
        <Router>
            <Navbar /> {/* Zawsze widoczny na górze ekranu */}

            <div className="container" style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={token ? <Navigate to="/events" replace /> : <Navigate to="/login" replace />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* Zabezpieczone trasy dla wszystkich zalogowanych użytkowników */}
                    <Route path="/events" element={
                        <ProtectedRoute>
                            <Events />
                        </ProtectedRoute>
                    } />
                    <Route path="/events/map" element={
                        <ProtectedRoute>
                            <MapView />
                        </ProtectedRoute>
                    } />
                    <Route path="/events/:id" element={
                        <ProtectedRoute>
                            <EventDetails />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />

                    {/* Zabezpieczone trasy dla konkretnych ról */}
                    <Route path="/become-organizer" element={
                        <ProtectedRoute allowedRoles={['USER']}>
                            <BecomeOrganizer />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/organizer" element={
                        <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                            <OrganizerDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/organizer/events/new" element={
                        <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                            <CreateEvent />
                        </ProtectedRoute>
                    } />
                    <Route path="/organizer/events/:id/edit" element={
                        <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                            <EditEvent />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/organizer-requests" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;