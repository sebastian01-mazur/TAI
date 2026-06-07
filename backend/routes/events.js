const express = require('express');
const pool = require('../db');
const router = express.Router();
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Helper to optionally parse user ID from token without throwing an error
const getOptionalUserId = (req) => {
  const authHeader = req.header('Authorization');
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id;
    } catch (e) {
      // Ignore invalid token
    }
  }
  return null;
};

// Helper function to send notifications to all participants and followers
const notifyEventUsers = async (eventId, title, message) => {
  try {
    const usersRes = await pool.query(
      `SELECT DISTINCT user_id 
       FROM (
           SELECT user_id FROM event_participants WHERE event_id = $1 AND status = 'REGISTERED'
           UNION
           SELECT user_id FROM event_follows WHERE event_id = $1
       ) u`,
      [eventId]
    );

    for (const row of usersRes.rows) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [row.user_id, title, message]
      );
    }
  } catch (err) {
    console.error('Błąd podczas wysyłania powiadomień:', err);
  }
};

// Endpoint pobierający wszystkie wydarzenia: GET /api/events
router.get('/', async (req, res) => {
  try {
    const userId = getOptionalUserId(req);

    // Pobieramy eventy wraz z liczbą uczestników, polubień i flagą czy użytkownik obserwuje
    const allEvents = await pool.query(`
      SELECT 
        e.*, 
        COALESCE(ep.count, 0)::int AS participant_count,
        COALESCE(ef.count, 0)::int AS follow_count,
        CASE WHEN ef_user.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_followed
      FROM events e 
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS count 
        FROM event_participants 
        WHERE status = 'REGISTERED' 
        GROUP BY event_id
      ) ep ON e.id = ep.event_id
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS count 
        FROM event_follows 
        GROUP BY event_id
      ) ef ON e.id = ef.event_id
      LEFT JOIN event_follows ef_user ON e.id = ef_user.event_id AND ef_user.user_id = $1
      ORDER BY e.event_date ASC
    `, [userId]);

    res.json(allEvents.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzeń.' });
  }
});

// Endpoint pobierający dane geograficzne dla mapy: GET /api/events/map
router.get('/map', async (req, res) => {
  try {
    const events = await pool.query(
      `SELECT id, title, category, latitude, longitude, location_name, event_date, status 
       FROM events 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    res.json(events.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania danych mapy.' });
  }
});

// Endpoint pobierający pojedyncze wydarzenie: GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getOptionalUserId(req);

    const event = await pool.query(`
      SELECT 
        e.*, 
        COALESCE(ep.count, 0)::int AS participant_count,
        COALESCE(ef.count, 0)::int AS follow_count,
        CASE WHEN ef_user.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_followed
      FROM events e 
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS count 
        FROM event_participants 
        WHERE status = 'REGISTERED' 
        GROUP BY event_id
      ) ep ON e.id = ep.event_id
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS count 
        FROM event_follows 
        GROUP BY event_id
      ) ef ON e.id = ef.event_id
      LEFT JOIN event_follows ef_user ON e.id = ef_user.event_id AND ef_user.user_id = $2
      WHERE e.id = $1
    `, [id, userId]);

    if (event.rows.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono wydarzenia.' });
    }

    res.json(event.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzenia.' });
  }
});

// Endpoint do zapisywania się na wydarzenie (zabezpieczony)
router.post('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // 1. Sprawdzenie, czy wydarzenie nie jest anulowane
    const eventCheck = await pool.query('SELECT status, capacity, title, organizer_id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Wydarzenie nie istnieje.' });
    }

    const eventObj = eventCheck.rows[0];
    if (eventObj.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Nie można zapisać się na anulowane wydarzenie.' });
    }

    // 2. Sprawdzenie, czy użytkownik nie jest już zapisany
    const checkParticipant = await pool.query(
      'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    if (checkParticipant.rows.length > 0) {
      return res.status(400).json({ message: 'Jesteś już zapisany na to wydarzenie.' });
    }

    // 3. Sprawdzenie pojemności
    const participantsResult = await pool.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
    const currentParticipants = parseInt(participantsResult.rows[0].count);

    if (currentParticipants >= eventObj.capacity) {
      return res.status(400).json({ message: 'Brak wolnych miejsc na to wydarzenie.' });
    }

    // 4. Zapisanie
    await pool.query(
      "INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, 'REGISTERED')",
      [eventId, userId]
    );

    // Opcjonalne: Wyślij powiadomienie do organizatora, że ktoś dołączył
    const participantName = req.user.first_name || 'Użytkownik';
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
      [
        eventObj.organizer_id, 
        'Nowy uczestnik!', 
        `${participantName} zapisał(a) się na Twoje wydarzenie "${eventObj.title}".`
      ]
    );

    res.status(201).json({ message: 'Udało się zapisać na wydarzenie!' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas zapisywania.' });
  }
});

// Endpoint do tworzenia wydarzenia: POST /api/events
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Brak uprawnień. Tylko organizator może tworzyć wydarzenia.' });
    }

    const organizerId = req.user.id;
    const { title, description, category, event_date, start_time, end_time, location_name, capacity, latitude, longitude, image_url } = req.body;

    if (capacity <= 0) {
      return res.status(400).json({ message: 'Liczba miejsc musi być większa od zera.' });
    }

    const newEvent = await pool.query(
      `INSERT INTO events 
       (organizer_id, title, description, category, event_date, start_time, end_time, location_name, capacity, latitude, longitude, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE') RETURNING *`,
      [organizerId, title, description, category, event_date, start_time, end_time, location_name, capacity, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, image_url || null]
    );

    res.status(201).json({ message: 'Wydarzenie zostało pomyślnie utworzone!', event: newEvent.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas dodawania wydarzenia.' });
  }
});

// Endpoint do edycji wydarzenia: PUT /api/events/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, event_date, start_time, end_time, location_name, capacity, latitude, longitude, image_url } = req.body;

    // Sprawdzenie uprawnień
    const checkEvent = await pool.query('SELECT organizer_id, title FROM events WHERE id = $1', [id]);
    if (checkEvent.rows.length === 0) {
      return res.status(404).json({ message: 'Wydarzenie nie istnieje.' });
    }

    if (checkEvent.rows[0].organizer_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego wydarzenia.' });
    }

    await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, category = $3, event_date = $4, start_time = $5, end_time = $6, 
           location_name = $7, capacity = $8, latitude = $9, longitude = $10, image_url = $11
       WHERE id = $12`,
      [title, description, category, event_date, start_time, end_time, location_name, capacity, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, image_url || null, id]
    );

    // Wyślij powiadomienia do zapisanych/obserwujących
    await notifyEventUsers(
      id,
      'Edycja wydarzenia',
      `Organizator zmienił szczegóły wydarzenia "${title}". Sprawdź nowe informacje!`
    );

    res.json({ message: 'Wydarzenie zostało pomyślnie zaktualizowane!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas edycji wydarzenia.' });
  }
});

// Endpoint anulowania wydarzenia (zmiana statusu na CANCELLED): DELETE /api/events/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const checkEvent = await pool.query('SELECT organizer_id, title, status FROM events WHERE id = $1', [id]);
    if (checkEvent.rows.length === 0) {
      return res.status(404).json({ message: 'Wydarzenie nie istnieje.' });
    }

    if (checkEvent.rows[0].organizer_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Brak uprawnień do anulowania tego wydarzenia.' });
    }

    // Ustawienie statusu CANCELLED
    await pool.query("UPDATE events SET status = 'CANCELLED' WHERE id = $1", [id]);

    // Wyślij powiadomienia
    await notifyEventUsers(
      id,
      'Wydarzenie anulowane!',
      `Uwaga! Wydarzenie "${checkEvent.rows[0].title}" zostało anulowane przez organizatora.`
    );

    res.json({ message: 'Wydarzenie zostało pomyślnie anulowane!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas anulowania wydarzenia.' });
  }
});

// Endpoint do obserwowania wydarzenia (serduszko): POST /api/events/:id/follow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Sprawdzamy czy użytkownik już obserwuje
    const checkFollow = await pool.query(
      'SELECT id FROM event_follows WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    let isFollowedNow = false;

    if (checkFollow.rows.length > 0) {
      // Usuwamy serduszko
      await pool.query(
        'DELETE FROM event_follows WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      isFollowedNow = false;
    } else {
      // Dodajemy serduszko
      await pool.query(
        'INSERT INTO event_follows (event_id, user_id) VALUES ($1, $2)',
        [eventId, userId]
      );
      isFollowedNow = true;

      // Powiadomienie dla organizatora, że ktoś obserwuje
      const eventDetails = await pool.query('SELECT organizer_id, title FROM events WHERE id = $1', [eventId]);
      if (eventDetails.rows.length > 0) {
        const followerName = req.user.first_name || 'Ktoś';
        await pool.query(
          'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
          [
            eventDetails.rows[0].organizer_id,
            'Nowa obserwacja',
            `${followerName} dodał(a) Twoje wydarzenie "${eventDetails.rows[0].title}" do obserwowanych.`
          ]
        );
      }
    }

    // Pobieramy nowy licznik serduszek
    const countRes = await pool.query('SELECT COUNT(*)::int AS count FROM event_follows WHERE event_id = $1', [eventId]);
    const followCount = countRes.rows[0].count;

    res.json({
      message: isFollowedNow ? 'Dodano do obserwowanych.' : 'Usunięto z obserwowanych.',
      is_followed: isFollowedNow,
      follow_count: followCount
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas przełączania obserwowania.' });
  }
});

// Endpoint pobierający listę uczestników wydarzenia
router.get('/:id/participants', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ep.registered_at, u.first_name, u.last_name, u.email 
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = $1 AND ep.status = 'REGISTERED'
       ORDER BY ep.registered_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania listy uczestników.' });
  }
});

// Endpoint anulujący zapis na wydarzenie: DELETE /api/events/:id/register
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      "DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2 RETURNING *",
      [eventId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Nie byłeś zapisany na to wydarzenie.' });
    }

    // Powiadomienie dla organizatora o wypisaniu się
    const eventDetails = await pool.query('SELECT organizer_id, title FROM events WHERE id = $1', [eventId]);
    if (eventDetails.rows.length > 0) {
      const name = req.user.first_name || 'Użytkownik';
      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [
          eventDetails.rows[0].organizer_id,
          'Rezygnacja z udziału',
          `${name} zrezygnował(a) z udziału w Twoim wydarzeniu "${eventDetails.rows[0].title}".`
        ]
      );
    }

    res.json({ message: 'Anulowano zapis na wydarzenie.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Błąd serwera podczas anulowania zapisu.' });
  }
});

module.exports = router;