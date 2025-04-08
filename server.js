// server.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('uploads'));
app.use(express.json());

// Setup file upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

let boxes = [];

// Load boxes from file (optional)
if (fs.existsSync('boxes.json')) {
  boxes = JSON.parse(fs.readFileSync('boxes.json', 'utf8'));
}

// Get random box
app.get('/api/box', (req, res) => {
  if (boxes.length === 0) return res.status(404).json({ error: 'No boxes yet' });
  const box = boxes[Math.floor(Math.random() * boxes.length)];
  res.json(box);
});

// Upload new box (supports image, audio, code)
app.post('/api/box', upload.single('file'), (req, res) => {
  const { type, code } = req.body;
  const fileUrl = req.file ? `${req.protocol}://${req.get('host')}/${req.file.filename}` : null;

  let box = { type, url: fileUrl };

  if (type === 'code' && code) {
    box.code = code; // Save code directly
  }

  boxes.push(box);
  fs.writeFileSync('boxes.json', JSON.stringify(boxes, null, 2));
  res.json({ success: true, box });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
