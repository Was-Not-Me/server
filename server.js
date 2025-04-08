// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
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

// Upload new box
app.post('/api/box', upload.single('file'), (req, res) => {
  const { type } = req.body;
  const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
  const box = { type, url: fileUrl };
  boxes.push(box);
  fs.writeFileSync('boxes.json', JSON.stringify(boxes, null, 2));
  res.json({ success: true, box });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
