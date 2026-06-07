const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/users/me - Pobieranie profilu aktualnego użytkownika
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania danych profilu.' });
  }
});

// PUT /api/users/me - Aktualizacja profilu (imię, nazwisko, opcjonalnie hasło)
router.put('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, password } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'Imię i nazwisko są wymagane.' });
    }

    let query = 'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, first_name, last_name, email, role';
    let params = [first_name, last_name, userId];

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      query = 'UPDATE users SET first_name = $1, last_name = $2, password_hash = $3 WHERE id = $4 RETURNING id, first_name, last_name, email, role';
      params = [first_name, last_name, passwordHash, userId];
    }

    const result = await pool.query(query, params);
    res.json({ message: 'Profil został pomyślnie zaktualizowany!', user: result.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji profilu.' });
  }
});

module.exports = router;
