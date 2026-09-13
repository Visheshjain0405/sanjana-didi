const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint for Render/monitoring
app.get('/health', (req, res) => res.status(200).send('OK'));

// Serve static web portal from /public
app.use(express.static(path.join(__dirname, '../../public')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', reminderRoutes);

module.exports = app;
