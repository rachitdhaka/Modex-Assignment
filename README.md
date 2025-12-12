# Cinema Ticket Booking System

A full-stack cinema ticket booking application built with React, TypeScript, Node.js, Express, and PostgreSQL. Features user authentication, real-time seat selection, and robust concurrency handling for reliable ticket bookings.

## 🎯 Features

### Core Functionality
- **🎬 Cinema Ticket Booking**: Browse and book movie tickets across different screen types
- **🎫 Screen Types**: Support for IMAX, 3D, 4DX, and Standard screens
- **💺 Real-time Seat Selection**: Interactive seat maps with live availability updates
- **🔐 User Authentication**: Secure JWT-based login and registration system
- **📊 My Bookings**: View your complete booking history with status tracking
- **👨‍💼 Admin Dashboard**: Create and manage movie shows with different screen types
- **⚡ Concurrency Control**: Prevents race conditions and overbooking using database transactions
- **⏰ Auto-Expiry**: Pending bookings automatically expire after 2 minutes

### Technical Highlights
- ✅ **Authentication**: JWT tokens with bcrypt password hashing
- ✅ **Race Condition Prevention**: Row-level locking with `SELECT FOR UPDATE`
- ✅ **ACID Transactions**: Atomic booking operations
- ✅ **RESTful API**: Clean, documented endpoints
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Responsive UI**: Modern design with TailwindCSS 4
- ✅ **State Management**: React Context API for global state

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Modex-Assignment
```

2. **Set up the database**
```bash
cd server
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

Example `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booker
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

3. **Install dependencies**
```bash
# Server
cd server
npm install

# Client (in a new terminal)
cd client
npm install
```

4. **Initialize the database**
```bash
cd server
npm run reset   # Creates tables (users, shows, bookings)
npm run seed    # Adds sample data (movies and test users)
```

5. **Start the application**
```bash
# Terminal 1 - Start backend (from server/)
npm run dev

# Terminal 2 - Start frontend (from client/)
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

7. **Test Accounts** (after seeding)
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## 📁 Project Structure

```
Modex-Assignment/
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── AdminForm.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── SeatSelector.tsx
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── GlobalContext.tsx
│   │   ├── Page/             # Main pages
│   │   │   ├── HomePage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── MyBookingsPage.tsx
│   │   └── utils/
│   │       └── api.ts        # API client
│   └── package.json
│
├── server/                    # Node.js + Express backend
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   └── showController.js
│   ├── models/               # Database models
│   │   ├── User.js
│   │   ├── Booking.js
│   │   └── Show.js
│   ├── routes/               # API endpoints
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── showRoutes.js
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── scripts/              # Database utilities
│   │   ├── migrate.js
│   │   ├── reset.js
│   │   └── seed.js
│   ├── utils/
│   │   └── bookingCleanup.js # Background job for expiry
│   └── package.json
│
├── SYSTEM_DESIGN.md          # Architecture documentation
└── README.md
```

## 🔌 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Shows (Movies)

#### Get All Shows
```http
GET /api/shows
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Avengers: Endgame",
      "type": "Standard",
      "startTime": "2025-12-12T18:00:00Z",
      "price": 15.00,
      "totalSeats": 40,
      "bookedSeats": [1, 2, 5]
    }
  ]
}
```

#### Get Single Show
```http
GET /api/shows/:id
```

#### Create Show (Admin Only)
```http
POST /api/shows
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Inception",
  "type": "IMAX",
  "startTime": "2025-12-15T20:00:00Z",
  "price": 20.00,
  "totalSeats": 60
}
```

**Screen Types**: IMAX, 3D, 4DX, Standard

### Bookings

#### Create Booking (Authentication Optional but Recommended)
```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "showId": "1",
  "userEmail": "user@example.com",
  "seats": [10, 11, 12]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "123",
    "showId": "1",
    "userId": 1,
    "userEmail": "user@example.com",
    "seats": [10, 11, 12],
    "status": "PENDING"
  }
}
```

#### Get Booking Details
```http
GET /api/bookings/:id
```

#### Get User Bookings
```http
GET /api/bookings?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "showId": "1",
      "showName": "Avengers: Endgame",
      "startTime": "2025-12-12T18:00:00Z",
      "userEmail": "user@example.com",
      "seats": [10, 11, 12],
      "status": "CONFIRMED",
      "createdAt": "2025-12-12T10:00:00Z"
    }
  ],
  "count": 1
}
```

## 🎨 Usage Guide

### For Users

1. **Register/Login**:
   - Click "Sign Up" to create an account or "Login" if you have one
   - Use demo account: user@example.com / user123

2. **Browse Movies**: 
   - Visit the homepage to see all available movies
   - Filter by screen type: All, IMAX, 3D, 4DX, Standard

3. **Book Tickets**:
   - Click on any movie card
   - **Login Required**: You'll be prompted to login if not authenticated
   - Select your preferred seats from the interactive seat map
   - Your email will be auto-filled from your account
   - Click "Book Seats" to confirm
   - See instant confirmation or error feedback

4. **View Bookings**:
   - Click "My Bookings" in the navbar
   - See all your bookings with status (PENDING, CONFIRMED, FAILED)
   - View seat details and show information

### For Admins

1. **Access Admin Panel**: 
   - Login with admin account: admin@example.com / admin123
   - Click "Admin" in the navigation bar

2. **Create Movies**:
   - Click "Create Event" in the sidebar
   - Fill in movie details:
     - Name (e.g., "Inception")
     - Screen Type (IMAX, 3D, 4DX, or Standard)
     - Start Time
     - Price per seat
     - Total Seats
   - Click "Create Show"

3. **View Dashboard**:
   - See all movies with booking statistics
   - Monitor seat availability and pricing

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with 7-day expiry
- **Protected Routes**: Admin-only endpoints require authentication
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Express-validator for request validation

## 🏗️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Shows Table
```sql
CREATE TABLE shows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,  -- IMAX, 3D, 4DX, Standard
  start_time TIMESTAMP NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total_seats INTEGER NOT NULL,
  booked_seats INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id),
  user_id INTEGER REFERENCES users(id),
  user_email VARCHAR(255) NOT NULL,
  seats INTEGER[] NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
   - Click "Create Event" in the sidebar
   - Fill in event details (name, type, date/time, price, seats)
   - Submit to create
3. **View Dashboard**: Monitor all events and their booking status

## 🔒 Concurrency Handling

The system prevents overbooking through multiple layers of protection:

1. **Database Transactions**: All booking operations are wrapped in ACID transactions
2. **Row-Level Locking**: `SELECT FOR UPDATE` ensures exclusive access during booking
3. **Atomic Operations**: Seat availability checks and updates happen atomically
4. **Conflict Detection**: Real-time validation of seat availability before confirmation
5. **Background Cleanup**: Cron job runs every minute to expire pending bookings after 2 minutes

### Example Transaction Flow:
```sql
BEGIN;
-- Lock the show row for exclusive access
SELECT * FROM shows WHERE id = $1 FOR UPDATE;
-- Validate seat availability
-- Update booked seats atomically
UPDATE shows SET booked_seats = array_cat(booked_seats, $seats);
INSERT INTO bookings (show_id, user_id, user_email, seats, status) 
VALUES ($1, $2, $3, $4, 'PENDING');
COMMIT;
```

## 🧪 Testing

### Manual Testing Scenarios

1. **Concurrent Bookings**: 
   - Open multiple browser tabs
   - Try booking the same seats simultaneously
   - Only one should succeed, others get "already booked" error

2. **Booking Expiry**: 
   - Create a booking without confirming payment
   - Wait 2+ minutes
   - Seats should become available again automatically

3. **Authentication Flow**:
   - Try accessing "My Bookings" without login → redirected to login page
   - Login and verify user info appears in navbar
   - Try booking without login → prompted to login first

4. **Screen Type Filtering**:
   - Use category tabs to filter by IMAX, 3D, 4DX, Standard
   - Verify movies display with correct color-coded badges

### API Testing

Import the Postman collection from `server/postman_collection.json`

**Quick Test Commands:**
```bash
# Get all shows
curl http://localhost:3000/api/shows

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'

# Create booking (replace <token> with JWT from login)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"showId":"1","userEmail":"user@example.com","seats":[5,6,7]}'
```

## 🚀 Deployment

The application is deployment-ready for cloud platforms:

### Recommended Stack
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: Railway, Render, or AWS Elastic Beanstalk  
- **Database**: AWS RDS PostgreSQL, Supabase, or Heroku Postgres

### Environment Setup

**Server (.env)**:
```env
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=cinema_booking
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=production
```

**Client (vite.config.ts)**:
```typescript
// Update proxy target for production
server: {
  proxy: {
    '/api': {
      target: 'https://your-backend.com',
      changeOrigin: true,
    }
  }
}
```

### Build Commands

```bash
# Client build
cd client
npm run build
# Output: dist/

# Server (no build needed, just ensure dependencies installed)
cd server
npm install --production
npm start
```

## 🎯 Key Technical Decisions

1. **JWT Authentication**: 
   - Stateless authentication with 7-day token expiry
   - Allows horizontal scaling without session storage

2. **PostgreSQL Array Fields**: 
   - `booked_seats` stored as INTEGER[] for efficient queries
   - Enables atomic array operations and flexible seat management

3. **React Context API**: 
   - Global state management for user auth and show data
   - Lightweight alternative to Redux for this application size

4. **Optional Authentication for Booking**:
   - Guests can book with email (backward compatible)
   - Logged-in users get enhanced features (booking history)
   - Flexibility for different use cases

5. **Screen Type Categories**:
   - Changed from generic "Movie" type to specific screen types
   - Better reflects real cinema operations (IMAX, 3D, 4DX)
   - Enables price differentiation by screen quality

6. **Background Job for Cleanup**:
   - Node-cron for automatic expiry of pending bookings
   - Prevents seat blocking indefinitely
   - Production-ready with proper error handling

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Styling
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Node-cron** - Background jobs
- **Dotenv** - Environment configuration

## 📝 Future Enhancements

### High Priority
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications (booking confirmations)
- [ ] QR code tickets
- [ ] Booking cancellation/refunds

### Medium Priority
- [ ] Admin analytics dashboard (revenue, popular shows)
- [ ] User reviews and ratings
- [ ] Seat pricing tiers (premium seats)
- [ ] Mobile responsive improvements

### Low Priority
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Social media sharing

## 🤝 Contributing

This is a demonstration project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - free to use for learning and development purposes.

## 📞 Support

For issues or questions:
- Open an issue in the repository
- Check [SYSTEM_DESIGN.md](./server/SYSTEM_DESIGN.md) for architecture details

---

**Built with ❤️ as a full-stack demonstration project**


# Modex-Assignment
