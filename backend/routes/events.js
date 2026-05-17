const express = require('express');
const pool = require('../db');
const router = express.Router();

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

module.exports = router;