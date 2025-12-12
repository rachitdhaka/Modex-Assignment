import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Page/HomePage";
import AdminPage from "./Page/AdminPage";
import BookingPage from "./Page/BookingPage";
import LoginPage from "./Page/LoginPage";
import SignupPage from "./Page/SignupPage";
import MyBookingsPage from "./Page/MyBookingsPage";
import { Container } from "./components/Container";
import { Navbar } from "./components/Navbar";
import { GlobalProvider } from "./contexts/GlobalContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <BrowserRouter>
          <Container>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/booking/:id" element={<BookingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
            </Routes>
          </Container>
        </BrowserRouter>
      </GlobalProvider>
    </AuthProvider>
  );
}

export default App;
