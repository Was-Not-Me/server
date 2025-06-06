import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const boxesFile = './boxes.json';
let boxes = fs.existsSync(boxesFile) ? JSON.parse(fs.readFileSync(boxesFile)) : [];

function saveBoxes() {
  fs.writeFileSync(boxesFile, JSON.stringify(boxes, null, 2));
}

// Middleware to check password for admin routes
function checkAdminPassword(req, res, next) {
  const password = req.headers['admin-password'];
  if (password === process.env.ADMIN_PASSWORD) {
    return next();
  }
  res.status(403).json({ error: 'Unauthorized' });
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  const { title, author = '', type, code } = req.body;
  if (!title || !type || (type === 'code' && !code && !req.file)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newBox = {
    id: uuid(),
    title,
    author,
    type,
    isFlagged: false,
  };

  if (type === 'code') {
    newBox.code = code;
  } else if (req.file) {
    newBox.filePath = '/uploads/' + req.file.filename;
  } else {
    return res.status(400).json({ error: 'File is required' });
  }

  boxes.push(newBox);
  saveBoxes();
  res.json({ success: true });
});

app.get('/api/box', (req, res) => {
  const available = boxes.filter(b => !b.isFlagged);
  if (available.length === 0) return res.status(404).json({ error: 'No boxes available' });
  const box = available[Math.floor(Math.random() * available.length)];
  res.json(box);
});

app.post('/api/flag/:id', (req, res) => {
  const box = boxes.find(b => b.id === req.params.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  box.isFlagged = true;
  saveBoxes();
  res.json({ success: true });
});

// Admin routes with password protection
app.get('/api/admin/flags', checkAdminPassword, (req, res) => {
  const flagged = boxes.filter(b => b.isFlagged);
  res.json(flagged);
});

app.post('/api/admin/unflag/:id', checkAdminPassword, (req, res) => {
  const box = boxes.find(b => b.id === req.params.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  box.isFlagged = false;
  saveBoxes();
  res.json({ success: true });
});

app.delete('/api/admin/delete/:id', checkAdminPassword, (req, res) => {
  const index = boxes.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Box not found' });

  const [removed] = boxes.splice(index, 1);
  if (removed.filePath) {
    fs.unlinkSync('.' + removed.filePath); // Delete uploaded file
  }

  saveBoxes();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
