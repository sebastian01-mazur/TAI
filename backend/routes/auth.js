const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); // Importujemy nasze połączenie z bazą
const router = express.Router();
const jwt = require('jsonwebtoken');

// Endpoint rejestracji: POST /api/auth/register [cite: 230]
router.post('/register', async (req, res) => {
    try {
        // 1. Pobranie danych z zapytania
        const { first_name, last_name, email, password } = req.body;

        // 2. Sprawdzenie, czy użytkownik o tym emailu już istnieje
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Użytkownik o podanym adresie email już istnieje.' });
        }

        // 3. Szyfrowanie hasła
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Zapisanie do bazy (rola domyślnie ustawi się na 'USER' zdefiniowana w SQL) [cite: 258-259, 160]
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, role',
            [first_name, last_name, email, password_hash]
        );

        // 5. Odpowiedź do frontendu
        res.status(201).json({ message: 'Rejestracja zakończona sukcesem!', user: newUser.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas rejestracji.' });
    }
});
// Endpoint logowania: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; // [cite: 263-265]

        // 1. Sprawdzenie czy użytkownik istnieje
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        const user = userResult.rows[0];

        // 2. Porównanie hasła z hashem w bazie
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        // 3. Generowanie tokenu JWT (ważny np. 1 dzień)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Sukces - wysyłamy token do frontendu
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

module.exports = router;