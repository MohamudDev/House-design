require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active users (userId -> socketId)
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // When user logs in or connects, they emit 'setup'
  socket.on('setup', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} joined room`);
    socket.emit('connected');
  });

  // When a new message is sent
  socket.on('new message', (newMessageReceived) => {
    // Determine the recipient ID based on sender
    // The message object should have a sender and receiver.
    const recipientId = newMessageReceived.receiver._id || newMessageReceived.receiver;
    if (recipientId) {
      socket.in(recipientId).emit('message received', newMessageReceived);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Optional: Remove user from activeUsers if we map socket id back to user id
    activeUsers.forEach((value, key) => {
      if (value === socket.id) {
        activeUsers.delete(key);
      }
    });
  });
});

// Pass io to request object so controllers can emit events if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// 404 Handler for debugging
app.use((req, res) => {
  console.log('DEBUG 404:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// trigger nodemon restart
