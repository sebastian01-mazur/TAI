const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); // Połączenie z bazą PostgreSQL
const router = express.Router();
const jwt = require('jsonwebtoken');

// Rejestracja nowego użytkownika: POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        // Wyciągamy dane przesłane z formularza
        const { first_name, last_name, email, password } = req.body;

        // Sprawdzamy czy dany email jest już zajęty
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Ten email jest już zarejestrowany.' });
        }

        // Haszujemy hasło bcryptem dla bezpieczeństwa
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Zapisujemy usera w bazie (rola domyślnie to 'USER')
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, role',
            [first_name, last_name, email, password_hash]
        );

        res.status(201).json({ message: 'Konto zostało założone!', user: newUser.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas rejestracji.' });
    }
});

// Logowanie użytkownika: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Szukamy użytkownika po mailu
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Błędny email lub hasło.' });
        }

        const user = userResult.rows[0];

        // Porównujemy hasło wpisane z hashem z bazy danych
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Błędny email lub hasło.' });
        }

        // Generujemy token sesji (JWT) ważny przez 1 dzień
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Zalogowano pomyślnie!',
            token: token,
            user: { id: user.id, first_name: user.first_name, role: user.role }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas logowania.' });
    }
});

module.exports = router;