const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to check if user has organizer/admin rights
const isOrganizerOrAdmin = (req, res, next) => {
    if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Brak dostępu. Wymagana rola organizatora lub administratora.' });
    }
    next();
};

// Endpoint pobierający wydarzenia zalogowanego organizatora: GET /api/organizer/events
router.get('/events', auth, isOrganizerOrAdmin, async (req, res) => {
    try {
        const organizerId = req.user.id;
        const myEvents = await pool.query(
            `SELECT 
                e.*, 
                COALESCE(ep.count, 0)::int AS participant_count,
                COALESCE(ef.count, 0)::int AS follow_count,
                (COALESCE(ep.count, 0)::int * 2 + COALESCE(ef.count, 0)::int) AS popularity_score
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
             WHERE e.organizer_id = $1 
             ORDER BY e.event_date ASC`,
            [organizerId]
        );

        res.json(myEvents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania wydarzeń organizatora.' });
    }
});

// Endpoint pobierający statystyki dla zalogowanego organizatora: GET /api/organizer/statistics
router.get('/statistics', auth, isOrganizerOrAdmin, async (req, res) => {
    try {
        const organizerId = req.user.id;
        
        const myEvents = await pool.query(
            `SELECT 
                e.id, 
                e.title, 
                e.capacity, 
                e.event_date,
                e.status,
                COALESCE(ep.count, 0)::int AS participant_count,
                COALESCE(ef.count, 0)::int AS follow_count,
                (COALESCE(ep.count, 0)::int * 2 + COALESCE(ef.count, 0)::int) AS popularity_score
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
             WHERE e.organizer_id = $1 
             ORDER BY popularity_score DESC`,
            [organizerId]
        );

        const eventsList = myEvents.rows;

        let totalEvents = eventsList.length;
        let totalCapacity = 0;
        let totalParticipants = 0;
        let totalFollowers = 0;
        let mostPopularEvent = null;

        eventsList.forEach(e => {
            totalCapacity += e.capacity;
            totalParticipants += e.participant_count;
            totalFollowers += e.follow_count;
        });

        if (totalEvents > 0) {
            mostPopularEvent = eventsList[0]; // Ponieważ posortowaliśmy DESC po popularity_score
        }

        const occupancyPercent = totalCapacity > 0 
            ? Math.round((totalParticipants / totalCapacity) * 100) 
            : 0;

        res.json({
            totalEvents,
            totalCapacity,
            totalParticipants,
            totalFollowers,
            occupancyPercent,
            mostPopularEvent,
            events: eventsList // Zwracamy listę wydarzeń z ich liczbą zapisów, polubień i punktacją popularności
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania statystyk organizatora.' });
    }
});

module.exports = router;