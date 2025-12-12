require('dotenv').config();
const { Pool } = require('pg');

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'booker_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
    };

console.log('Attempting to connect with config:', {
  ...config,
  password: '****'
});

const pool = new Pool(config);

pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to the database!');
    return client.query('SELECT NOW()')
      .then(res => {
        console.log('Current database time:', res.rows[0].now);
        client.release();
        pool.end();
      });
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    if (err.message.includes('timeout')) {
      console.error('   -> Check if the host and port are correct.');
      console.error('   -> Check if the database server is running.');
      console.error('   -> Check if your IP is whitelisted (if remote).');
    }
    if (err.message.includes('terminated unexpectedly')) {
      console.error('   -> This often means SSL is required but not enabled.');
      console.error('   -> Try setting DB_SSL=true in your .env file.');
    }
    pool.end();
  });
