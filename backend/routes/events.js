const express = require('express');
const pool = require('../db');
const router = express.Router();
const auth = require('../middleware/auth');

// Endpoint pobierający wszystkie wydarzenia: GET /api/events
router.get('/', async (req, res) => {
    try {
        // Pobieramy eventy posortowane od najbliższego [cite: 234]
        const allEvents = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
        res.json(allEvents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzeń.' });
    }
});
// Endpoint pobierający pojedyncze wydarzenie: GET /api/events/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

        if (event.rows.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono wydarzenia.' });
        }

        res.json(event.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzenia.' });
    }
});
// Endpoint do zapisywania się na wydarzenie (zabezpieczony middlewarem 'auth')
router.post('/:id/register', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id; // To mamy dzięki naszemu middleware!

        // 1. Sprawdzenie, czy użytkownik nie jest już zapisany [cite: 340, 222]
        const checkParticipant = await pool.query(
            'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
            [eventId, userId]
        );
        if (checkParticipant.rows.length > 0) {
            return res.status(400).json({ message: 'Jesteś już zapisany na to wydarzenie.' });
        }

        // 2. Sprawdzenie, czy są wolne miejsca (capacity) [cite: 340]
        const eventResult = await pool.query('SELECT capacity FROM events WHERE id = $1', [eventId]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: 'Wydarzenie nie istnieje.' });
        }

        const capacity = eventResult.rows[0].capacity;
        const participantsResult = await pool.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
        const currentParticipants = parseInt(participantsResult.rows[0].count);

        if (currentParticipants >= capacity) {
            return res.status(400).json({ message: 'Brak wolnych miejsc na to wydarzenie.' });
        }

        // 3. Dodanie wpisu do tabeli event_participants [cite: 340, 177-182]
        await pool.query(
            'INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)',
            [eventId, userId, 'REGISTERED']
        );

        res.status(201).json({ message: 'Udało się zapisać na wydarzenie!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas zapisywania.' });
    }
});
// Endpoint do tworzenia wydarzenia: POST /api/events
router.post('/', auth, async (req, res) => {
    try {
        // Zabezpieczenie z dokumentacji: tylko ORGANIZER może tworzyć eventy [cite: 225, 348-349]
        if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Brak uprawnień. Tylko organizator może tworzyć wydarzenia.' });
        }

        const organizerId = req.user.id;
        const { title, description, category, event_date, start_time, end_time, location_name, capacity } = req.body; // [cite: 306-316]

        // Podstawowa walidacja (pojemność > 0) [cite: 223]
        if (capacity <= 0) {
            return res.status(400).json({ message: 'Liczba miejsc musi być większa od zera.' });
        }

        const newEvent = await pool.query(
            `INSERT INTO events 
            (organizer_id, title, description, category, event_date, start_time, end_time, location_name, capacity) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [organizerId, title, description, category, event_date, start_time, end_time, location_name, capacity]
        );

        res.status(201).json({ message: 'Wydarzenie zostało pomyślnie utworzone!', event: newEvent.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas dodawania wydarzenia.' });
    }
});

module.exports = router;