require('dotenv').config();
const pool = require('../config/database');

const resetDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting database...');
    
    await client.query('BEGIN');
    
    // Drop existing tables
    await client.query('DROP TABLE IF EXISTS bookings CASCADE');
    await client.query('DROP TABLE IF EXISTS shows CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Old tables dropped');
    
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create new tables with updated schema
    await client.query(`
      CREATE TABLE shows (
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

    await client.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        seats INTEGER[] NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
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
    console.log('✅ New tables created with updated schema');
    console.log('📋 Schema changes:');
    console.log('   - Added "users" table with email, password, name, role');
    console.log('   - Added "type" field to shows');
    console.log('   - Added "price" field to shows');
    console.log('   - Replaced "available_seats" with "booked_seats" array');
    console.log('   - Changed bookings "seats_count" to "seats" array');
    console.log('   - Added user_id foreign key to bookings');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

resetDatabase()
  .then(() => {
    console.log('\n✅ Database reset completed successfully!');
    console.log('📝 Next step: Run "npm run seed" to add sample data');
    process.exit(0);
  })
  .catch(err => {
    console.error('Reset error:', err);
    process.exit(1);
  });
