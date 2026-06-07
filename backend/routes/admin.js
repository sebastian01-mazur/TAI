const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware sprawdzający, czy zalogowany gość to na pewno ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Brak uprawnień. Tylko admin może to zrobić.' });
    }
    next();
};

// Pobieranie wszystkich oczekujących wniosków o organizatora
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
        res.status(500).json({ message: 'Błąd podczas pobierania zgłoszeń.' });
    }
});

// Akceptacja wniosku o organizatora
router.put('/organizer-requests/:id/approve', auth, isAdmin, async (req, res) => {
    const client = await pool.connect(); // Transakcja, bo zmieniamy dane w dwóch tabelach na raz
    try {
        await client.query('BEGIN');
        const requestId = req.params.id;

        // Szukamy ID użytkownika powiązanego z tym wnioskiem
        const requestRes = await client.query('SELECT user_id FROM organizer_requests WHERE id = $1', [requestId]);
        if (requestRes.rows.length === 0) throw new Error('Wniosek nie istnieje');
        const userId = requestRes.rows[0].user_id;

        // Ustawiamy status wniosku na zaakceptowany (ACCEPTED)
        await client.query('UPDATE organizer_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2', ['ACCEPTED', requestId]);

        // Zmieniamy rolę użytkownika na ORGANIZER
        await client.query('UPDATE users SET role = $1 WHERE id = $2', ['ORGANIZER', userId]);

        await client.query('COMMIT');
        res.json({ message: 'Zaakceptowano! Ten użytkownik ma teraz uprawnienia organizatora.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ message: 'Błąd podczas zatwierdzania wniosku.' });
    } finally {
        client.release();
    }
});

// Odrzucenie wniosku o organizatora
router.put('/organizer-requests/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;
        // Zmieniamy status wniosku na odrzucony (REJECTED)
        await pool.query('UPDATE organizer_requests SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2', ['REJECTED', requestId]);
        res.json({ message: 'Zgłoszenie zostało odrzucone.' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd podczas odrzucania wniosku.' });
    }
});

module.exports = router;