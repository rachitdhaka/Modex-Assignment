const pool = require('../config/database');

class Booking {
  // Create a new booking
  static async create(client, showId, userId, userEmail, seats) {
    const result = await client.query(
      `INSERT INTO bookings (show_id, user_id, user_email, seats, status) 
       VALUES ($1, $2, $3, $4, 'PENDING') 
       RETURNING *`,
      [showId, userId, userEmail, seats]
    );
    return result.rows[0];
  }

  // Get booking by ID
  static async getById(id) {
    const result = await pool.query(
      `SELECT 
        b.id::text,
        b.show_id::text as "showId",
        b.user_email as "userEmail",
        b.seats,
        b.status,
        b.created_at as "createdAt",
        s.name as "showName", 
        s.start_time as "startTime"
       FROM bookings b 
       JOIN shows s ON b.show_id = s.id 
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get user bookings
  static async getByUserEmail(email) {
    const result = await pool.query(
      `SELECT 
        b.id::text,
        b.show_id::text as "showId",
        b.user_email as "userEmail",
        b.seats,
        b.status,
        b.created_at as "createdAt",
        s.name as "showName", 
        s.start_time as "startTime"
       FROM bookings b 
       JOIN shows s ON b.show_id = s.id 
       WHERE b.user_email = $1 
       ORDER BY b.created_at DESC`,
      [email]
    );
    return result.rows;
  }

  // Update booking status
  static async updateStatus(client, bookingId, status) {
    const result = await client.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, bookingId]
    );
    return result.rows[0];
  }

  // Find expired pending bookings (older than 2 minutes)
  static async findExpired() {
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE status = 'PENDING' 
       AND created_at < NOW() - INTERVAL '2 minutes'`
    );
    return result.rows;
  }

  // Mark booking as failed and remove seats from show
  static async markAsFailed(bookingId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get booking details
      const bookingResult = await client.query(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId]
      );
      const booking = bookingResult.rows[0];

      if (!booking || booking.status !== 'PENDING') {
        await client.query('ROLLBACK');
        return null;
      }

      // Update booking status
      await client.query(
        `UPDATE bookings 
         SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [bookingId]
      );

      // Remove seats from booked_seats array
      await client.query(
        `UPDATE shows 
         SET booked_seats = array(
           SELECT unnest(booked_seats) 
           EXCEPT 
           SELECT unnest($1::integer[])
         ),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [booking.seats, booking.show_id]
      );

      await client.query('COMMIT');
      return booking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Booking;
