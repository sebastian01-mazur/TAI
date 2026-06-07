const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth'); // Middleware sprawdzający token sesji
const router = express.Router();

// Wysyłanie wniosku o nadanie statusu organizatora
router.post('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { organization_name, description, phone, website } = req.body;

        // Sprawdzamy, czy użytkownik nie złożył już wcześniej wniosku
        const existingRequest = await pool.query('SELECT * FROM organizer_requests WHERE user_id = $1', [userId]);
        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ message: 'Twój wniosek jest już w bazie. Poczekaj, aż admin go sprawdzi.' });
        }

        // Zapisujemy nowy wniosek do bazy
        await pool.query(
            'INSERT INTO organizer_requests (user_id, organization_name, description, phone, website) VALUES ($1, $2, $3, $4, $5)',
            [userId, organization_name, description, phone, website]
        );

        res.status(201).json({ message: 'Twój wniosek został wysłany! Czekaj na decyzję admina.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas wysyłania zgłoszenia.' });
    }
});

module.exports = router;