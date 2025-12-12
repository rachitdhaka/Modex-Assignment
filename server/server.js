require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const { cleanupExpiredBookings } = require('./utils/bookingCleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/, // *.vercel.app
      /^http:\/\/localhost(:\d+)?$/, // localhost with optional port
      /^http:\/\/127\.0\.0\.1(:\d+)?$/, // 127.0.0.1 with optional port
    ];
    
    if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// health check - always good to have one
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// routes
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Run cleanup job every minute to check for expired bookings
// In production, this would probably be a separate service
cron.schedule('* * * * *', async () => {
  try {
    await cleanupExpiredBookings();
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Booking expiry cleanup job scheduled`);
});
