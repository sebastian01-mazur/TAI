import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Events from './Events';
import Navbar from './Navbar';
import EventDetails from './EventDetails';

function App() {
    return (
        <Router>
            <Navbar /> {/* Zawsze widoczny na górze ekranu */}

            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;