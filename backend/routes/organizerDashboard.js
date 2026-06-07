const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Endpoint pobierający wydarzenia zalogowanego organizatora: GET /api/organizer/events
router.get('/events', auth, async (req, res) => {
    try {
        // Sprawdzamy, czy użytkownik ma uprawnienia organizatora
        if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Brak dostępu. Wymagana rola organizatora.' });
        }

        const organizerId = req.user.id;
        const myEvents = await pool.query(
            'SELECT * FROM events WHERE organizer_id = $1 ORDER BY event_date ASC',
            [organizerId]
        );

        res.json(myEvents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzeń organizatora.' });
    }
});

module.exports = router;