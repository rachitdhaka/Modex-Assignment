import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Container from '../components/Container';
import { Calendar, Clock, Mail, Ticket, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  showId: string;
  showName: string;
  startTime: string;
  seats: number[];
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  userEmail: string;
  createdAt: string;
}

export default function MyBookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://modex-backend-71wr.onrender.com/api/bookings?email=${user?.email}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const result = await response.json();
        console.log('Bookings response:', result);
        setBookings(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, navigate, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-stone-500">Loading your bookings...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-stone-900 mb-2">
            My Bookings
          </h1>
          <p className="text-stone-500">
            View all your cinema ticket bookings
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-stone-500 mb-6">
              Start booking your favorite movies now!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-stone-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">
                      {booking.showName}
                    </h3>
                    <div className="space-y-2 text-sm text-stone-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.startTime).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(booking.startTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {booking.userEmail}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="text-sm font-medium">{booking.status}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500 mb-1">Seats</p>
                      <p className="font-medium text-stone-900">
                        {booking.seats.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500 mb-1">Total Seats</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {booking.seats.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-stone-400">
                  Booked on {new Date(booking.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
