const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/notifications - Pobieranie powiadomień użytkownika
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania powiadomień.' });
  }
});

// PUT /api/notifications/read-all - Oznaczenie wszystkich jako przeczytane
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
    res.json({ message: 'Oznaczono wszystkie powiadomienia jako przeczytane.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji powiadomień.' });
  }
});

// PUT /api/notifications/:id/read - Oznaczenie pojedynczego jako przeczytane
router.put('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono powiadomienia.' });
    }

    res.json({ message: 'Powiadomienie oznaczone jako przeczytane.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji powiadomienia.' });
  }
});

module.exports = router;
