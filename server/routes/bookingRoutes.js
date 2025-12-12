const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { optionalAuth } = require('../middleware/auth');

// POST /api/bookings - Create a new booking (supports both authenticated and guest users)
router.post('/', 
  optionalAuth,
  [
    body('showId').notEmpty().withMessage('Valid show ID is required'),
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('seats').isArray({ min: 1, max: 10 }).withMessage('Seats must be an array with 1-10 seat numbers')
  ],
  bookingController.createBooking
);

// GET /api/bookings/:id - Get booking details
router.get('/:id', bookingController.getBooking);

// GET /api/bookings - Get user's bookings (requires email query param)
router.get('/', bookingController.getUserBookings);

module.exports = router;
