require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploaded files
app.use('/uploads', express.static('uploads'));

// Master Ping for debugging
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'Backend Server is Reachable' }));

// Debug User Inspector
app.get('/api/debug/me', require('./middleware/authMiddleware').protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/engineer', require('./routes/engineerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/client', require('./routes/clientRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// 404 Handler for debugging
app.use((req, res) => {
  console.log('DEBUG 404:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
