import { useState } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { useAuth } from '../contexts/AuthContext';
import { AdminForm } from '../components/AdminForm';
import { api } from '../utils/api';
import { Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { shows, refreshShows } = useGlobal();
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    try {
      await api.createShow(data);
      await refreshShows();
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      alert('Failed to create show. Make sure you are logged in as admin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 hidden md:flex flex-col p-8 fixed h-full">
        <div className="text-2xl font-display font-bold mb-12">Admin.</div>
        <nav className="space-y-4 flex-1">
          <button onClick={() => setIsCreating(false)} className={`flex items-center w-full p-3 rounded-lg transition-colors ${!isCreating ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          <button onClick={() => setIsCreating(true)} className={`flex items-center w-full p-3 rounded-lg transition-colors ${isCreating ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}>
            <Plus className="w-5 h-5 mr-3" />
            Create Event
          </button>
        </nav>
        <button onClick={handleLogout} className="flex items-center text-stone-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 md:p-16">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-medium text-stone-900">
            {isCreating ? 'Create New Event' : 'Overview'}
          </h1>
        </header>

        {isCreating ? <div className="max-w-2xl bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
            <AdminForm onSubmit={handleCreate} isLoading={isSubmitting} />
          </div> : <div className="grid gap-6">
            {shows.map(show => <div key={show.id} className="bg-white p-6 rounded-xl border border-stone-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-lg">{show.name}</h3>
                    <span className="text-xs px-2 py-1 bg-stone-100 rounded-full text-stone-500">
                      {show.type}
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm">
                    {new Date(show.startTime).toLocaleDateString()} •{' '}
                    {show.bookedSeats.length} / {show.totalSeats} booked
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-medium">
                    ${show.price}
                  </div>
                  <div className="text-xs text-stone-400">per seat</div>
                </div>
              </div>)}
          </div>}
      </main>
    </div>;
}