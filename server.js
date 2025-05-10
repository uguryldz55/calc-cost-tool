const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = 'cost-calc-secret';
const users = [];
const tables = {};

// Register endpoint
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });
  return res.json({ message: 'Registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ email }, SECRET, { expiresIn: '1h' });
  return res.json({ token });
});

// Middleware to check JWT
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Save table data
app.post('/table', auth, (req, res) => {
  const { data, columns } = req.body;
  tables[req.user.email] = { data, columns };
  res.json({ message: 'Table saved' });
});

// Load table data
app.get('/table', auth, (req, res) => {
  const table = tables[req.user.email] || { data: [], columns: [] };
  res.json(table);
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 