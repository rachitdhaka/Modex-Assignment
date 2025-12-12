import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';

interface Show {
  id: string;
  name: string;
  type: string;
  startTime: string;
  totalSeats: number;
  bookedSeats: number[];
  price: number;
}

interface ShowCardProps {
  show: Show;
  index: number;
}
export function Card({
  show,
  index
}: ShowCardProps) {
  const date = new Date(show.startTime);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const availableSeats = show.totalSeats - show.bookedSeats.length;
  // Staggered animation delay based on index
  const style = {
    animationDelay: `${index * 100}ms`
  };

  return <Link to={`/booking/${show.id}`} className="group block relative bg-white rounded-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl border border-stone-100 animate-slide-up" style={style}>
      <div className="flex justify-between items-start mb-8">
        <span className={`
          px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase
          ${show.type === 'Movie' ? 'bg-purple-100 text-purple-700' : ''}
          ${
            show.type === 'IMAX' ? 'bg-purple-100 text-purple-700' :
            show.type === '3D' ? 'bg-blue-100 text-blue-700' :
            show.type === '4DX' ? 'bg-red-100 text-red-700' :
            'bg-stone-100 text-stone-700'
          }
        `}>
          {show.type}
        </span>
        <span className="text-stone-400 font-mono text-sm">${show.price}</span>
      </div>

      <h3 className="text-2xl font-display font-medium text-stone-900 mb-2 group-hover:text-sage-600 transition-colors">
        {show.name}
      </h3>

      <div className="flex items-center text-stone-500 text-sm mb-8 space-x-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {formattedDate}, {formattedTime}
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-stone-100 pt-6">
        <div className="flex items-center text-stone-500 text-sm">
          <Users className="w-4 h-4 mr-2" />
          <span>{availableSeats} seats left</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-sage-500 group-hover:text-white transition-all duration-300">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>;
}