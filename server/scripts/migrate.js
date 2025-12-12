require('dotenv').config();
const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Shows table - stores cinema shows with different screen types (IMAX, 3D, 4DX, Standard)
    await client.query(`
      CREATE TABLE IF NOT EXISTS shows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        total_seats INTEGER NOT NULL CHECK (total_seats > 0),
        booked_seats INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        seats INTEGER[] NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index for faster queries on common lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON bookings(show_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time)
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
