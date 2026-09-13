require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initChatSocket = require('./src/sockets/chatSocket');
const setupGameSocket = require('./src/sockets/gameSocket');
const { initReminderScheduler } = require('./src/services/reminderScheduler');

const PORT = process.env.PORT || 5002;

// Connect to MongoDB Atlas
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket.IO handlers
initChatSocket(io);
setupGameSocket(io);

// Start node-cron background reminder scheduler
initReminderScheduler(io);

// Automatically kill any process occupying PORT before listening
try {
  if (process.platform !== 'win32') {
    execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`);
  }
} catch (e) {
  // Ignore if port was free
}

const serverInstance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`Didi & Bhai Backend Server running on port ${PORT}`);
});

serverInstance.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} in use, clearing port and retrying...`);
    try {
      execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`);
      serverInstance.listen(PORT);
    } catch (e) {
      console.error(`Failed to bind to port ${PORT}:`, e);
    }
  }
});
