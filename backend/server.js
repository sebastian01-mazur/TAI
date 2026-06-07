const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Pozwala na odczytywanie danych w formacie JSON z frontendu

// Serwowanie statycznych plików z katalogu uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importowanie ścieżek (każda deklaracja występuje tylko raz)
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const uploadRoutes = require('./routes/upload');

// Rejestracja ścieżek w aplikacji
app.use('/api/auth', authRoutes);     // Logowanie i rejestracja
app.use('/api/events', eventRoutes);   // Pobieranie i obsługa wydarzeń
app.use('/api/upload', uploadRoutes);   // Przesyłanie plików zdjęć

// Endpoint testujący połączenie z bazą danych
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: 'Połączenie z bazą działa!', time: result.rows[0].now });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Błąd połączenia z bazą');
    }
});
const organizerDashboardRoutes = require('./routes/organizerDashboard');
app.use('/api/organizer', organizerDashboardRoutes);

const organizerRoutes = require('./routes/organizer');
app.use('/api/organizer-requests', organizerRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Uruchomienie nasłuchiwania serwera
app.listen(PORT, () => {
    console.log(`Serwer śmiga na porcie ${PORT}`);
});