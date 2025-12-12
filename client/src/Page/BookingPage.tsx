import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SeatSelector } from "../components/SeatSelector";
import { BookingStatus } from "../components/BookingStatus";
import { ArrowLeft, Clock, MapPin, Calendar, LogIn } from "lucide-react";
import { api } from "../utils/api";
import type { Show } from "../utils/api";
import { useGlobal } from "../contexts/GlobalContext";
import { useAuth } from "../contexts/AuthContext";

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCachedShow, refreshShows } = useGlobal();
  const { user, isAuthenticated } = useAuth();
  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [bookingState, setBookingState] = useState<
    "IDLE" | "PENDING" | "CONFIRMED" | "FAILED"
  >("IDLE");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Set email from authenticated user
  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    
    const fetchShow = async () => {
      try {
        setIsLoading(true);
        // Try to get from cache first
        const cached = getCachedShow(id);
        if (cached) {
          setShow(cached);
          setIsLoading(false);
          return;
        }
        
        // Fetch from API if not in cache
        const fetchedShow = await api.getShowById(id);
        if (fetchedShow) {
          setShow(fetchedShow);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching show:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShow();
  }, [id, navigate, getCachedShow]);

  const handleBooking = async () => {
    // Require authentication before booking
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${id}` } });
      return;
    }
    
    if (!show || selectedSeats.length === 0 || !userEmail) return;
    
    setBookingState("PENDING");
    setErrorMsg("");
    
    try {
      const result = await api.bookSeats(show.id, selectedSeats, userEmail);
      
      if (result.success) {
        setBookingState("CONFIRMED");
        // Refresh shows to update the global state
        await refreshShows();
      } else {
        setBookingState("FAILED");
        setErrorMsg(result.error || "Booking failed. Please try again.");
      }
    } catch (err: any) {
      setBookingState("FAILED");
      setErrorMsg(err.message || "Booking failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return <div>Show not found</div>;
  }

  const totalPrice = (selectedSeats.length * show.price).toFixed(2);

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel: Visuals */}
      <div className="flex-1 bg-stone-50 p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden">
        <button
          onClick={() => navigate("/")}
          className="absolute top-8 left-8 flex items-center text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="w-full max-w-3xl animate-fade-in">
          <h2 className="text-center text-stone-400 text-sm uppercase tracking-widest mb-8">
            Select Your Seats
          </h2>
          <SeatSelector
            totalSeats={show.totalSeats}
            bookedSeats={show.bookedSeats}
            maxSelectable={10}
            onSelectionChange={setSelectedSeats}
          />
        </div>
      </div>

      {/* Right Panel: Details & Action */}
      <div className="w-full lg:w-[400px] xl:w-[500px] border-l border-stone-100 p-8 lg:p-12 flex flex-col bg-white z-10 shadow-xl lg:shadow-none">
        <div className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-sage-50 text-sage-700 text-xs font-medium mb-4">
            {show.type}
          </span>
          <h1 className="text-3xl font-display font-medium text-stone-900 mb-6">
            {show.name}
          </h1>

          <div className="space-y-4 text-stone-500 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-3" />
              {new Date(show.startTime).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-3" />
              {new Date(show.startTime).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-3" />
              Cinema Hall A
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {bookingState === "IDLE" && (
            <div className="space-y-4">
              {!isAuthenticated && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login Required</span>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">
                    Please login to book tickets.
                  </p>
                  <button
                    onClick={() => navigate('/login', { state: { from: `/booking/${id}` } })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Login to Continue
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email Address {isAuthenticated && <span className="text-green-600">(Logged in)</span>}
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 disabled:bg-stone-100 disabled:cursor-not-allowed"
                  required
                  disabled={isAuthenticated}
                  readOnly={isAuthenticated}
                />
              </div>
            </div>
          )}

          {selectedSeats.length > 0 ? (
            <div className="bg-stone-50 rounded-xl p-6 animate-slide-up">
              <div className="flex justify-between mb-2 text-sm text-stone-500">
                <span>Selected Seats</span>
                <span>
                  {selectedSeats.length} x ${show.price}
                </span>
              </div>
              <div className="text-xs text-stone-400 mb-2">
                Seats: {selectedSeats.join(", ")}
              </div>
              <div className="flex justify-between text-xl font-medium text-stone-900 pt-4 border-t border-stone-200">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-stone-400 text-sm border-2 border-dashed border-stone-100 rounded-xl">
              Select seats from the map
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {bookingState !== "IDLE" && (
            <BookingStatus status={bookingState} message={errorMsg} />
          )}

          {bookingState !== "CONFIRMED" && (
            <button
              onClick={handleBooking}
              disabled={
                selectedSeats.length === 0 || 
                !userEmail || 
                bookingState === "PENDING"
              }
              className={`
                w-full py-4 rounded-xl font-medium text-lg transition-all duration-300
                ${
                  selectedSeats.length > 0 && userEmail
                    ? "bg-stone-900 text-white hover:bg-sage-600 shadow-lg hover:shadow-sage-200"
                    : "bg-stone-100 text-stone-400 cursor-not-allowed"
                }
              `}
            >
              {bookingState === "PENDING" ? "Processing..." : "Confirm Booking"}
            </button>
          )}

          {bookingState === "CONFIRMED" && (
            <button
              onClick={() => navigate("/")}
              className="w-full py-4 rounded-xl font-medium text-lg bg-white border-2 border-stone-900 text-stone-900 hover:bg-stone-50 transition-all"
            >
              Book Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
