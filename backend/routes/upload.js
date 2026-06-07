const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const router = express.Router();

// Upewnij się, że katalog 'uploads' istnieje
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfiguracja dysku dla multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'event-' + uniqueSuffix + ext);
    }
});

// Filtrowanie typów plików (tylko obrazy)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Nieprawidłowy typ pliku. Możesz przesyłać tylko zdjęcia.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
});

// Endpoint do przesyłania zdjęcia: POST /api/upload
router.post('/', auth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nie przesłano żadnego pliku.' });
        }
        
        // Zwracamy relatywną ścieżkę do pliku na serwerze
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(201).json({ 
            message: 'Zdjęcie przesłane pomyślnie!',
            url: fileUrl 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd serwera podczas zapisywania zdjęcia.' });
    }
});

module.exports = router;
