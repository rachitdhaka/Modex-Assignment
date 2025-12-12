const pool = require('../config/database');

class Show {
  // Get all available shows
  static async getAll() {
    const result = await pool.query(
      `SELECT 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"
       FROM shows 
       ORDER BY start_time ASC`
    );
    return result.rows;
  }

  // Get available shows (future shows with seats)
  static async getAvailable() {
    const result = await pool.query(
      `SELECT 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"
       FROM shows 
       WHERE start_time > NOW() 
         AND array_length(COALESCE(booked_seats, '{}'), 1) < total_seats
       ORDER BY start_time ASC`
    );
    return result.rows;
  }

  // Get show by ID
  static async getById(id) {
    const result = await pool.query(
      `SELECT 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"
       FROM shows 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Create new show (admin only)
  static async create(name, type, startTime, price, totalSeats) {
    const result = await pool.query(
      `INSERT INTO shows (name, type, start_time, price, total_seats, booked_seats) 
       VALUES ($1, $2, $3, $4, $5, '{}') 
       RETURNING 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"`,
      [name, type, startTime, price, totalSeats]
    );
    return result.rows[0];
  }

  // Update booked seats - used during booking
  static async bookSeats(client, showId, seats) {
    const result = await client.query(
      `UPDATE shows 
       SET booked_seats = array_cat(COALESCE(booked_seats, '{}'), $1::integer[]),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"`,
      [seats, showId]
    );
    return result.rows[0];
  }

  // Lock a show row for update (prevents concurrent updates)
  static async lockForUpdate(client, showId) {
    const result = await client.query(
      `SELECT 
        id::text, 
        name, 
        type,
        start_time as "startTime", 
        price::numeric,
        total_seats as "totalSeats", 
        COALESCE(booked_seats, '{}') as "bookedSeats"
       FROM shows 
       WHERE id = $1 
       FOR UPDATE`,
      [showId]
    );
    return result.rows[0];
  }
}

module.exports = Show;
