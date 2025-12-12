require('dotenv').config();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    // Clear existing data
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM shows');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE shows_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');

    // Add sample users
    const users = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        name: 'Regular User',
        role: 'user'
      }
    ];

    for (const user of users) {
      await client.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [user.email, user.password, user.name, user.role]
      );
    }

    console.log('✅ Created sample users:');
    console.log('   - admin@example.com / admin123 (Admin)');
    console.log('   - user@example.com / user123 (User)');


    // Add some sample shows
    const shows = [
      {
        name: 'Avengers: Endgame',
        type: 'Standard',
        price: 15.00,
        start_time: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        total_seats: 40
      },
      {
        name: 'Inception',
        type: 'IMAX',
        price: 20.00,
        start_time: new Date(Date.now() + 5 * 60 * 60 * 1000),
        total_seats: 60
      },
      {
        name: 'The Dark Knight',
        type: '3D',
        price: 18.00,
        start_time: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        total_seats: 50
      },
      {
        name: 'Interstellar',
        type: '4DX',
        price: 22.00,
        start_time: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        total_seats: 45
      }
    ];

    for (const show of shows) {
      await client.query(
        'INSERT INTO shows (name, type, start_time, price, total_seats, booked_seats) VALUES ($1, $2, $3, $4, $5, \'{}\')',
        [show.name, show.type, show.start_time, show.price, show.total_seats]
      );
    }

    console.log('✅ Database seeded with sample data');
    console.log(`   Created ${shows.length} shows`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
