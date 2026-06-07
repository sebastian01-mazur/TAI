const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware sprawdzający, czy zalogowany to na pewno ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Brak uprawnień. Tylko administrator ma tu dostęp.' });
    }
    next();
};

// 1. Pobieranie oczekujących zgłoszeń [cite: 246]
router.get('/organizer-requests', auth, isAdmin, async (req, res) => {
    try {
        const requests = await pool.query(
            `SELECT r.*, u.first_name, u.last_name, u.email 
             FROM organizer_requests r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.status = 'PENDING' 
             ORDER BY r.created_at ASC`
        );
        res.json(requests.rows);
    } catch (err) {
        res.status(500).json({ message: 'Błąd pobierania zgłoszeń.' });
    }
});

// 2. Akceptacja zgłoszenia [cite: 246, 330]
router.put('/organizer-requests/:id/approve', auth, isAdmin, async (req, res) => {
    const client = await pool.connect(); // Używamy transakcji, bo zmieniamy w dwóch tabelach naraz
    try {
        await client.query('BEGIN');
        const requestId = req.params.id;

        // Pobierz ID użytkownika ze zgłoszenia
        const requestRes = await client.query('SELECT user_id FROM organizer_requests WHERE id = $1', [requestId]);
        if (requestRes.rows.length === 0) throw new Error('Zgłoszenie nie istnieje');
        const userId = requestRes.rows[0].user_id;

        // Zmień status zgłoszenia na ACCEPTED
        await client.query('UPDATE organizer_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2', ['ACCEPTED', requestId]);

        // Zmień rolę użytkownika na ORGANIZER [cite: 336]
        await client.query('UPDATE users SET role = $1 WHERE id = $2', ['ORGANIZER', userId]);

        await client.query('COMMIT');
        res.json({ message: 'Zgłoszenie zaakceptowane! Użytkownik jest teraz organizatorem.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ message: 'Błąd podczas akceptacji zgłoszenia.' });
    } finally {
        client.release();
    }
});

// 3. Odrzucenie zgłoszenia [cite: 246, 331]
router.put('/organizer-requests/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        await pool.query('UPDATE organizer_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2', ['REJECTED', requestId]);
        res.json({ message: 'Zgłoszenie zostało odrzucone.' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd podczas odrzucania zgłoszenia.' });
    }
});

module.exports = router;