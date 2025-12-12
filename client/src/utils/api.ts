export interface Show {
  id: string;
  name: string;
  type: string;
  startTime: string;
  price: number;
  totalSeats: number;
  bookedSeats: number[];
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    showId: string;
    userEmail: string;
    seats: number[];
    status: string;
  };
  error?: string;
}

const API_BASE_URL = "https://modex-backend-71wr.onrender.com/api";

// Helper function to get auth token
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  getShows: async (): Promise<Show[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/shows`);
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch shows");
    } catch (error) {
      console.error("Error fetching shows:", error);
      throw error;
    }
  },

  getShowById: async (id: string): Promise<Show | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/shows/${id}`);
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching show:", error);
      return null;
    }
  },

  createShow: async (
    showData: Omit<Show, "id" | "bookedSeats">
  ): Promise<Show> => {
    try {
      const response = await fetch(`${API_BASE_URL}/shows`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(showData),
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to create show");
    } catch (error) {
      console.error("Error creating show:", error);
      throw error;
    }
  },

  bookSeats: async (
    showId: string,
    seats: number[],
    userEmail: string
  ): Promise<BookingResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ showId, seats, userEmail }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error booking seats:", error);
      throw error;
    }
  },
};
