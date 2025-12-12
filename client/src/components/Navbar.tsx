import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  console.log('Navbar render - user:', user, 'isAdmin:', isAdmin);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navlinks = [
    { name: "Home", href: "/" },
    { name: "My Bookings", href: "/my-bookings", authRequired: true },
  ];
  
  return (
    <div className="relative z-10 max-w-5xl mt-2 mx-auto px-4 py-2 flex justify-between items-center rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-sm">
      <div>
        <Link to="/" className="font-display font-bold text-xl text-stone-900 dark:text-stone-100">
          Ticket.
        </Link>
      </div>
      <div className="flex gap-8">
        {navlinks.map((link, index) => {
          // Hide auth-required links if not authenticated
          if (link.authRequired && !user) return null;
          
          return (
            <Link
              key={index}
              to={link.href}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              {link.name}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Admin
          </Link>
        )}
      </div>

      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {user.name}
              </span>
              {isAdmin && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-700 text-white text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
