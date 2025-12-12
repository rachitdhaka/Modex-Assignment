const pool = require('../config/database');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

// Create a booking with proper concurrency handling
exports.createBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { showId, userEmail, seats } = req.body;
    
    // Get user_id if authenticated
    const userId = req.user ? req.user.id : null;

    // Validate seats array
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Seats must be a non-empty array of seat numbers'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Lock the show row to prevent concurrent modifications
    const show = await Show.lockForUpdate(client, showId);

    if (!show) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Show not found'
      });
    }

    // Check if show has started
    if (new Date(show.startTime) <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot book for a show that has already started'
      });
    }

    // Check if seats are already booked
    const bookedSeatsSet = new Set(show.bookedSeats || []);
    const conflicts = seats.filter(seat => bookedSeatsSet.has(seat));
    
    if (conflicts.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Seats ${conflicts.join(', ')} are already booked`,
        conflicts
      });
    }

    // Check if seats exceed total capacity
    const totalBookedAfter = (show.bookedSeats || []).length + seats.length;
    if (totalBookedAfter > show.totalSeats) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Not enough seats available. Only ${show.totalSeats - show.bookedSeats.length} seats remaining`,
        availableSeats: show.totalSeats - show.bookedSeats.length
      });
    }

    // Create booking with PENDING status
    const booking = await Booking.create(client, showId, userId, userEmail, seats);

    // Update booked seats
    await Show.bookSeats(client, showId, seats);

    // Commit transaction
    await client.query('COMMIT');

    // Auto-confirm after a short delay (simulating payment)
    setTimeout(async () => {
      await confirmBookingAfterPayment(booking.id);
    }, 5000);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id.toString(),
        showId: booking.show_id.toString(),
        userEmail: booking.user_email,
        seats: booking.seats,
        status: booking.status,
        note: 'Booking is pending. Please complete payment within 2 minutes.'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create booking' 
    });
  } finally {
    client.release();
  }
};

// Helper function to confirm booking (simulating payment success)
async function confirmBookingAfterPayment(bookingId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await Booking.updateStatus(client, bookingId, 'CONFIRMED');
    await client.query('COMMIT');
    console.log(`✅ Booking ${bookingId} confirmed`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to confirm booking:', error);
  } finally {
    client.release();
  }
}

// Get booking details
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch booking details' 
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    const bookings = await Booking.getByUserEmail(email);
    
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bookings' 
    });
  }
};
