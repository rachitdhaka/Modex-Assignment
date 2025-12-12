const { Pool } = require("pg");

// Connection pool setup - supports both connection string and individual params
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // 10 seconds for remote connections
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || "booker_db",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // 10 seconds
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : undefined,
      }
);

// Test connection on startup
pool.on("connect", () => {
  console.log("✅ Database connected");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
  process.exit(-1);
});

module.exports = pool;
