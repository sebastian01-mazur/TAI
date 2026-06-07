const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    // Odczytujemy token z nagłówka zapytania wysłanego przez frontend
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Brak tokenu, autoryzacja odrzucona.' });
    }

    try {
        // Zazwyczaj token przychodzi w formacie "Bearer [token]"
        const token = authHeader.split(' ')[1];

        // Weryfikujemy token naszym tajnym kluczem
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Przypisujemy odkodowane dane użytkownika do obiektu `req`
        req.user = decoded;
        next(); // Przekazujemy działanie dalej do endpointu
    } catch (err) {
        res.status(401).json({ message: 'Nieprawidłowy token.' });
    }
};