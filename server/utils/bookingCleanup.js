const Booking = require('../models/Booking');

// Cleanup expired bookings
// This runs via cron job every minute
async function cleanupExpiredBookings() {
  try {
    const expiredBookings = await Booking.findExpired();
    
    if (expiredBookings.length === 0) {
      return;
    }

    console.log(`🧹 Found ${expiredBookings.length} expired bookings to clean up`);

    for (const booking of expiredBookings) {
      try {
        await Booking.markAsFailed(booking.id);
        console.log(`   ✓ Booking ${booking.id} marked as FAILED and seats returned`);
      } catch (error) {
        console.error(`   ✗ Failed to cleanup booking ${booking.id}:`, error.message);
      }
    }

    console.log(`✅ Cleanup completed`);
  } catch (error) {
    console.error('Cleanup job error:', error);
  }
}

module.exports = { cleanupExpiredBookings };
