const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Pozwala na odczytywanie danych w formacie JSON z frontendu

// Importowanie ścieżek (każda deklaracja występuje tylko raz)
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

// Rejestracja ścieżek w aplikacji
app.use('/api/auth', authRoutes);     // Logowanie i rejestracja
app.use('/api/events', eventRoutes);   // Pobieranie i obsługa wydarzeń

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

// Uruchomienie nasłuchiwania serwera
app.listen(PORT, () => {
    console.log(`Serwer śmiga na porcie ${PORT}`);
});