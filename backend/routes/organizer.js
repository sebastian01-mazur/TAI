const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth'); // Ochrona endpointu
const router = express.Router();

// Endpoint do wysyłania zgłoszenia: POST /api/organizer-requests [cite: 244]
router.post('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { organization_name, description, phone, website } = req.body; // [cite: 320-324]

        // 1. Sprawdzenie, czy użytkownik przypadkiem już nie wysłał zgłoszenia
        const existingRequest = await pool.query('SELECT * FROM organizer_requests WHERE user_id = $1', [userId]);
        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ message: 'Już wysłałeś zgłoszenie. Czekaj na weryfikację.' });
        }

        // 2. Zapis do bazy
        await pool.query(
            'INSERT INTO organizer_requests (user_id, organization_name, description, phone, website) VALUES ($1, $2, $3, $4, $5)',
            [userId, organization_name, description, phone, website]
        );

        res.status(201).json({ message: 'Zgłoszenie zostało wysłane pomyślnie!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas wysyłania zgłoszenia.' });
    }
});

module.exports = router;