import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Configure storage based on file type
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads';
    if (file.mimetype === 'application/pdf') {
      folder = 'uploads/pdf';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'uploads/audio';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images';
    } else {
      return cb(new Error('Unsupported file type'), false);
    }
    const fullPath = path.join(__dirname, '..', folder);
    ensureDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// File filter: allow images, PDFs, audio
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Endpoint for PDF
router.post('/pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No PDF uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/pdf/${req.file.filename}`;
  res.json({ url, fileName: req.file.originalname });
});

// Endpoint for voice
router.post('/voice', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No audio uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/audio/${req.file.filename}`;
  res.json({ url });
});

// General upload (fallback)
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  let relativePath = '';
  if (req.file.mimetype === 'application/pdf') relativePath = '/uploads/pdf/';
  else if (req.file.mimetype.startsWith('audio/')) relativePath = '/uploads/audio/';
  else relativePath = '/uploads/images/';
  const url = baseUrl + relativePath + req.file.filename;
  res.json({ url, fileType: req.file.mimetype.split('/')[0] });
});

export default router;