# System Design Document: Scaling the Ticket Booking System

## Executive Summary

This document outlines the architecture and scaling strategies for evolving the current ticket booking system into a production-grade platform similar to RedBus or BookMyShow, capable of handling millions of users and thousands of concurrent bookings.

## Current Architecture Overview

### System Components

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Express.js API    │
│  (Node.js Server)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   PostgreSQL DB     │
│  (Single Instance)  │
└─────────────────────┘
```

### Current Concurrency Strategy

1. **Row-Level Locking**: Using `SELECT ... FOR UPDATE` to lock show records during booking
2. **Database Transactions**: ACID compliance ensures atomic operations
3. **Cron-based Cleanup**: Periodic job to handle expired bookings

This works well for moderate traffic but won't scale to production levels.

---

## Production-Grade Architecture

### High-Level System Design

```
                        ┌──────────────────┐
                        │   CDN (Static)   │
                        └──────────────────┘
                                 │
                   ┌─────────────┴──────────────┐
                   │                            │
            ┌──────▼──────┐            ┌───────▼────────┐
            │ Web Clients │            │ Mobile Clients │
            └──────┬──────┘            └───────┬────────┘
                   │                            │
                   └─────────────┬──────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Load Balancer  │
                        │   (AWS ALB)     │
                        └────────┬────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │             │             │
            ┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
            │  API Server │ │  API   │ │  API Server │
            │   Node 1    │ │ Node 2 │ │   Node 3    │
            └──────┬──────┘ └───┬────┘ └──────┬──────┘
                   │             │             │
                   └─────────────┼─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        │                        │                        │
   ┌────▼─────┐          ┌──────▼──────┐         ┌──────▼──────┐
   │  Cache   │          │   Message   │         │  Database   │
   │  Redis   │          │    Queue    │         │   Cluster   │
   │ Cluster  │          │   (Kafka)   │         │  Postgres   │
   └──────────┘          └─────────────┘         └─────────────┘
```

---

## 1. Database Design & Scaling

### Schema Design

**Current Schema** (Good foundation):
- `shows` - Show/trip information
- `bookings` - Booking records

**Additional Tables for Production**:

```sql
-- Users table (authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seats table (for specific seat selection)
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id),
  seat_number VARCHAR(10) NOT NULL,
  row_number VARCHAR(5),
  is_available BOOLEAN DEFAULT TRUE,
  booking_id INTEGER REFERENCES bookings(id),
  UNIQUE(show_id, seat_number)
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues/Theaters
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  total_screens INTEGER
);
```

### Scaling Strategies

#### 1. Read Replicas (Horizontal Read Scaling)

```
┌─────────────────┐
│  Primary DB     │ ◄──── Writes
│  (Master)       │
└────────┬────────┘
         │ Replication
    ┌────┴────┬────────────┐
    │         │            │
┌───▼───┐ ┌──▼────┐ ┌─────▼──┐
│Replica│ │Replica│ │Replica │ ◄──── Reads
│  1    │ │  2    │ │   3    │
└───────┘ └───────┘ └────────┘
```

**Strategy**:
- Write operations (bookings, updates) → Primary
- Read operations (show listings, user bookings) → Replicas
- Use connection pooling to distribute read load

#### 2. Sharding (Horizontal Write Scaling)

**Sharding by Geography**:
```
Shows in Mumbai → Shard 1
Shows in Delhi → Shard 2
Shows in Bangalore → Shard 3
```

**Sharding by Date**:
```
Shows in Dec 2025 → Shard 1
Shows in Jan 2026 → Shard 2
```

**Implementation**:
- Use PostgreSQL partitioning (native in PG 10+)
- Application-level routing based on shard key
- Consistent hashing for even distribution

#### 3. Indexing Strategy

```sql
-- Critical indexes for performance
CREATE INDEX idx_shows_city_time ON shows(city, start_time) WHERE available_seats > 0;
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_seats_show_available ON seats(show_id, is_available);
CREATE INDEX idx_shows_venue ON shows(venue_id, start_time);

-- Partial indexes for common queries
CREATE INDEX idx_pending_bookings ON bookings(created_at) 
  WHERE status = 'PENDING';
```

---

## 2. Concurrency Control at Scale

### Problem with Current Approach

Row-level locks work but create bottlenecks:
- High contention for popular shows
- Database becomes a bottleneck
- Limited to ~1000 concurrent requests

### Multi-Layer Concurrency Strategy

#### Layer 1: Application-Level Queue (Immediate)

```javascript
// Using Redis-backed queue
const Queue = require('bull');
const bookingQueue = new Queue('bookings', {
  redis: { host: 'redis-host', port: 6379 }
});

// Add to queue instead of direct processing
app.post('/api/bookings', async (req, res) => {
  const job = await bookingQueue.add({
    showId: req.body.showId,
    userId: req.user.id,
    seats: req.body.seatsCount
  });
  
  res.json({
    success: true,
    jobId: job.id,
    message: 'Booking request queued'
  });
});

// Process jobs with concurrency control
bookingQueue.process(10, async (job) => {
  // Process booking with DB transaction
  return await processBooking(job.data);
});
```

**Benefits**:
- Controlled concurrency (10 parallel bookings)
- Job retry on failure
- Better monitoring

#### Layer 2: Optimistic Locking

Instead of blocking, use version numbers:

```sql
ALTER TABLE shows ADD COLUMN version INTEGER DEFAULT 0;

-- Update with version check
UPDATE shows 
SET available_seats = available_seats - $1,
    version = version + 1
WHERE id = $2 AND version = $3 AND available_seats >= $1
RETURNING *;
```

If version mismatch → retry logic in application

#### Layer 3: Distributed Locks (Redis)

For high-traffic shows:

```javascript
const Redlock = require('redlock');
const redlock = new Redlock([redisClient]);

async function bookSeats(showId, seats) {
  const lock = await redlock.lock(`show:${showId}`, 1000);
  
  try {
    // Check and book seats
    // ...
  } finally {
    await lock.unlock();
  }
}
```

#### Layer 4: Event Sourcing (Advanced)

Store all booking attempts as events:

```
Event Stream:
- BookingRequested (showId: 1, seats: 2, userId: 123)
- SeatsReserved (showId: 1, seats: 2)
- PaymentCompleted (bookingId: 456)
- BookingConfirmed (bookingId: 456)
```

Rebuild state by replaying events. Use Kafka or EventStore.

---

## 3. Caching Strategy

### Multi-Level Cache Architecture

```
┌─────────────┐
│   Client    │
│   Cache     │  ◄── Browser/App cache (5 min)
└──────┬──────┘
       │
┌──────▼──────┐
│   CDN       │  ◄── Edge cache for static content
└──────┬──────┘
       │
┌──────▼──────┐
│ Application │
│  Cache      │  ◄── Redis (hot data)
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │
└─────────────┘
```

### Cache Layers

#### 1. Redis Cache (Primary)

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache show listings (TTL: 2 minutes)
async function getAvailableShows(city) {
  const cacheKey = `shows:available:${city}`;
  
  let shows = await client.get(cacheKey);
  if (shows) {
    return JSON.parse(shows);
  }
  
  shows = await db.query('SELECT * FROM shows WHERE city = $1...', [city]);
  await client.setex(cacheKey, 120, JSON.stringify(shows));
  
  return shows;
}

// Invalidate cache on booking
async function onBookingConfirmed(showId) {
  const show = await getShow(showId);
  await client.del(`shows:available:${show.city}`);
  await client.del(`show:${showId}`);
}
```

#### 2. Cache Strategies

**Cache-Aside** (for show details):
- Check cache first
- On miss, query DB and populate cache

**Write-Through** (for user data):
- Write to cache and DB simultaneously

**Time-Based Invalidation**:
- Show listings: 2-minute TTL
- Show details: 1-minute TTL
- User bookings: 5-minute TTL

#### 3. Real-Time Updates via WebSocket

For live seat availability:

```javascript
// Publish seat update
await redis.publish('show:123:updates', JSON.stringify({
  availableSeats: 35,
  timestamp: Date.now()
}));

// Clients subscribe via WebSocket
io.on('connection', (socket) => {
  socket.on('subscribe:show', (showId) => {
    socket.join(`show:${showId}`);
  });
});

// Broadcast on booking
io.to(`show:${showId}`).emit('seats:updated', { availableSeats });
```

---

## 4. Message Queue Architecture

### Why Message Queues?

- **Decoupling**: API servers don't wait for heavy operations
- **Reliability**: Retry failed operations
- **Scalability**: Process jobs in parallel
- **Peak Handling**: Queue absorbs traffic spikes

### Kafka-Based Architecture

```
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │ Produce
       ▼
┌──────────────────────────────────┐
│         Kafka Cluster            │
│  ┌─────────────────────────────┐ │
│  │  Topic: booking.requests    │ │
│  ├─────────────────────────────┤ │
│  │  Topic: payment.events      │ │
│  ├─────────────────────────────┤ │
│  │  Topic: notification.queue  │ │
│  └─────────────────────────────┘ │
└──────────┬───────────────────────┘
           │ Consume
    ┌──────┴───────┬──────────────┐
    │              │              │
┌───▼────┐   ┌─────▼──┐   ┌──────▼─────┐
│Booking │   │Payment │   │Notification│
│Service │   │Service │   │  Service   │
└────────┘   └────────┘   └────────────┘
```

### Event Flow

```javascript
// Producer (API Server)
await kafka.send({
  topic: 'booking.requests',
  messages: [{
    key: showId,
    value: JSON.stringify({
      showId,
      userId,
      seats,
      timestamp: Date.now()
    })
  }]
});

// Consumer (Booking Service)
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const booking = JSON.parse(message.value);
    await processBooking(booking);
    
    // Emit follow-up events
    await kafka.send({
      topic: 'payment.events',
      messages: [{
        value: JSON.stringify({
          bookingId: booking.id,
          amount: calculateAmount(booking)
        })
      }]
    });
  }
});
```

### Benefits

- Booking confirmed in <100ms (API just enqueues)
- Payment processed asynchronously
- Email sent independently
- Each service scales independently

---

## 5. Deployment & Infrastructure

### Container Orchestration (Kubernetes)

```yaml
# Deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-api
spec:
  replicas: 5  # Auto-scale based on load
  selector:
    matchLabels:
      app: booking-api
  template:
    spec:
      containers:
      - name: api
        image: booking-api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
```

### Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: booking-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: booking-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Load Balancer Configuration

- **Geographic Distribution**: Route users to nearest region
- **Health Checks**: Remove unhealthy instances
- **Connection Draining**: Graceful shutdown
- **SSL Termination**: Handle HTTPS at load balancer

---

## 6. Monitoring & Observability

### Key Metrics to Track

**Application Metrics**:
- Booking success rate
- API response times (p50, p95, p99)
- Queue depth
- Active connections

**Infrastructure Metrics**:
- CPU/Memory usage
- Database connections
- Cache hit ratio
- Network latency

**Business Metrics**:
- Bookings per minute
- Revenue per hour
- Conversion rate
- Popular shows

### Tools

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log aggregation
- **Sentry**: Error tracking
- **New Relic/DataDog**: APM

---

## 7. Security Considerations

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many booking attempts'
});

app.use('/api/bookings', limiter);
```

### Authentication

- JWT-based authentication
- OAuth for social login
- API key for partners

### Data Protection

- Encrypt sensitive data (PII)
- PCI DSS compliance for payments
- GDPR compliance for EU users

---

## 8. Disaster Recovery

### Backup Strategy

- **Database**: Automated daily backups, point-in-time recovery
- **File Storage**: Replicated across regions
- **Config**: Version controlled in Git

### High Availability

- Multi-AZ deployment (99.99% uptime)
- Automated failover
- Circuit breakers for external services

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Booking Success Rate | > 99.9% |
| System Uptime | > 99.99% |
| Database Query Time | < 50ms |
| Cache Hit Rate | > 90% |
| Concurrent Bookings | 10,000/sec |

---

## Migration Path

### Phase 1: Immediate (1-2 months)
- Add Redis caching
- Implement read replicas
- Add message queue for bookings
- Containerize application

### Phase 2: Short-term (3-6 months)
- Database sharding by geography
- Implement microservices (booking, payment, notification)
- Add Kafka for event streaming
- Deploy to Kubernetes

### Phase 3: Long-term (6-12 months)
- Multi-region deployment
- Event sourcing architecture
- ML-based demand prediction
- Real-time analytics

---

## Conclusion

Scaling from the current implementation to a production-grade system like BookMyShow requires:

1. **Database optimization**: Sharding, replicas, indexing
2. **Caching layers**: Redis for hot data, CDN for static content
3. **Async processing**: Message queues to decouple services
4. **Distributed systems**: Microservices, event-driven architecture
5. **Infrastructure**: Kubernetes, auto-scaling, multi-region

The current foundation (transactions, row locks) is solid. The key is adding layers progressively without disrupting existing functionality.
