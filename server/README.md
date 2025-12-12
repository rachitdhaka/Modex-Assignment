# Ticket Booking System API

A robust ticket booking backend system built with Node.js, Express, and PostgreSQL. Handles concurrent bookings with proper transaction management to prevent overbooking.

## Features

- ✅ Create and manage shows/trips/slots
- ✅ Concurrent booking handling with row-level locking
- ✅ Automatic booking expiry (2 minutes for pending bookings)
- ✅ Transaction-based seat management
- ✅ RESTful API design
- ✅ Database indexing for performance

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Key Libraries**: 
  - `pg` for PostgreSQL connection
  - `express-validator` for request validation
  - `node-cron` for scheduled jobs
  - `dotenv` for environment configuration

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd booker-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE booker_db;
```

Update the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booker_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
```

### 4. Run Migrations

```bash
npm run migrate
```

This will create the necessary tables:
- `shows` - Stores show/trip information
- `bookings` - Stores booking records

### 5. Seed Sample Data (Optional)

```bash
npm run seed
```

This adds some sample shows for testing.

### 6. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Health Check
```
GET /health
```
Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T10:30:00.000Z"
}
```

---

#### 2. Get All Shows
```
GET /api/shows
```
Returns all shows regardless of availability.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Avengers: Endgame - Screen 1",
      "start_time": "2025-12-11T15:00:00.000Z",
      "total_seats": 40,
      "available_seats": 35,
      "created_at": "2025-12-11T10:00:00.000Z",
      "updated_at": "2025-12-11T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### 3. Get Available Shows
```
GET /api/shows/available
```
Returns only shows with available seats and future start times.

**Response:** Same format as above, but filtered.

---

#### 4. Get Show by ID
```
GET /api/shows/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Avengers: Endgame - Screen 1",
    "start_time": "2025-12-11T15:00:00.000Z",
    "total_seats": 40,
    "available_seats": 35
  }
}
```

---

#### 5. Create Show (Admin)
```
POST /api/shows
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Inception - IMAX",
  "startTime": "2025-12-12T18:00:00Z",
  "totalSeats": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Show created successfully",
  "data": {
    "id": 5,
    "name": "Inception - IMAX",
    "start_time": "2025-12-12T18:00:00.000Z",
    "total_seats": 60,
    "available_seats": 60
  }
}
```

---

#### 6. Create Booking
```
POST /api/bookings
Content-Type: application/json
```

**Request Body:**
```json
{
  "showId": 1,
  "userEmail": "user@example.com",
  "seatsCount": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1,
    "show_id": 1,
    "user_email": "user@example.com",
    "seats_count": 2,
    "status": "PENDING",
    "created_at": "2025-12-11T10:30:00.000Z",
    "note": "Booking is pending. Please complete payment within 2 minutes."
  }
}
```

**Status Values:**
- `PENDING` - Booking created, awaiting confirmation
- `CONFIRMED` - Booking successfully completed
- `FAILED` - Booking failed or expired

---

#### 7. Get Booking Details
```
GET /api/bookings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "show_id": 1,
    "user_email": "user@example.com",
    "seats_count": 2,
    "status": "CONFIRMED",
    "show_name": "Avengers: Endgame - Screen 1",
    "start_time": "2025-12-11T15:00:00.000Z",
    "created_at": "2025-12-11T10:30:00.000Z"
  }
}
```

---

#### 8. Get User Bookings
```
GET /api/bookings?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "show_id": 1,
      "user_email": "user@example.com",
      "seats_count": 2,
      "status": "CONFIRMED",
      "show_name": "Avengers: Endgame - Screen 1",
      "start_time": "2025-12-11T15:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Concurrency Handling

The system uses PostgreSQL's row-level locking to handle concurrent bookings:

1. **Transaction Isolation**: Each booking happens within a database transaction
2. **Row Locking**: `SELECT ... FOR UPDATE` locks the show row during booking
3. **Atomic Updates**: Seat count updates are atomic within the transaction
4. **Rollback on Failure**: Any failure rolls back the entire transaction

### Example Flow:
```
User A requests 2 seats
  → Transaction starts
  → Lock show row
  → Check available seats (38 available)
  → Create booking (PENDING)
  → Update seats to 36
  → Commit transaction
  
User B requests 3 seats (concurrent)
  → Transaction starts
  → Wait for lock (User A holds it)
  → Lock acquired after User A commits
  → Check available seats (36 available)
  → Create booking (PENDING)
  → Update seats to 33
  → Commit transaction
```

## Booking Expiry

A cron job runs every minute to check for bookings that have been in `PENDING` status for more than 2 minutes:

- Marks booking as `FAILED`
- Returns seats back to available pool
- Runs atomically within a transaction

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, insufficient seats)
- `404` - Not Found
- `500` - Server Error

## Testing the Concurrency

You can test concurrent bookings using tools like:

### Using curl (multiple terminals):
```bash
# Terminal 1
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"showId":1,"userEmail":"user1@test.com","seatsCount":5}'

# Terminal 2 (run immediately after)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"showId":1,"userEmail":"user2@test.com","seatsCount":5}'
```

### Using Apache Bench:
```bash
# 10 concurrent requests
ab -n 10 -c 10 -p booking.json -T application/json http://localhost:3000/api/bookings
```

## Project Structure

```
booker-backend/
├── config/
│   └── database.js          # Database connection pool
├── controllers/
│   ├── bookingController.js # Booking business logic
│   └── showController.js    # Show business logic
├── models/
│   ├── Booking.js           # Booking model
│   └── Show.js              # Show model
├── routes/
│   ├── bookingRoutes.js     # Booking endpoints
│   └── showRoutes.js        # Show endpoints
├── scripts/
│   ├── migrate.js           # Database migrations
│   └── seed.js              # Sample data seeder
├── utils/
│   └── bookingCleanup.js    # Expiry cleanup logic
├── .env                      # Environment variables
├── .gitignore
├── package.json
├── server.js                 # Application entry point
└── README.md
```

## Future Enhancements

- Payment gateway integration
- User authentication & authorization
- Seat selection (specific seat numbers)
- Email notifications
- Admin dashboard
- Rate limiting
- API versioning
- WebSocket for real-time seat updates

## License

ISC
