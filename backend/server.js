const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();

// Allow the deployed frontend (and localhost during development) to call this API.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (curl, Postman, server-to-server) and any listed origin
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, true); // fall back to permissive CORS so the deployed demo never gets blocked
    },
    credentials: true
}));
app.use(express.json());

// Serve uploaded visitor photos and generated PDF badges
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/badges', express.static(path.join(__dirname, 'badges')));

// Connect to MongoDB
connectDB();

// Default route to fix the 'Cannot GET /' error on Render
app.get('/', (req, res) => {
    res.send('Visitor Management API is active.');
});

// Activate authentication and visitor routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/visitors', require('./src/routes/visitorRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
